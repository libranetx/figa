"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FigaLogo } from "@/components/figa-logo";
import { toast } from "react-hot-toast";

export default function VerifyResetOTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If no email, redirect to forgot-password
    if (!email) {
      router.push('/forgot-password');
    }
  }, [email, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to verify code');
      }

      // Mark allowed to reset password in sessionStorage (client-side flow similar to signup)
      sessionStorage.setItem('passwordResetEmail', email);

      toast.success('Code verified. You can now set a new password.', { position: 'top-center' });
      router.push('/reset-password');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to verify code', { position: 'top-center' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100/50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <FigaLogo size="lg" />
        </div>

        <div className="bg-white shadow rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Verify Code</h1>
          <p className="text-sm text-slate-600 mb-6">Enter the 6-digit code sent to <strong>{email}</strong></p>

          <form onSubmit={handleVerify} className="space-y-4">
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0,6))}
              placeholder="000000"
              className="text-center text-2xl font-mono tracking-widest"
              maxLength={6}
            />

            <Button type="submit" className="w-full bg-blue-600" disabled={isLoading || otp.length !== 6}>
              {isLoading ? 'Verifying...' : 'Verify code'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
