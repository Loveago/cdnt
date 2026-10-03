"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface BrandProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  href?: string;
  variant?: "default" | "dark" | "light";
}

/**
 * Compact Icon / Mark alone (Cedi ₵ + High-Speed Network Wave Monogram)
 */
export function BrandMark({
  className,
  size = "md",
  variant = "default",
}: {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "default" | "dark" | "light";
}) {
  const sizeMap = {
    xs: "h-6 w-6 rounded-lg",
    sm: "h-8 w-8 rounded-xl",
    md: "h-9 w-9 sm:h-10 sm:w-10 rounded-2xl",
    lg: "h-11 w-11 sm:h-12 sm:w-12 rounded-2xl",
    xl: "h-14 w-14 sm:h-16 sm:w-16 rounded-3xl",
  };

  const isDarkTheme = variant === "dark";

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden shadow-md transition-all",
        isDarkTheme
          ? "bg-gradient-to-br from-[#0c241b] via-[#051710] to-[#030d09] border border-emerald-400/40 shadow-emerald-500/25 ring-1 ring-white/10"
          : "bg-gradient-to-br from-slate-900 via-[#0a2016] to-slate-950 border border-emerald-500/30 ring-1 ring-emerald-500/20 dark:border-emerald-400/40 dark:ring-emerald-400/30 dark:shadow-emerald-500/20",
        sizeMap[size],
        className
      )}
      aria-label="MyCediNet"
    >
      {/* Subtle interior glow */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-emerald-500/15 via-transparent to-cyan-400/15" />

      <svg
        viewBox="0 0 128 128"
        className="relative z-10 h-full w-full p-1.5"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="cediGradVibrant" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="45%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          <linearGradient id="pulseGlowVibrant" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="50%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
          <radialGradient id="nodeSphereVibrant" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#A7F3D0" />
            <stop offset="75%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#047857" />
          </radialGradient>
          <radialGradient id="cyanNodeVibrant" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#67E8F9" />
            <stop offset="75%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#0284C7" />
          </radialGradient>
          <radialGradient id="coreGlowVibrant" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.55" />
            <stop offset="65%" stopColor="#06B6D4" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient background pulse circle */}
        <circle cx="64" cy="64" r="42" fill="url(#coreGlowVibrant)" />

        {/* Outer orbital network arc (₵ curve) */}
        <path
          d="M 95 33 A 44 44 0 1 0 95 95"
          fill="none"
          stroke="url(#cediGradVibrant)"
          strokeWidth="10.5"
          strokeLinecap="round"
        />

        {/* Inner high-speed data flow arc */}
        <path
          d="M 82 46 A 26 26 0 1 0 82 82"
          fill="none"
          stroke="url(#pulseGlowVibrant)"
          strokeWidth="7.5"
          strokeLinecap="round"
        />

        {/* The Cedi Currency Bar (₵ slash) through the center */}
        <path
          d="M 44 20 L 84 108"
          stroke="url(#cediGradVibrant)"
          strokeWidth="10.5"
          strokeLinecap="round"
        />

        {/* Connectivity Nodes & Data Packets */}
        <circle cx="95" cy="33" r="6" fill="url(#nodeSphereVibrant)" />
        <circle cx="95" cy="95" r="6" fill="url(#nodeSphereVibrant)" />
        <circle cx="44" cy="20" r="5.5" fill="url(#cyanNodeVibrant)" />
        <circle cx="84" cy="108" r="5.5" fill="url(#nodeSphereVibrant)" />

        {/* Central Luminous Data Beacon */}
        <circle cx="64" cy="64" r="5" fill="#FFFFFF" />
        <circle cx="64" cy="64" r="9" stroke="#34D399" strokeWidth="2" strokeOpacity="0.85" />
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
  variant = "default",
}: BrandProps) {
  const isDark = variant === "dark";
  const isLight = variant === "light";

  const markSize =
    size === "xl"
      ? "xl"
      : size === "lg"
      ? "lg"
      : size === "md"
      ? "md"
      : size === "xs"
      ? "xs"
      : "sm";

  const textSize =
    size === "xl"
      ? "text-2xl sm:text-3xl"
      : size === "lg"
      ? "text-xl sm:text-2xl"
      : size === "md"
      ? "text-lg sm:text-xl"
      : size === "xs"
      ? "text-xs sm:text-sm"
      : "text-base sm:text-lg";

  const taglineSize =
    size === "xl"
      ? "text-[11px]"
      : size === "lg"
      ? "text-[10px]"
      : size === "md"
      ? "text-[9px]"
      : size === "xs"
      ? "text-[7px]"
      : "text-[8.5px]";

  const content = (
    <div
      className={cn(
        "inline-flex shrink-0 items-center gap-2.5 sm:gap-3 select-none",
        className
      )}
    >
      <BrandMark size={markSize} variant={variant} />
      <div className="flex flex-col justify-center">
        <div className="flex items-baseline leading-none">
          <span
            className={cn(
              "font-black tracking-tight",
              textSize,
              isDark
                ? "text-white drop-shadow-sm"
                : isLight
                ? "text-slate-900"
                : "text-slate-900 dark:text-white"
            )}
          >
            mycedi
          </span>
          <span
            className={cn(
              "ml-0.5 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text font-black tracking-tight text-transparent",
              textSize,
              isDark && "drop-shadow-[0_0_12px_rgba(52,211,153,0.35)]"
            )}
          >
            net
          </span>
          <span
            className={cn(
              "ml-1.5 hidden rounded-full px-1.5 py-0.5 text-[9px] font-black tracking-wider uppercase sm:inline-block border",
              isDark
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                : isLight
                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                : "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-400/30"
            )}
          >
            GH
          </span>
        </div>
        {showTagline && (
          <span
            className={cn(
              "mt-0.5 font-bold uppercase tracking-[0.24em]",
              taglineSize,
              isDark
                ? "text-emerald-300/80"
                : isLight
                ? "text-slate-500"
                : "text-slate-500 dark:text-emerald-300/80"
            )}
          >
            data telecom network
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex transition-transform hover:scale-[1.02] active:scale-[0.98]">
        {content}
      </Link>
    );
  }

  return content;
}
