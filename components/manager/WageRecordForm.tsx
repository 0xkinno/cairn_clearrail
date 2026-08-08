"use client";

import { useEffect, useMemo, useState, FormEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Dropdown } from "@/components/ui/Dropdown";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/shared/ErrorState";
import { useAccount } from "wagmi";

const CURRENCY_OPTIONS = [
  { label: "A-USDC (Cleanverse Stablecoin)", value: "A-USDC" },
  { label: "USD", value: "USD" },
  { label: "MYR", value: "MYR" },
  { label: "SGD", value: "SGD" },
];

interface WorkerOption {
  id: string;
  full_name: string;
}

export function WageRecordForm({ onSaved }: { onSaved: () => void }) {
  const { address } = useAccount();
  const [workers, setWorkers] = useState<WorkerOption[]>([]);
  const [workerId, setWorkerId] = useState("");
  const [payPeriodStart, setPayPeriodStart] = useState("");
  const [payPeriodEnd, setPayPeriodEnd] = useState("");
  const [shiftsWorked, setShiftsWorked] = useState("5");
  const [hoursTotal, setHoursTotal] = useState("40");
  const [overtimeHours, setOvertimeHours] = useState("0");
  const [baseRate, setBaseRate] = useState("25");
  const [overtimeRate, setOvertimeRate] = useState("37.5");
  const [deductions, setDeductions] = useState("0");
  const [currency, setCurrency] = useState("A-USDC");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/workers")
      .then((r) => r.json())
      .then((body) => setWorkers(body.data || []));
  }, []);

  const grossPay = useMemo(
    () => Number(baseRate) * Number(hoursTotal) + Number(overtimeRate) * Number(overtimeHours),
    [baseRate, hoursTotal, overtimeRate, overtimeHours]
  );
  const netPay = grossPay - Number(deductions);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!workerId) {
      setError("Select a worker.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const wageData = {
      worker_id: workerId,
      pay_period_start: payPeriodStart,
      pay_period_end: payPeriodEnd,
      shifts_worked: Number(shiftsWorked),
      hours_total: Number(hoursTotal),
      overtime_hours: Number(overtimeHours),
      gross_pay: grossPay,
      deductions: Number(deductions),
      net_pay: netPay,
      currency,
      notes,
    };

    try {
      const res = await fetch("/api/wages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wageData),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to create wage record.");
      }

      onSaved();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const workerOptions = workers.map((w) => ({ label: w.full_name, value: w.id }));

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left border border-[var(--color-border)] rounded-3xl p-6 bg-white/80 backdrop-blur-md shadow-sm">
      <h3 className="text-heading-md font-serif font-bold text-[var(--color-text-primary)]">
        Create Payroll Wage Obligation
      </h3>
      {error && <ErrorState message={error} />}

      <Dropdown
        label="Worker"
        options={workerOptions}
        value={workerId}
        onChange={setWorkerId}
        placeholder="Select worker"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Period Start"
          type="date"
          value={payPeriodStart}
          onChange={(e) => setPayPeriodStart(e.target.value)}
          required
        />
        <Input
          label="Period End"
          type="date"
          value={payPeriodEnd}
          onChange={(e) => setPayPeriodEnd(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Shifts"
          type="number"
          value={shiftsWorked}
          onChange={(e) => setShiftsWorked(e.target.value)}
        />
        <Input
          label="Hours Total"
          type="number"
          value={hoursTotal}
          onChange={(e) => setHoursTotal(e.target.value)}
        />
        <Input
          label="Base Hourly Rate"
          type="number"
          value={baseRate}
          onChange={(e) => setBaseRate(e.target.value)}
        />
      </div>

      <Dropdown
        label="Settlement Asset"
        options={CURRENCY_OPTIONS}
        value={currency}
        onChange={setCurrency}
      />

      <div className="p-4 bg-[var(--color-bg-secondary)] rounded-2xl flex justify-between items-center text-mono-sm">
        <span className="text-[var(--color-text-tertiary)] uppercase font-bold text-[10px]">Calculated Net Obligation:</span>
        <span className="text-heading-sm font-serif font-bold text-[var(--color-text-primary)]">
          {currency} {netPay.toFixed(2)}
        </span>
      </div>

      <Button variant="primary" type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Create Payroll Obligation &rarr;"}
      </Button>
    </form>
  );
}
