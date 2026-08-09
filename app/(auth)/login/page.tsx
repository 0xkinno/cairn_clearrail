"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAccount } from "wagmi";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const { address, isConnected } = useAccount();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        const { data: profile } = await supabase
          .from("workers")
          .select("id")
          .eq("user_id", userData.user.id)
          .maybeSingle();

        if (profile) {
          router.push("/worker");
        } else {
          router.push("/manager");
        }
      } else {
        router.push("/onboarding");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to sign in. Please check your credentials.");
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
          <h1 className="text-display-sm font-serif font-bold text-[var(--color-text-primary)]">Sign In</h1>
          <p className="text-body-sm text-[var(--color-text-secondary)]">
            Access your verified ClearRail workforce identity dashboard.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-[var(--color-status-critical-bg)] border border-[rgba(181,48,42,0.3)] rounded-xl text-body-sm text-[var(--color-status-critical)]">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
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
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            rightIcon={
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="w-full h-full flex items-center justify-center p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            }
          />

          <Button variant="primary" type="submit" disabled={loading} className="w-full mt-2">
            {loading ? "Signing in..." : "Sign In →"}
          </Button>
        </form>

        <div className="border-t border-[var(--color-border-subtle)] pt-4 flex items-center justify-between text-mono-sm">
          <span className="text-[var(--color-text-tertiary)]">Don't have an account?</span>
          <Link href="/register" className="text-[var(--color-accent)] font-bold hover:underline">
            Register →
          </Link>
        </div>
      </div>
    </div>
  );
}
