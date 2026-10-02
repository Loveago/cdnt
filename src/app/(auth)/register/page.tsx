"use client";

import { Suspense, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { registerSchema, type RegisterInput } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/input";
import { AuthShell, AuthFooterLink } from "@/components/auth/auth-shell";
import { useToast } from "@/components/toast";
import { Spinner } from "@/components/shared";
import { CheckCircle2, XCircle, CreditCard, ExternalLink, AlertTriangle } from "lucide-react";

interface SignupFeeInfo {
  enabled: boolean;
  amount: number;
  currency: string;
  description: string;
  paystackConfigured: boolean;
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [serverError, setServerError] = useState<string | null>(null);
  const [signupCodeMode, setSignupCodeMode] = useState<"DISABLED" | "OPTIONAL" | "REQUIRED">("OPTIONAL");
  const [codeStatus, setCodeStatus] = useState<{ checked: boolean; valid: boolean; message?: string } | null>(null);
  const [validatingCode, setValidatingCode] = useState(false);
  const [signupFee, setSignupFee] = useState<SignupFeeInfo | null>(null);
  const [registrationClosed, setRegistrationClosed] = useState(false);
  const [redirectingPayment, setRedirectingPayment] = useState<{ url: string; amount: number } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const enteredCode = watch("signupCode");

  // Load registration settings
  useEffect(() => {
    fetch("/api/auth/registration-settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.signupCodeMode) setSignupCodeMode(data.signupCodeMode);
        if (data.allowRegistration === false) setRegistrationClosed(true);
        if (data.signupFee) setSignupFee(data.signupFee);
      })
      .catch(() => {
        // Fallback to legacy endpoint if needed
        fetch("/api/auth/signup-code-mode")
          .then((r) => r.json())
          .then((data) => {
            if (data.mode) setSignupCodeMode(data.mode);
          })
          .catch(() => {});
      });
  }, []);

  // Handle URL errors (e.g. redirected from Paystack callback on cancel/failure)
  useEffect(() => {
    const error = searchParams.get("error");
    const reason = searchParams.get("reason");
    const message = searchParams.get("message");
    if (error === "payment_failed") {
      setServerError(
        reason
          ? `Payment failed: ${reason}. Please try signing up again to complete activation.`
          : "Payment was not completed. Please try again to activate your account."
      );
    } else if (error === "verification_error") {
      setServerError(message || "An error occurred while verifying your payment. Please try again.");
    } else if (error === "transaction_not_found") {
      setServerError("Registration transaction record not found. Please try submitting again.");
    }
  }, [searchParams]);

  // Validate signup code with debounce
  useEffect(() => {
    if (signupCodeMode === "DISABLED" || !enteredCode || !enteredCode.trim()) {
      setCodeStatus(null);
      return;
    }

    const timer = setTimeout(async () => {
      setValidatingCode(true);
      try {
        const res = await fetch(`/api/auth/validate-code?code=${encodeURIComponent(enteredCode.trim())}`);
        const data = await res.json();
        setCodeStatus({
          checked: true,
          valid: !!data.valid,
          message: data.valid ? "✓ Valid signup code" : data.message || "Invalid or expired signup code",
        });
      } catch {
        setCodeStatus(null);
      } finally {
        setValidatingCode(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [enteredCode, signupCodeMode]);

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      setServerError(json.error ?? "Registration failed");
      return;
    }

    // Check if account monetization fee payment is required
    if (json.requiresPayment && json.authorizationUrl) {
      setRedirectingPayment({
        url: json.authorizationUrl,
        amount: json.amount || signupFee?.amount || 0,
      });
      toast("Account registered! Redirecting to Paystack for activation...", "info");
      // Redirect after a brief moment to allow UI prompt to display
      setTimeout(() => {
        window.location.href = json.authorizationUrl;
      }, 1000);
      return;
    }

    toast("Account created. Welcome to MyCediNet!", "success");
    router.push("/dashboard");
    router.refresh();
  };

  const hasFee = signupFee?.enabled && signupFee.amount > 0;

  return (
    <AuthShell title="Create your account" subtitle="Start sending data bundles in minutes">
      {/* Payment Redirecting Modal / Prompt */}
      {redirectingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 p-6 sm:p-7 shadow-2xl border border-white/15 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              <Spinner className="h-7 w-7 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Redirecting to Paystack…
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Your account details have been recorded. Complete the activation fee of{" "}
                <strong className="text-emerald-400 font-bold font-mono">
                  GHS {redirectingPayment.amount.toFixed(2)}
                </strong>{" "}
                to activate your account and access your dashboard.
              </p>
            </div>
            <Button
              type="button"
              className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 font-black text-slate-950 shadow-md shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 gap-2"
              onClick={() => {
                window.location.href = redirectingPayment.url;
              }}
            >
              Proceed to Paystack <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {registrationClosed ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-center text-sm text-amber-200">
          <AlertTriangle className="mx-auto mb-2 h-7 w-7 text-amber-400" />
          <p className="font-bold text-amber-300">Registrations are currently closed</p>
          <p className="text-xs mt-1.5 text-slate-300 leading-relaxed">
            New user sign-ups are temporarily paused by the administrator. Please check back later.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs sm:text-sm text-rose-300 font-medium">
              {serverError}
            </div>
          )}

          {/* Activation Fee Banner */}
          {hasFee && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-xs text-emerald-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs sm:text-sm flex items-center gap-1.5 text-emerald-300">
                  <CreditCard className="h-4 w-4 text-emerald-400" />
                  {signupFee.description || "Account Activation Fee"}
                </span>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-black text-emerald-300 font-mono">
                  GHS {signupFee.amount.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                A one-time activation fee is required. After submitting this form, you will be redirected to Paystack to complete payment and activate your account.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs sm:text-sm font-semibold text-slate-200">
              Full name
            </Label>
            <Input
              id="name"
              autoComplete="name"
              placeholder="e.g. Kwame Mensah"
              className="h-11 sm:h-12 rounded-xl bg-slate-950/70 border-white/15 px-3.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 transition-all"
              {...register("name")}
            />
            {errors.name && <p className="text-xs text-rose-400 font-medium">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs sm:text-sm font-semibold text-slate-200">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="h-11 sm:h-12 rounded-xl bg-slate-950/70 border-white/15 px-3.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 transition-all"
              {...register("email")}
            />
            {errors.email && <p className="text-xs text-rose-400 font-medium">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs sm:text-sm font-semibold text-slate-200">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••••••"
              className="h-11 sm:h-12 rounded-xl bg-slate-950/70 border-white/15 px-3.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 transition-all"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-rose-400 font-medium">{errors.password.message}</p>
            )}
          </div>

          {/* Signup Code input */}
          {signupCodeMode !== "DISABLED" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="signupCode" className="text-xs sm:text-sm font-semibold text-slate-200">
                  {signupCodeMode === "REQUIRED" ? (
                    <span>
                      Signup Code <span className="text-rose-400">*</span>
                    </span>
                  ) : (
                    <span>
                      Signup Code <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                    </span>
                  )}
                </Label>
                {validatingCode && <Spinner className="h-3.5 w-3.5 text-emerald-400" />}
              </div>
              <Input
                id="signupCode"
                placeholder="e.g. WELCOME2026"
                className="h-11 sm:h-12 rounded-xl bg-slate-950/70 border-white/15 px-3.5 uppercase tracking-wider font-mono text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 transition-all"
                {...register("signupCode")}
              />
              {codeStatus?.checked && (
                <p
                  className={`flex items-center gap-1.5 text-xs font-semibold ${
                    codeStatus.valid
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  {codeStatus.valid ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 shrink-0" />
                  )}
                  {codeStatus.message}
                </p>
              )}
              {errors.signupCode && (
                <p className="text-xs text-rose-400 font-medium">{errors.signupCode.message}</p>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 sm:h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 font-black text-slate-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 active:scale-[0.99] transition-all text-sm sm:text-base tracking-wide"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Spinner className="h-5 w-5 text-slate-950" />
            ) : hasFee ? (
              `Create Account & Pay GHS ${signupFee.amount.toFixed(2)}`
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      )}

      <AuthFooterLink href="/login" prompt="Already have an account?" cta="Sign in" />
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Spinner className="h-6 w-6 text-brand-600" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
