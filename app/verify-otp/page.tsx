"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FigaLogo } from "@/components/figa-logo";
import { Heart, Home as HomeIcon, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Image from "next/image";

export default function VerifyOTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Email not found. Please try signing up again.");
      router.push("/signup");
      return;
    }

    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      // First verify the OTP
      const verifyRes = await fetch("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
        headers: { "Content-Type": "application/json" },
      });

      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        throw new Error(err.error || "Failed to verify OTP");
      }

      // Get user data from sessionStorage
      const pendingUserData = sessionStorage.getItem('pendingUserData');
      if (!pendingUserData) {
        throw new Error("User data not found. Please try signing up again.");
      }

      const userData = JSON.parse(pendingUserData);

      // Complete the user registration
      const completeRes = await fetch("/api/auth/complete-signup", {
        method: "POST",
        body: JSON.stringify(userData),
        headers: { "Content-Type": "application/json" },
      });

      if (!completeRes.ok) {
        const err = await completeRes.json();
        throw new Error(err.error || "Failed to create account");
      }

      // Clear the temporary data
      sessionStorage.removeItem('pendingUserData');

      toast.success("Account created successfully!", {
        position: "top-center",
      });
      
      // Redirect to signin page
      router.push("/signin?verified=true");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unexpected error", {
        position: "top-center",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email) {
      toast.error("Email not found. Please try signing up again.");
      router.push("/signup");
      return;
    }

    setIsResending(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to resend OTP");
      }

      toast.success("OTP resent successfully!", {
        position: "top-center",
      });
      
      // Reset timer
      setTimeLeft(600);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resend OTP", {
        position: "top-center",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100/50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Email Not Found</h1>
          <p className="text-slate-600 mb-6">Please try signing up again.</p>
          <Button onClick={() => router.push("/signup")}>
            Go to Sign Up
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-100/50 px-4 py-4">
      {/* subtle brand blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-300/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-6xl">
        {/* Home button in the top-left of the container */}
        <div className="absolute top-3 left-3 md:top-4 md:left-4 z-20">
          <Button
            type="button"
            size="sm"
            className="rounded-full bg-white/80 hover:bg-white text-slate-700 shadow backdrop-blur"
            onClick={() => router.push("/")}
          >
            <HomeIcon className="w-4 h-4 mr-1.5" /> Home
          </Button>
        </div>

        <div className="grid md:grid-cols-2 rounded-3xl shadow-2xl border border-slate-200 overflow-auto md:overflow-hidden bg-white/80 backdrop-blur md:h-[600px] lg:h-[640px] max-h-[90svh] min-h-0">
          {/* Left: image panel */}
          <div className="relative hidden md:block h-full bg-blue-900">
            <Image
              src="/signin.png"
              alt="Email verification"
              fill
              sizes="(max-width: 768px) 0px, 50vw"
              priority
              className="object-cover [object-position:68%_center]"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/70 via-blue-700/40 to-transparent" />
            <div className="absolute inset-0 p-8 flex flex-col justify-between">
              <div className="flex items-center justify-end text-white/90">
                <span className="inline-flex items-center bg-white/10 backdrop-blur px-3 py-1 rounded-full border border-white/20 text-sm">
                  <Heart className="w-4 h-4 mr-1" /> Caring made simple
                </span>
              </div>
              <div className="text-white">
                <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
                  Verify Your Email
                </h2>
                <p className="mt-3 text-white/80 max-w-sm">
                  We've sent a verification code to your email address. Please check your inbox and enter the code below.
                </p>
              </div>
            </div>
            {/* Motto below the image area */}
            <div className="absolute left-4 right-4 bottom-4">
              <div className="bg-white/90 backdrop-blur-sm text-blue-900 text-sm md:text-base px-4 py-3 rounded-xl shadow-md border border-white/60">
                Secure verification for your peace of mind.
              </div>
            </div>
          </div>

          {/* Right: form panel */}
          <div className="p-6 sm:p-8 lg:p-10 pt-8 md:pt-10 lg:pt-12 flex h-full justify-center items-start overflow-y-auto min-h-0">
            <div className="w-full max-w-md">
              <div className="flex items-center justify-center mb-6">
                <FigaLogo size="lg" />
              </div>



              <div className="space-y-6 bg-transparent">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                    Email Verification
                  </h1>
                  <p className="text-slate-600 mt-1">
                    Enter the 6-digit code sent to <strong>{email}</strong>
                  </p>
                </div>

                <form onSubmit={handleVerifyOTP} className="space-y-6">
                  <div>
                    <label className="text-slate-700 text-sm font-medium">
                      Verification Code
                    </label>
                    <Input
                      value={otp}
                      onChange={handleOtpChange}
                      placeholder="000000"
                      className="mt-2 text-center text-2xl font-mono tracking-widest"
                      maxLength={6}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter the 6-digit code from your email
                    </p>
                  </div>

                  {/* Timer */}
                  <div className="text-center">
                    {timeLeft > 0 ? (
                      <p className="text-sm text-slate-600">
                        Code expires in <span className="font-mono font-bold text-blue-600">{formatTime(timeLeft)}</span>
                      </p>
                    ) : (
                      <p className="text-sm text-red-600">
                        Code has expired. Please request a new one.
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading || otp.length !== 6 || timeLeft === 0}
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg hover:shadow-xl"
                  >
                    {isLoading ? "Verifying..." : "Verify Email"}
                  </Button>

                  {/* Resend OTP */}
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResendOTP}
                      disabled={isResending || timeLeft > 0}
                      className="text-sm"
                    >
                      {isResending ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Resend Code"
                      )}
                    </Button>
                  </div>

                  {/* Back to Sign Up */}
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => router.push("/signup")}
                      className="text-sm text-slate-600 hover:text-slate-800"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Sign Up
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
