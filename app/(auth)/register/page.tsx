"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAccount } from "wagmi";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const { address } = useAccount();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      router.push("/onboarding");
    } catch (err) {
      console.error(err);
      setError("Registration failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--color-bg-primary)]">
      <div className="w-full max-w-md bg-white border border-[var(--color-border)] rounded-3xl p-8 shadow-xl text-left flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-[10px] text-mono-sm text-[var(--color-accent)] font-bold tracking-widest uppercase">
            CLEAR RAIL ARBITRUM SEPOLIA
          </span>
          <h1 className="text-display-sm font-serif font-bold text-[var(--color-text-primary)]">Create Account</h1>
          <p className="text-body-sm text-[var(--color-text-secondary)]">
            Register your verified workforce identity on ClearRail.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-[var(--color-status-critical-bg)] border border-[rgba(181,48,42,0.3)] rounded-xl text-body-sm text-[var(--color-status-critical)]">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="worker@clearrail.io"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Minimum 6 characters"
          />

          <Button variant="primary" type="submit" disabled={loading} className="w-full mt-2">
            {loading ? "Creating Account..." : "Register Account &rarr;"}
          </Button>
        </form>

        <div className="border-t border-[var(--color-border-subtle)] pt-4 flex items-center justify-between text-mono-sm">
          <span className="text-[var(--color-text-tertiary)]">Already registered?</span>
          <Link href="/login" className="text-[var(--color-accent)] font-bold hover:underline">
            Sign In &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
