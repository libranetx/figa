"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FigaLogo } from "@/components/figa-logo";
import { toast } from "react-hot-toast";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('passwordResetEmail');
    if (!stored) {
      router.push('/forgot-password');
      return;
    }
    setEmail(stored);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to reset password');
      }

      // Clear the sessionStorage marker
      sessionStorage.removeItem('passwordResetEmail');

      toast.success('Password updated successfully. You can now sign in.', { position: 'top-center' });
      router.push('/signin');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unexpected error', { position: 'top-center' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100/50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <FigaLogo size="lg" />
        </div>

        <div className="bg-white shadow rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Set a New Password</h1>
          <p className="text-sm text-slate-600 mb-6">Setting a new password for <strong>{email}</strong></p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <div>
              <Label htmlFor="confirm">Confirm password</Label>
              <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>

            <Button type="submit" className="w-full bg-blue-600" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
