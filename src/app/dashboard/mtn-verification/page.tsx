"use client";

import * as React from "react";
import { PageHeader, Spinner, EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/toast";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Search,
  RefreshCw,
  Send,
  ShieldCheck,
  Info,
  Upload,
  FileText,
} from "lucide-react";
import { formatDateTime } from "@/lib/types";

interface VerificationItem {
  id: string;
  number: string;
  normalizedNumber: string;
  status: "SUBMITTED" | "PROCESSING" | "VERIFIED" | "REJECTED";
  submittedAt: string;
  verifiedAt?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  batch?: { batchReference: string; status: string } | null;
}

export default function UserMtnVerificationPage() {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<VerificationItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(15);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [instructions, setInstructions] = React.useState("");
  const [verificationEnabled, setVerificationEnabled] = React.useState(false);
  const [submissionFeedback, setSubmissionFeedback] = React.useState<{
    type: "success" | "verified" | "pending" | "error";
    message: string;
  } | null>(null);

  // --- Bulk file upload state ---
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadResult, setUploadResult] = React.useState<{
    success: boolean;
    message: string;
    submitted: number;
    alreadyPending: number;
    alreadyVerified: number;
    failed: number;
    invalidCount: number;
    duplicateCount: number;
    alreadyAcceptedCount: number;
    totalRows: number;
    errors?: { raw: string; reason: string; line: number }[];
  } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchItems = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (search.trim()) params.set("q", search.trim());

      const res = await fetch(`/api/mtn-verification?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load verification requests");
      const data = await res.json();
      setItems(data.data ?? []);
      setTotal(data.total ?? 0);
      if (data.instructions) setInstructions(data.instructions);
      if (typeof data.verificationEnabled === "boolean") {
        setVerificationEnabled(data.verificationEnabled);
      }
    } catch (err: any) {
      toast(err.message ?? "Error loading data", "error");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, search, toast]);

  React.useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phoneNumber.trim()) {
      return toast("Please enter an MTN phone number", "error");
    }

    setSubmitting(true);
    setSubmissionFeedback(null);
    try {
      const res = await fetch("/api/mtn-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phoneNumber.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSubmissionFeedback({
          type: "error",
          message: data.error ?? "Failed to submit number",
        });
        toast(data.error ?? "Submission failed", "error");
        return;
      }

      if (data.status === "VERIFIED") {
        setSubmissionFeedback({
          type: "verified",
          message: "✓ This number is already verified. You can purchase MTN bundles for it immediately.",
        });
        toast("Number is already verified!", "success");
      } else if (data.status === "ALREADY_PENDING") {
        setSubmissionFeedback({
          type: "pending",
          message: "◷ This number already has an active verification request in progress.",
        });
        toast("Verification request already pending", "info");
      } else {
        setSubmissionFeedback({
          type: "success",
          message: "Number submitted successfully! You will see the status update below.",
        });
        toast("Submitted for MTN verification", "success");
        setPhoneNumber("");
      }

      fetchItems();
    } catch (err: any) {
      toast(err.message ?? "An error occurred", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile) return toast("Please select a .txt file first", "error");
    setUploading(true);
    setUploadResult(null);
    try {
      let data: any;
      try {
        const content = await uploadFile.text();
        const res = await fetch("/api/mtn-verification/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: uploadFile.name,
            content,
          }),
        });
        data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
      } catch (jsonErr: any) {
        // Fallback to FormData with safe ASCII filename
        const safeFilename = uploadFile.name.replace(/[^\w.-]/g, "_");
        const form = new FormData();
        form.append("file", uploadFile, safeFilename);
        const res = await fetch("/api/mtn-verification/upload", {
          method: "POST",
          body: form,
        });
        data = await res.json();
        if (!res.ok) throw new Error(data.error ?? jsonErr.message ?? "Upload failed");
      }

      setUploadResult(data);
      if (data.submitted > 0) {
        toast(`${data.submitted} number(s) submitted for verification`, "success");
        fetchItems();
      } else {
        toast(data.message ?? "No new numbers submitted", "info");
      }
      // Reset file input
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      toast(err.message ?? "An error occurred", "error");
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (item: VerificationItem) => {
    switch (item.status) {
      case "VERIFIED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Verified
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            Processing
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400">
            <XCircle className="h-3.5 w-3.5" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400">
            <Clock className="h-3.5 w-3.5" />
            Submitted
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white/90 p-5 sm:p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Subscriber Validation Service
              </span>
              <span className="text-[10px] font-bold text-slate-400">· Zero-Fail Verification</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              MTN Verification
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Verify recipient MTN subscriber eligibility in advance to eliminate dispatch failures and maximize delivery speed.
            </p>
          </div>
        </div>
      </div>

      {/* Verification Enforcement Notice */}
      {verificationEnabled ? (
        <div className="flex items-start gap-3 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-4 sm:p-5 text-sm text-emerald-950 dark:border-emerald-500/20 dark:bg-emerald-500/[0.08] dark:text-emerald-200 shadow-sm">
          <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sm">MTN Number Verification is Currently Active</p>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
              Only pre-verified MTN recipient numbers can be dispatched for MTN data bundles. Telecel and AT bundles are not subject to verification restrictions.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-3xl border border-slate-200/90 bg-white/90 p-4 sm:p-5 text-sm text-slate-700 dark:border-white/10 dark:bg-[#0b1322]/90 dark:text-slate-300 shadow-sm backdrop-blur-xl">
          <Info className="h-5 w-5 shrink-0 text-slate-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sm text-slate-900 dark:text-white">Optional MTN Pre-Verification</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Strict verification enforcement is currently disabled. You may still pre-validate recipient numbers to ensure 100% successful order execution.
            </p>
          </div>
        </div>
      )}

      {/* Forms Grid: Single and Bulk */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Submit Single Card */}
        <div className="rounded-3xl border border-slate-200/90 bg-white/90 p-5 sm:p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Submit Single Number
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Direct
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {instructions || "Submit your MTN number for verification before purchasing MTN packages. Prefixes: 024, 025, 053, 054, 055, 059."}
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="phoneNumber" className="text-xs font-bold text-slate-700 dark:text-slate-300">MTN Phone Number</Label>
                <div className="flex gap-2">
                  <Input
                    id="phoneNumber"
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. 0241234567"
                    className="font-mono text-sm h-11 rounded-xl border-slate-200 dark:border-white/10 dark:bg-white/[0.03] focus:border-emerald-500 focus:ring-emerald-500/20"
                    disabled={submitting}
                  />
                  <Button
                    type="submit"
                    disabled={submitting || !phoneNumber.trim()}
                    className="shrink-0 h-11 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 font-bold text-white shadow-md shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] transition"
                  >
                    {submitting ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4 mr-1.5" />}
                    Submit
                  </Button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Accepts 024XXXXXXX, 233XXXXXXXXX, or +233XXXXXXXXX format.
                </p>
              </div>

              {submissionFeedback && (
                <div
                  className={`rounded-2xl p-4 text-xs font-semibold flex items-start gap-2.5 ${
                    submissionFeedback.type === "verified"
                      ? "bg-emerald-500/15 text-emerald-800 border border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : submissionFeedback.type === "pending"
                      ? "bg-amber-500/15 text-amber-800 border border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                      : submissionFeedback.type === "success"
                      ? "bg-blue-500/15 text-blue-800 border border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300"
                      : "bg-red-500/15 text-red-800 border border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                  }`}
                >
                  {submissionFeedback.type === "verified" && <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />}
                  {submissionFeedback.type === "pending" && <Clock className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />}
                  {submissionFeedback.type === "success" && <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />}
                  {submissionFeedback.type === "error" && <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />}
                  <span>{submissionFeedback.message}</span>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Bulk TXT Upload Card */}
        <div className="rounded-3xl border border-slate-200/90 bg-white/90 p-5 sm:p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Bulk Upload via TXT File
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Batch
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Upload a plain-text file (.txt) with one MTN number per line to submit hundreds of numbers at once.
            </p>

            <div className="mt-4 space-y-3">
              {/* Drop / click area */}
              <label
                htmlFor="bulkFile"
                className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-5 cursor-pointer transition
                  ${uploadFile
                    ? "border-emerald-500/50 bg-emerald-50/50 dark:border-emerald-500/40 dark:bg-emerald-500/10"
                    : "border-slate-200 bg-slate-50 hover:border-emerald-500/40 hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-emerald-500/30"
                  }`}
              >
                {uploadFile ? (
                  <>
                    <FileText className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{uploadFile.name}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {(uploadFile.size / 1024 / 1024).toFixed(2)} MB — click to select another
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Click or drag a <strong>.txt</strong> file here
                    </span>
                    <span className="text-[11px] text-slate-400">One MTN number per line · up to 200 MB</span>
                  </>
                )}
                <input
                  id="bulkFile"
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,text/plain"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setUploadFile(f);
                    setUploadResult(null);
                  }}
                  disabled={uploading}
                />
              </label>

              <Button
                type="button"
                onClick={handleFileUpload}
                disabled={uploading || !uploadFile}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 font-bold text-white shadow-md shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] transition"
              >
                {uploading ? (
                  <><Spinner className="h-4 w-4 mr-2" />Uploading &amp; Validating…</>
                ) : (
                  <><Upload className="h-4 w-4 mr-1.5" />Upload &amp; Submit Numbers</>
                )}
              </Button>
            </div>
          </div>

        {/* Upload result summary */}
        {uploadResult && (
          <div className="mt-5 rounded-2xl border border-slate-200/90 bg-white/95 p-4.5 dark:border-white/10 dark:bg-white/[0.03] space-y-3.5 shadow-sm">
            <p className={`text-sm font-bold ${uploadResult.submitted > 0 ? "text-emerald-700 dark:text-emerald-300" : "text-slate-800 dark:text-slate-200"}`}>
              {uploadResult.message}
            </p>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                <p className="text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider text-[10px]">Submitted</p>
                <p className="font-mono text-2xl font-black text-emerald-700 dark:text-emerald-300 tabular-nums mt-0.5">{uploadResult.submitted}</p>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                <p className="text-amber-700 dark:text-amber-300 font-bold uppercase tracking-wider text-[10px]">Already Pending</p>
                <p className="font-mono text-2xl font-black text-amber-700 dark:text-amber-300 tabular-nums mt-0.5">{uploadResult.alreadyPending}</p>
              </div>
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3">
                <p className="text-blue-700 dark:text-blue-300 font-bold uppercase tracking-wider text-[10px]">Already Verified</p>
                <p className="font-mono text-2xl font-black text-blue-700 dark:text-blue-300 tabular-nums mt-0.5">{uploadResult.alreadyVerified}</p>
              </div>
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3">
                <p className="text-rose-700 dark:text-rose-300 font-bold uppercase tracking-wider text-[10px]">Invalid / Skipped</p>
                <p className="font-mono text-2xl font-black text-rose-700 dark:text-rose-300 tabular-nums mt-0.5">{uploadResult.invalidCount + uploadResult.failed}</p>
              </div>
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Total rows parsed: {uploadResult.totalRows} · Duplicates in file: {uploadResult.duplicateCount}
            </p>
            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <details className="text-[11px] text-slate-500 dark:text-slate-400 cursor-pointer">
                <summary className="font-medium text-red-600 dark:text-red-400">
                  Show {uploadResult.errors.length} error(s)
                </summary>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  {uploadResult.errors.map((e, i) => (
                    <li key={i}>
                      {e.line > 0 && <span className="text-slate-400">Line {e.line}: </span>}
                      <span className="font-mono">{e.raw}</span> — {e.reason}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>
    </div>

      {/* Submitted Requests List */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Your Submitted MTN Numbers
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Track real-time verification status for all your submitted numbers ({total} total)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-48 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-white/10 dark:bg-[#0b1322] dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-white/10 dark:bg-[#0b1322] dark:text-slate-100 [&>option]:bg-white dark:[&>option]:bg-[#0b1322]"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="PROCESSING">Processing</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchItems()}
              title="Refresh"
              className="h-10 w-10 p-0 shrink-0 rounded-xl border-slate-200 dark:border-white/10"
            >
              <RefreshCw className={`h-4 w-4 text-emerald-600 dark:text-emerald-400 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {loading && items.length === 0 ? (
          <div className="flex justify-center py-20">
            <Spinner className="h-7 w-7 text-emerald-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-slate-200/90 bg-white/90 p-8 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1322]/90">
            <EmptyState
              title="No numbers submitted yet"
              description="Submit an MTN phone number above to start verification."
              icon={ShieldCheck}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white/90 p-5 shadow-sm transition hover:border-emerald-500/40 hover:shadow-md dark:border-white/10 dark:bg-[#0b1322]/90"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-base font-black text-slate-900 dark:text-white">
                      {item.number}
                    </span>
                    {getStatusBadge(item)}
                  </div>

                  <div className="mt-3.5 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>Submitted:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {formatDateTime(item.submittedAt)}
                      </span>
                    </div>

                    {item.status === "VERIFIED" && item.verifiedAt && (
                      <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
                        <span className="font-semibold">Verified on:</span>
                        <span className="font-bold">
                          {formatDateTime(item.verifiedAt)}
                        </span>
                      </div>
                    )}

                    {item.status === "PROCESSING" && (
                      <div className="text-blue-600 dark:text-blue-400 text-[11px] font-semibold mt-1">
                        Waiting for MTN portal confirmation
                      </div>
                    )}

                    {item.status === "REJECTED" && (
                      <div className="mt-2 rounded-xl bg-red-500/10 border border-red-500/20 p-2.5 text-[11px] text-red-700 dark:text-red-300">
                        <span className="font-bold">Reason: </span>
                        {item.rejectionReason || "Verification unsuccessful"}
                      </div>
                    )}
                  </div>
                </div>

                {item.status === "REJECTED" && (
                  <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-white/5 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 rounded-lg border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 font-bold"
                      onClick={() => {
                        setPhoneNumber(item.number);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      Resubmit Number
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > pageSize && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
            </span>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page * pageSize >= total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
