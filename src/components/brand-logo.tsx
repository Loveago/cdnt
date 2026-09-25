"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  href?: string;
}

/**
 * Compact Icon / Mark alone (Cedi ₵ + High-Speed Network Wave Monogram)
 */
export function BrandMark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}) {
  const sizeMap = {
    xs: "h-6 w-6",
    sm: "h-8 w-8",
    md: "h-9 w-9",
    lg: "h-11 w-11",
    xl: "h-14 w-14",
  };

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 shadow-md ring-1 ring-emerald-500/20 dark:ring-emerald-400/30",
        sizeMap[size],
        className
      )}
      aria-label="MyCediNet"
    >
      <svg
        viewBox="0 0 128 128"
        className="h-full w-full p-1.5"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="cediGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          <linearGradient id="pulseGlow" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <radialGradient id="nodeSphere" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#A7F3D0" />
            <stop offset="60%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#047857" />
          </radialGradient>
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient background pulse circle */}
        <circle cx="64" cy="64" r="44" fill="#047857" opacity="0.15" filter="url(#softGlow)" />

        {/* Outer orbital network arc */}
        <path
          d="M 94 34 A 46 46 0 1 0 98 88"
          fill="none"
          stroke="url(#cediGrad)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray="96 8"
        />

        {/* Inner high-speed data flow arc */}
        <path
          d="M 80 46 A 28 28 0 1 0 84 80"
          fill="none"
          stroke="url(#pulseGlow)"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* The Cedi Currency Bar (₵ slash) through the center */}
        <path
          d="M 44 26 L 84 102"
          stroke="url(#cediGrad)"
          strokeWidth="7.5"
          strokeLinecap="round"
        />

        {/* Pulse Network Connectivity Nodes */}
        <circle cx="94" cy="34" r="6" fill="url(#nodeSphere)" />
        <circle cx="98" cy="88" r="5" fill="url(#nodeSphere)" />
        <circle cx="64" cy="64" r="4.5" fill="#FFFFFF" />
        <circle cx="84" cy="102" r="5.5" fill="url(#nodeSphere)" />
        <circle cx="44" cy="26" r="4" fill="#67E8F9" />
      </svg>
    </div>
  );
}

/**
 * Full Horizontal Brand Logo (Mark + Typography)
 */
export function BrandLogo({
  className,
  size = "md",
  showTagline = true,
  href,
}: BrandProps) {
  const content = (
    <div
      className={cn(
        "inline-flex shrink-0 items-center gap-2.5 select-none",
        className
      )}
    >
      <BrandMark size={size === "xl" ? "xl" : size === "lg" ? "lg" : size === "xs" ? "xs" : "sm"} />
      <div className="flex flex-col justify-center">
        <div className="flex items-baseline leading-none">
          <span className="text-base font-black tracking-tight text-slate-900 dark:text-white sm:text-lg">
            mycedi
          </span>
          <span className="ml-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-base font-black tracking-tight text-transparent sm:text-lg">
            net
          </span>
          <span className="ml-1.5 hidden rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-emerald-600 uppercase sm:inline-block dark:bg-emerald-400/15 dark:text-emerald-400">
            GH
          </span>
        </div>
        {showTagline && (
          <span className="mt-0.5 text-[8.5px] font-bold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
            data telecom network
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
