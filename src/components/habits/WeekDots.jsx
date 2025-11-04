// src/components/habits/WeekDots.jsx
import React from "react";

export default function WeekDots({ habit, weekISOs, completions, groupColor, show }) {
  const by = completions?.[habit.id] || {};
  const ownLimit = habit.times_per_day || 1;

  return (
    <div
      className={`absolute right-28 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
        show ? "opacity-100" : ""
      }`}
    >
      {weekISOs.map((iso, i) => {
        const safeKey = iso || `weekdot-${i}`;
        let done = false;

        if (habit.frequency === "täglich" || habit.frequency === "pro_tag") {
          done = (by[iso] ?? 0) >= ownLimit;
        } else if (habit.frequency === "pro_woche") {
          done = (by[iso] ?? 0) > 0;
        } else if (habit.frequency === "pro_monat") {
          done = Object.entries(by).some(([k, v]) => k.startsWith(iso?.slice(0, 7)) && v > 0);
        }
        if (habit.type === "bad") done = !done;

        return (
          <div
            key={safeKey}
            className={`w-4 h-1 rounded-full ${
              done ? `bg-${groupColor}-500` : "bg-slate-300/40 dark:bg-slate-700/40"
            }`}
          />
        );
      })}
    </div>
  );
}