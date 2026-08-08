// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title ClearRailCore
 * @notice Central protocol contract for ClearRail workforce compliance, real ERC-20 payroll escrow, settlement, and RWA financing notes.
 */
contract ClearRailCore is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    // Enums
    enum PayrollStatus { DRAFT, FUNDED, SETTLED, BLOCKED, RECOVERED }
    enum NoteStatus { ISSUED, FUNDED, REPAID, DEFAULTED }

    // Structs
    struct Worker {
        string fullName;
        string trade;
        bool isRegistered;
        bool isRevoked;
    }

    struct Employer {
        string name;
        string industry;
        bool isRegistered;
    }

    struct PayrollBatch {
        uint256 batchId;
        address employer;
        uint256 totalAmount;
        address tokenAddress;
        uint256 workerCount;
        PayrollStatus status;
        uint256 createdAt;
        uint256 settledAt;
        string complianceReportHash;
    }

    struct PaymentInstruction {
        address worker;
        uint256 amount;
        bool settled;
        bool blocked;
        string complianceReason;
    }

    struct FinancingNote {
        uint256 noteId;
        uint256 batchId;
        address issuer;
        address investor;
        uint256 principal;
        uint256 repaymentAmount;
        uint256 interestRate;
        uint256 maturityDate;
        NoteStatus status;
        uint256 fundedAt;
    }

    // State variables
    uint256 public nextBatchId = 1;
    uint256 public nextNoteId = 1;

    mapping(address => Worker) public workers;
    mapping(address => Employer) public employers;
    mapping(uint256 => PayrollBatch) public batches;
    mapping(uint256 => PaymentInstruction[]) public batchPayments;
    mapping(uint256 => FinancingNote) public notes;
    mapping(address => uint256) public capitalProviderExposure;
    mapping(string => string) public auditAnchors;
    mapping(bytes32 => bool) public usedNonces;

    // Events (16 canonical events)
    event WorkerRegistered(address indexed worker, string fullName, string trade);
    event WorkerCredentialUpdated(address indexed worker, bool isRevoked);
    event EmployerRegistered(address indexed employer, string name);
    event WorkProofAnchored(string indexed proofHash, string workerId);
    event BatchCreated(uint256 indexed batchId, address indexed employer, uint256 totalAmount);
    event EscrowFunded(uint256 indexed batchId, address indexed tokenAddress, uint256 amount);
    event ComplianceApproved(uint256 indexed batchId, uint256 indexed paymentIndex, address worker);
    event ComplianceBlocked(uint256 indexed batchId, uint256 indexed paymentIndex, address worker, string reason);
    event PaymentReleased(uint256 indexed batchId, uint256 indexed paymentIndex, address indexed worker, uint256 amount);
    event PaymentBlocked(uint256 indexed batchId, uint256 indexed paymentIndex, address indexed worker, uint256 amount, string reason);
    event EscrowRecovered(uint256 indexed batchId, address indexed recipient, uint256 amount);
    event FinancingNoteIssued(uint256 indexed noteId, uint256 indexed batchId, address indexed issuer, uint256 principal);
    event FinancingFunded(uint256 indexed noteId, address indexed investor);
    event FinancingRepaid(uint256 indexed noteId);
    event AuditAnchored(string indexed dataHash, string description);
    event ProtocolPaused(bool isPaused);

    constructor(address _admin, address _registrar) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(REGISTRAR_ROLE, _registrar);
    }

    function setPaused(bool _paused) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_paused) {
            _pause();
        } else {
            _unpause();
        }
        emit ProtocolPaused(_paused);
    }

    // Workforce Identity & Registration
    function registerWorker(address _worker, string calldata _fullName, string calldata _trade) external onlyRole(REGISTRAR_ROLE) {
        workers[_worker] = Worker(_fullName, _trade, true, false);
        emit WorkerRegistered(_worker, _fullName, _trade);
    }

    function updateWorkerStatus(address _worker, bool _isRevoked) external onlyRole(REGISTRAR_ROLE) {
        workers[_worker].isRevoked = _isRevoked;
        emit WorkerCredentialUpdated(_worker, _isRevoked);
    }

    function registerEmployer(address _employer, string calldata _name, string calldata _industry) external onlyRole(REGISTRAR_ROLE) {
        employers[_employer] = Employer(_name, _industry, true);
        emit EmployerRegistered(_employer, _name);
    }

    function anchorWorkProof(string calldata _proofHash, string calldata _workerId) external whenNotPaused {
        auditAnchors[_proofHash] = _workerId;
        emit WorkProofAnchored(_proofHash, _workerId);
    }

    // Payroll Batching & Real Token Escrow
    function createPayrollBatch(
        address[] calldata _workers,
        uint256[] calldata _amounts,
        address _tokenAddress
    ) external whenNotPaused returns (uint256) {
        require(_workers.length == _amounts.length && _workers.length > 0, "Mismatched or empty arrays");
        uint256 batchId = nextBatchId++;
        uint256 total = 0;

        for (uint256 i = 0; i < _workers.length; i++) {
            total += _amounts[i];
            batchPayments[batchId].push(PaymentInstruction(_workers[i], _amounts[i], false, false, ""));
        }

        batches[batchId] = PayrollBatch(
            batchId,
            msg.sender,
            total,
            _tokenAddress,
            _workers.length,
            PayrollStatus.DRAFT,
            block.timestamp,
            0,
            ""
        );

        emit BatchCreated(batchId, msg.sender, total);
        return batchId;
    }

    function fundBatch(uint256 _batchId) external nonReentrant whenNotPaused {
        PayrollBatch storage batch = batches[_batchId];
        require(batch.employer == msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not employer");
        require(batch.status == PayrollStatus.DRAFT, "Batch not in DRAFT");

        batch.status = PayrollStatus.FUNDED;
        IERC20(batch.tokenAddress).safeTransferFrom(msg.sender, address(this), batch.totalAmount);

        emit EscrowFunded(_batchId, batch.tokenAddress, batch.totalAmount);
    }

    // Compliance Attested Settlement
    function releasePayment(
        uint256 _batchId,
        uint256 _paymentIndex,
        bytes calldata _signature,
        uint256 _nonce,
        uint256 _deadline
    ) external nonReentrant whenNotPaused {
        require(block.timestamp <= _deadline, "Attestation expired");
        bytes32 nonceHash = keccak256(abi.encodePacked(_batchId, _paymentIndex, _nonce));
        require(!usedNonces[nonceHash], "Nonce already used");
        usedNonces[nonceHash] = true;

        PayrollBatch storage batch = batches[_batchId];
        require(batch.status == PayrollStatus.FUNDED, "Batch not funded in escrow");

        PaymentInstruction storage payment = batchPayments[_batchId][_paymentIndex];
        require(!payment.settled && !payment.blocked, "Already processed");

        // Verify Server Signature from Registrar
        bytes32 messageHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encodePacked(_batchId, _paymentIndex, payment.worker, payment.amount, true, _nonce, _deadline))
        ));
        address signer = messageHash.recover(_signature);
        require(hasRole(REGISTRAR_ROLE, signer) || hasRole(DEFAULT_ADMIN_ROLE, signer), "Invalid compliance signature");

        payment.settled = true;
        IERC20(batch.tokenAddress).safeTransfer(payment.worker, payment.amount);

        emit ComplianceApproved(_batchId, _paymentIndex, payment.worker);
        emit PaymentReleased(_batchId, _paymentIndex, payment.worker, payment.amount);
    }

    function blockPayment(
        uint256 _batchId,
        uint256 _paymentIndex,
        string calldata _reason,
        bytes calldata _signature,
        uint256 _nonce,
        uint256 _deadline
    ) external nonReentrant whenNotPaused {
        require(block.timestamp <= _deadline, "Attestation expired");
        bytes32 nonceHash = keccak256(abi.encodePacked(_batchId, _paymentIndex, _nonce));
        require(!usedNonces[nonceHash], "Nonce already used");
        usedNonces[nonceHash] = true;

        PayrollBatch storage batch = batches[_batchId];
        require(batch.status == PayrollStatus.FUNDED, "Batch not funded");

        PaymentInstruction storage payment = batchPayments[_batchId][_paymentIndex];
        require(!payment.settled && !payment.blocked, "Already processed");

        bytes32 messageHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encodePacked(_batchId, _paymentIndex, payment.worker, payment.amount, false, _nonce, _deadline))
        ));
        address signer = messageHash.recover(_signature);
        require(hasRole(REGISTRAR_ROLE, signer) || hasRole(DEFAULT_ADMIN_ROLE, signer), "Invalid compliance signature");

        payment.blocked = true;
        payment.complianceReason = _reason;
        batch.status = PayrollStatus.BLOCKED;

        emit ComplianceBlocked(_batchId, _paymentIndex, payment.worker, _reason);
        emit PaymentBlocked(_batchId, _paymentIndex, payment.worker, payment.amount, _reason);
    }

    function recoverBlockedPayment(uint256 _batchId, uint256 _paymentIndex) external nonReentrant whenNotPaused {
        PayrollBatch storage batch = batches[_batchId];
        require(batch.employer == msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not employer or admin");

        PaymentInstruction storage payment = batchPayments[_batchId][_paymentIndex];
        require(payment.blocked, "Payment is not blocked");

        payment.blocked = false;
        payment.settled = true; // Mark settled to prevent double recovery
        
        IERC20(batch.tokenAddress).safeTransfer(batch.employer, payment.amount);

        emit EscrowRecovered(_batchId, batch.employer, payment.amount);
    }

    // RWA Financing Note Lifecycle
    function issueFinancingNote(
        uint256 _batchId,
        uint256 _principal,
        uint256 _repaymentAmount,
        uint256 _interestRate,
        uint256 _maturityDate
    ) external whenNotPaused returns (uint256) {
        PayrollBatch storage batch = batches[_batchId];
        require(batch.employer == msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not batch employer");
        uint256 noteId = nextNoteId++;

        notes[noteId] = FinancingNote(
            noteId,
            _batchId,
            msg.sender,
            address(0),
            _principal,
            _repaymentAmount,
            _interestRate,
            _maturityDate,
            NoteStatus.ISSUED,
            0
        );

        emit FinancingNoteIssued(noteId, _batchId, msg.sender, _principal);
        return noteId;
    }

    function fundNote(uint256 _noteId) external nonReentrant whenNotPaused {
        FinancingNote storage note = notes[_noteId];
        require(note.status == NoteStatus.ISSUED, "Not in ISSUED state");
        
        PayrollBatch storage batch = batches[note.batchId];
        require(batch.status == PayrollStatus.DRAFT, "Batch already funded");

        note.investor = msg.sender;
        note.status = NoteStatus.FUNDED;
        note.fundedAt = block.timestamp;
        batch.status = PayrollStatus.FUNDED;

        capitalProviderExposure[msg.sender] += note.principal;

        // Pull principal from investor directly into contract batch escrow
        IERC20(batch.tokenAddress).safeTransferFrom(msg.sender, address(this), note.principal);

        emit FinancingFunded(_noteId, msg.sender);
        emit EscrowFunded(note.batchId, batch.tokenAddress, note.principal);
    }

    function repayNote(uint256 _noteId) external nonReentrant whenNotPaused {
        FinancingNote storage note = notes[_noteId];
        require(note.status == NoteStatus.FUNDED, "Not in FUNDED state");
        require(msg.sender == note.issuer || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not note issuer");

        note.status = NoteStatus.REPAID;
        capitalProviderExposure[note.investor] -= note.principal;

        PayrollBatch storage batch = batches[note.batchId];
        IERC20(batch.tokenAddress).safeTransferFrom(msg.sender, note.investor, note.repaymentAmount);

        emit FinancingRepaid(_noteId);
    }

    // Audit Anchoring
    function anchorAuditData(string calldata _dataHash, string calldata _description) external {
        auditAnchors[_dataHash] = _description;
        emit AuditAnchored(_dataHash, _description);
    }

    // Getters
    function getPaymentCount(uint256 _batchId) external view returns (uint256) {
        return batchPayments[_batchId].length;
    }

    function getPaymentInstruction(uint256 _batchId, uint256 _index) external view returns (address worker, uint256 amount, bool settled, bool blocked, string memory complianceReason) {
        PaymentInstruction storage pay = batchPayments[_batchId][_index];
        return (pay.worker, pay.amount, pay.settled, pay.blocked, pay.complianceReason);
    }
}
