// src/components/ui/ProgressBar.jsx
import React from "react";

/**
 * Fortschrittsbalken (universell wiederverwendbar)
 * @param {number} value - Prozentwert (0–100)
 * @param {string} color - CSS-Farbe oder Tailwind-Variable
 */
export default function ProgressBar({
  value = 0,
  color = "var(--nextui-colors-primary)",
}) {
  return (
    <div className="h-2 w-full rounded bg-default-200 overflow-hidden">
      <div
        className="h-full transition-all duration-300 ease-in-out"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}