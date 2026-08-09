"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CLEARAIL_CORE_ABI, MOCK_ERC20_ABI } from "@/lib/blockchain/evm";
import { TransactionModal, TxStep } from "@/components/shared/TransactionModal";

interface FinancingNoteItem {
  id: string;
  noteId: number;
  batchId: number;
  employerName: string;
  principal: number;
  repaymentAmount: number;
  interestRate: number;
  status: "ISSUED" | "FUNDED" | "REPAID";
  investorAddress?: string;
}

export default function FinancingPage() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  // Mock notes state for demonstration lifecycle
  const [notes, setNotes] = useState<FinancingNoteItem[]>([
    {
      id: "note-1",
      noteId: 1,
      batchId: 101,
      employerName: "Apex Infrastructure Ltd",
      principal: 2500,
      repaymentAmount: 2625,
      interestRate: 5.0,
      status: "ISSUED"
    },
    {
      id: "note-2",
      noteId: 2,
      batchId: 102,
      employerName: "ClearRail Build Corp",
      principal: 5000,
      repaymentAmount: 5250,
      interestRate: 5.0,
      status: "FUNDED",
      investorAddress: "0x44be5240559880f39ba5604D33486Da4d8A48527"
    }
  ]);

  // Form states for note creation
  const [batchIdInput, setBatchIdInput] = useState("1");
  const [principalInput, setPrincipalInput] = useState("1000");
  const [interestInput, setInterestInput] = useState("5.0");

  // Transaction Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<TxStep>("IDLE");
  const [modalTitle, setModalTitle] = useState("");
  const [modalAction, setModalAction] = useState("");
  const [modalAmount, setModalAmount] = useState<number | string>("");
  const [activeTxHash, setActiveTxHash] = useState("");
  const [modalError, setModalError] = useState("");

  const contractAddress = (process.env.NEXT_PUBLIC_CLEARAIL_CORE_ADDRESS || "0x63d15515178fD90d01E7B8167C41b413D85E351C") as `0x${string}`;
  const tokenAddress = (process.env.NEXT_PUBLIC_MOCK_ATOKEN_ADDRESS || "0xeb4DEC7a15cF2CE1CfEDE8FFc3ec5BEAED6Ff5A8") as `0x${string}`;

  // 1. Issue Financing Note
  async function handleIssueNote() {
    if (!isConnected) {
      alert("Please connect your wallet first using the CONNECT WALLET button in the sidebar.");
      return;
    }

    setModalTitle("Issue RWA Payroll Financing Note");
    setModalAction("ISSUE FINANCING NOTE");
    setModalAmount(Number(principalInput));
    setModalError("");
    setModalStep("CONFIRM_IN_WALLET");
    setModalOpen(true);

    try {
      const principalBig = BigInt(Math.round(Number(principalInput) * 1000000));
      const repaymentBig = BigInt(Math.round(Number(principalInput) * 1.05 * 1000000));
      const maturity = Math.floor(Date.now() / 1000) + 86400 * 30;

      const tx = await writeContractAsync({
        address: contractAddress,
        abi: CLEARAIL_CORE_ABI,
        functionName: "issueFinancingNote",
        args: [BigInt(batchIdInput), principalBig, repaymentBig, BigInt(500), BigInt(maturity)]
      });

      setActiveTxHash(tx);
      setModalStep("BROADCASTING");

      // Update UI state
      setNotes((prev) => [
        ...prev,
        {
          id: `note-${prev.length + 1}`,
          noteId: prev.length + 1,
          batchId: Number(batchIdInput),
          employerName: "ClearRail Employer",
          principal: Number(principalInput),
          repaymentAmount: Number(principalInput) * 1.05,
          interestRate: 5.0,
          status: "ISSUED"
        }
      ]);

      setModalStep("CONFIRMED");
    } catch (err: any) {
      console.error(err);
      setModalError(err.shortMessage || err.message || "User rejected transaction");
      setModalStep("REJECTED");
    }
  }

  // 2. Fund Note with Real Token Movement
  async function handleFundNote(note: FinancingNoteItem) {
    if (!isConnected) {
      alert("Please connect your wallet first.");
      return;
    }

    setModalTitle(`Fund Financing Note #${note.noteId}`);
    setModalAction("FUND FINANCING NOTE (ERC-20 ESCROW)");
    setModalAmount(note.principal);
    setModalError("");
    setModalStep("CONFIRM_IN_WALLET");
    setModalOpen(true);

    try {
      const principalBig = BigInt(Math.round(note.principal * 1000000));

      // Step A: Approve ERC-20 token allowance first
      const approveTx = await writeContractAsync({
        address: tokenAddress,
        abi: MOCK_ERC20_ABI,
        functionName: "approve",
        args: [contractAddress, principalBig]
      });

      setActiveTxHash(approveTx);

      // Step B: Call fundNote on ClearRailCore
      const fundTx = await writeContractAsync({
        address: contractAddress,
        abi: CLEARAIL_CORE_ABI,
        functionName: "fundNote",
        args: [BigInt(note.noteId)]
      });

      setActiveTxHash(fundTx);
      setModalStep("BROADCASTING");

      // Update state
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, status: "FUNDED", investorAddress: address } : n))
      );

      setModalStep("CONFIRMED");
    } catch (err: any) {
      console.error(err);
      setModalError(err.shortMessage || err.message || "User rejected transaction");
      setModalStep("REJECTED");
    }
  }

  // 3. Repay Note with Real Token Movement
  async function handleRepayNote(note: FinancingNoteItem) {
    if (!isConnected) {
      alert("Please connect your wallet first.");
      return;
    }

    setModalTitle(`Repay Financing Note #${note.noteId}`);
    setModalAction("REPAY FINANCING NOTE TO INVESTOR");
    setModalAmount(note.repaymentAmount);
    setModalError("");
    setModalStep("CONFIRM_IN_WALLET");
    setModalOpen(true);

    try {
      const repaymentBig = BigInt(Math.round(note.repaymentAmount * 1000000));

      // Step A: Approve ERC-20 token allowance
      const approveTx = await writeContractAsync({
        address: tokenAddress,
        abi: MOCK_ERC20_ABI,
        functionName: "approve",
        args: [contractAddress, repaymentBig]
      });

      setActiveTxHash(approveTx);

      // Step B: Call repayNote on ClearRailCore
      const repayTx = await writeContractAsync({
        address: contractAddress,
        abi: CLEARAIL_CORE_ABI,
        functionName: "repayNote",
        args: [BigInt(note.noteId)]
      });

      setActiveTxHash(repayTx);
      setModalStep("BROADCASTING");

      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, status: "REPAID" } : n))
      );

      setModalStep("CONFIRMED");
    } catch (err: any) {
      console.error(err);
      setModalError(err.shortMessage || err.message || "User rejected transaction");
      setModalStep("REJECTED");
    }
  }

  return (
    <div className="px-6 md:px-10 py-12 flex flex-col gap-10 max-w-6xl mx-auto text-left">
      {/* Editorial Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
          <span className="text-mono-sm text-[var(--color-accent)] font-semibold tracking-wider uppercase">
            RWA PAYROLL FINANCING TRACK
          </span>
        </div>
        <h1 className="text-display-md text-[var(--color-text-primary)] font-serif leading-tight">
          Real-World Asset Payroll Financing Notes
        </h1>
        <p className="text-body-md text-[var(--color-text-secondary)] max-w-3xl leading-relaxed">
          Employers issue on-chain RWA financing notes against verified payroll batches. Capital providers fund notes with Cleanverse A-Tokens directly into contract escrow, enabling instant workforce liquidity before institutional settlement.
        </p>
      </div>

      {/* Grid: Create Note Form + Live Note Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Create Note Card */}
        <div className="lg:col-span-4 border border-[var(--color-border)] rounded-3xl p-6 bg-white/80 backdrop-blur-md shadow-sm flex flex-col gap-5">
          <h2 className="text-heading-md font-serif text-[var(--color-text-primary)]">Issue New Note</h2>
          <p className="text-body-sm text-[var(--color-text-secondary)]">
            Create an on-chain obligation note against a verified payroll batch.
          </p>

          <div className="flex flex-col gap-4">
            <Input
              label="Payroll Batch ID"
              value={batchIdInput}
              onChange={(e) => setBatchIdInput(e.target.value)}
              placeholder="e.g. 1"
            />
            <Input
              label="Principal Amount (A-USDC)"
              value={principalInput}
              onChange={(e) => setPrincipalInput(e.target.value)}
              placeholder="1000"
            />
            <Input
              label="Fixed Interest Rate (%)"
              value={interestInput}
              onChange={(e) => setInterestInput(e.target.value)}
              placeholder="5.0"
            />

            <Button variant="primary" onClick={handleIssueNote} className="w-full mt-2">
              Sign & Issue Note on-Chain →
            </Button>
          </div>
        </div>

        {/* Live Financing Notes Feed */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <h2 className="text-heading-md font-serif text-[var(--color-text-primary)]">Active RWA Financing Market</h2>

          <div className="flex flex-col gap-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="border border-[var(--color-border)] rounded-3xl p-6 bg-white/80 backdrop-blur-md shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <span className="text-mono-sm font-bold text-[var(--color-accent)]">NOTE #{note.noteId}</span>
                    <Badge
                      status={
                        note.status === "REPAID" ? "safe" : note.status === "FUNDED" ? "info" : "warning"
                      }
                    >
                      {note.status}
                    </Badge>
                  </div>
                  <h3 className="text-heading-sm font-semibold text-[var(--color-text-primary)]">
                    Batch #{note.batchId} • {note.employerName}
                  </h3>
                  <p className="text-body-sm text-[var(--color-text-secondary)]">
                    Principal: <strong className="text-[var(--color-text-primary)]">${note.principal.toLocaleString()}</strong> • Repayment: <strong className="text-[var(--color-text-primary)]">${note.repaymentAmount.toLocaleString()}</strong> ({note.interestRate}% Return)
                  </p>
                  {note.investorAddress && (
                    <p className="text-mono-sm text-[11px] text-[var(--color-text-tertiary)] truncate max-w-[280px]">
                      Capital Provider: {note.investorAddress}
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                  {note.status === "ISSUED" && (
                    <Button variant="primary" onClick={() => handleFundNote(note)} className="w-full sm:w-auto">
                      Fund Note (A-USDC) →
                    </Button>
                  )}

                  {note.status === "FUNDED" && (
                    <Button variant="secondary" onClick={() => handleRepayNote(note)} className="w-full sm:w-auto">
                      Repay Note →
                    </Button>
                  )}

                  {note.status === "REPAID" && (
                    <span className="text-mono-sm font-semibold text-[var(--color-status-safe)]">
                      ✓ Obligation Fully Settled
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Real Wallet Transaction Modal */}
      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        actionLabel={modalAction}
        step={modalStep}
        amount={modalAmount}
        txHash={activeTxHash}
        errorReason={modalError}
      />
    </div>
  );
}
