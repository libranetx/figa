"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FigaLogo } from "@/components/figa-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error("Please enter a valid email address", { position: "top-center" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const body = await res.json();

      if (!res.ok) {
        throw new Error(body.error || "Failed to request reset");
      }

  toast.success("OTP sent. Check your email.", { position: "top-center" });

  // Navigate to the reset OTP verification page so user can enter the code
  router.push(`/reset-password/verify?email=${encodeURIComponent(email)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unexpected error", { position: "top-center" });
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
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Forgot Password</h1>
          <p className="text-sm text-slate-600 mb-6">Enter the email associated with your account. We'll send a verification code to reset your password.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={isSubmitting}
              />
            </div>

            <Button type="submit" className="w-full bg-blue-600" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send reset code"}
            </Button>
          </form>

          <div className="mt-6 text-sm text-slate-600">
            Remembered your password? <Link href="/signin" className="text-blue-600">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
