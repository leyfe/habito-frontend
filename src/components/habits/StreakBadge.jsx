import React from "react";
import { Flame, Snowflake } from "lucide-react";

/**
 * 🔥 StreakBadge – zeigt positive oder negative Streaks ab einem Wert von ±3
 *
 * Props:
 *  - value: number (positiver oder negativer Streak)
 *  - minVisible?: number (Standard = 3)
 *  - size?: 'sm' | 'md' | 'lg' (Standard = 'sm')
 *  - className?: string (optionale Tailwind-Klassen)
 */
export default function StreakBadge({ value, minVisible = 3, size = "sm", className = "" }) {
  if (!value || Math.abs(value) < minVisible) return null;

  const isPositive = value > 0;
  const bg = isPositive ? "bg-slate-400 text-slate-100 dark:bg-neutral-400 dark:text-neutral-100" : "bg-rose-400 text-slate-100";
  const icon = isPositive ? (
    <Flame size={size === "lg" ? 18 : 14} className="text-slate-200" />
  ) : (
    <Snowflake size={size === "lg" ? 18 : 14} className="text-slate-100" />
  );

  return (
    <div
      className={`flex items-center h-5 px-2 rounded-lg text-xs gap-1 font-medium select-none shadow-sm ${bg} ${className}`}
    >
      {icon}
      <span>{Math.abs(value)}</span>
    </div>
  );
}