import { expect } from "chai";
import hre from "hardhat";

describe("ClearRailCore Protocol & Real Asset Escrow", function () {
  let clearRail, token, admin, registrar, employer, worker1, worker2, investor;

  beforeEach(async function () {
    const ethers = hre.ethers;
    [admin, registrar, employer, worker1, worker2, investor] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy();

    const ClearRailCore = await ethers.getContractFactory("ClearRailCore");
    clearRail = await ClearRailCore.deploy(admin.address, registrar.address);

    // Give tokens to employer & investor
    await token.mint(employer.address, ethers.parseUnits("10000", 6));
    await token.mint(investor.address, ethers.parseUnits("10000", 6));
  });

  it("Should register workers, employers and anchor WorkProof", async function () {
    await clearRail.connect(registrar).registerWorker(worker1.address, "Alex Vance", "Electrician");
    const worker = await clearRail.workers(worker1.address);
    expect(worker.fullName).to.equal("Alex Vance");
    expect(worker.isRegistered).to.be.true;

    await clearRail.connect(registrar).registerEmployer(employer.address, "ClearRail Build Corp", "Construction");
    const emp = await clearRail.employers(employer.address);
    expect(emp.isRegistered).to.be.true;

    await expect(clearRail.connect(employer).anchorWorkProof("hash_workproof_1", worker1.address))
      .to.emit(clearRail, "WorkProofAnchored")
      .withArgs("hash_workproof_1", worker1.address);
  });

  it("Should execute complete payroll batch creation, funding, and compliant payment release with real token transfers", async function () {
    const ethers = hre.ethers;
    const amount1 = ethers.parseUnits("500", 6);
    const amount2 = ethers.parseUnits("700", 6);

    // 1. Create payroll batch
    await clearRail.connect(employer).createPayrollBatch([worker1.address, worker2.address], [amount1, amount2], await token.getAddress());
    
    // 2. Fund batch
    await token.connect(employer).approve(await clearRail.getAddress(), amount1 + amount2);
    await expect(clearRail.connect(employer).fundBatch(1))
      .to.emit(clearRail, "EscrowFunded")
      .withArgs(1, await token.getAddress(), amount1 + amount2);

    expect(await token.balanceOf(await clearRail.getAddress())).to.equal(amount1 + amount2);

    // 3. Registrar signs compliance attestation for worker 1 (Approved)
    const nonce = 101;
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    
    const messageHash = ethers.solidityPackedKeccak256(
      ["uint256", "uint256", "address", "uint256", "bool", "uint256", "uint256"],
      [1, 0, worker1.address, amount1, true, nonce, deadline]
    );
    const signature = await registrar.signMessage(ethers.getBytes(messageHash));

    const worker1BalanceBefore = await token.balanceOf(worker1.address);

    // 4. Release payment (User/Employer signs the transaction)
    await expect(clearRail.connect(employer).releasePayment(1, 0, signature, nonce, deadline))
      .to.emit(clearRail, "PaymentReleased")
      .withArgs(1, 0, worker1.address, amount1);

    const worker1BalanceAfter = await token.balanceOf(worker1.address);
    expect(worker1BalanceAfter - worker1BalanceBefore).to.equal(amount1);
  });

  it("Should lock non-compliant payment in escrow and allow employer recovery", async function () {
    const ethers = hre.ethers;
    const amount = ethers.parseUnits("500", 6);

    await clearRail.connect(employer).createPayrollBatch([worker2.address], [amount], await token.getAddress());
    await token.connect(employer).approve(await clearRail.getAddress(), amount);
    await clearRail.connect(employer).fundBatch(1);

    const nonce = 202;
    const deadline = Math.floor(Date.now() / 1000) + 3600;

    const messageHash = ethers.solidityPackedKeccak256(
      ["uint256", "uint256", "address", "uint256", "bool", "uint256", "uint256"],
      [1, 0, worker2.address, amount, false, nonce, deadline]
    );
    const signature = await registrar.signMessage(ethers.getBytes(messageHash));

    // Block payment due to compliance failure
    await expect(clearRail.connect(employer).blockPayment(1, 0, "A-Pass revoked", signature, nonce, deadline))
      .to.emit(clearRail, "PaymentBlocked")
      .withArgs(1, 0, worker2.address, amount, "A-Pass revoked");

    const empBalanceBefore = await token.balanceOf(employer.address);

    // Employer recovers blocked funds from escrow
    await expect(clearRail.connect(employer).recoverBlockedPayment(1, 0))
      .to.emit(clearRail, "EscrowRecovered")
      .withArgs(1, employer.address, amount);

    const empBalanceAfter = await token.balanceOf(employer.address);
    expect(empBalanceAfter - empBalanceBefore).to.equal(amount);
  });

  it("Should handle RWA financing note issuance, investor funding, and repayment", async function () {
    const ethers = hre.ethers;
    const principal = ethers.parseUnits("1000", 6);
    const repayment = ethers.parseUnits("1050", 6);
    const maturity = Math.floor(Date.now() / 1000) + 86400 * 30;

    await clearRail.connect(employer).createPayrollBatch([worker1.address], [principal], await token.getAddress());
    await clearRail.connect(employer).issueFinancingNote(1, principal, repayment, 500, maturity);

    // Investor funds the note (transfers principal to escrow)
    await token.connect(investor).approve(await clearRail.getAddress(), principal);
    await expect(clearRail.connect(investor).fundNote(1))
      .to.emit(clearRail, "FinancingFunded")
      .withArgs(1, investor.address);

    expect(await token.balanceOf(await clearRail.getAddress())).to.equal(principal);

    // Employer repays the note with interest
    await token.connect(employer).approve(await clearRail.getAddress(), repayment);
    const investorBalBefore = await token.balanceOf(investor.address);

    await expect(clearRail.connect(employer).repayNote(1))
      .to.emit(clearRail, "FinancingRepaid")
      .withArgs(1);

    const investorBalAfter = await token.balanceOf(investor.address);
    expect(investorBalAfter - investorBalBefore).to.equal(repayment);
  });
});
