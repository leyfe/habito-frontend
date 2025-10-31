// src/components/layout/DayTimeline.jsx
import React, { useRef, useEffect, useMemo, useState } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { addDays, toISO } from "../index.js";
import { Chip, Button } from "@nextui-org/react";

export default function DayTimeline({
  activeDate,
  onChange,
  disableFuture = true,
  habits = [],
  completions = {},
}) {
  const containerRef = useRef(null);
  const firstScroll = useRef(true);
  const [visibleMonth, setVisibleMonth] = useState("");
  const [showMonth, setShowMonth] = useState(false);
  const hideTimeout = useRef(null);

  // 🧭 Heutiges Datum sauber auf Mitternacht setzen
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  // 🧠 Tage um "heute" herum (180 zurück, 60 vor)
  const days = useMemo(() => {
    const arr = [];
    for (let i = 180; i >= 1; i--) {
      const d = addDays(today, -i);
      d.setHours(0, 0, 0, 0);
      arr.push(d);
    }
    arr.push(today);
    for (let i = 1; i <= 60; i++) {
      const d = addDays(today, i);
      d.setHours(0, 0, 0, 0);
      arr.push(d);
    }
    return arr;
  }, [today]);

  // 🎯 Scroll automatisch zum aktiven Tag
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const t = setTimeout(() => {
      const idx = days.findIndex((d) => toISO(d) === toISO(activeDate));
      if (idx >= 0) {
        const child = el.children[idx];
        if (child) {
          el.scrollTo({
            left: child.offsetLeft - el.clientWidth / 2 + child.clientWidth / 2,
            behavior: firstScroll.current ? "instant" : "smooth",
          });
        }
      }
      firstScroll.current = false;
    }, 30);
    return () => clearTimeout(t);
  }, [activeDate, days]);

  // 📊 Tagesfortschritt (0–100 %)
  const getDayProgress = (iso) => {
    const total = habits.length;
    if (total === 0) return 0;
    const done = habits.filter((h) => (completions?.[h.id]?.[iso] ?? 0) > 0).length;
    return Math.round((done / total) * 100);
  };

  // 📅 Wochentag (kurz, z. B. „Mo“, „Di“)
  const weekdayShort = (date) =>
    new Intl.DateTimeFormat("de-DE", { weekday: "short" }).format(date);

  // 🗓️ Monatstitel aktualisieren
  useEffect(() => {
    const month = new Intl.DateTimeFormat("de-DE", {
      month: "long",
      year: "numeric",
    }).format(activeDate);
    setVisibleMonth(month.charAt(0).toUpperCase() + month.slice(1));

    // Monat kurz einblenden, wenn activeDate geändert wird
    setShowMonth(true);
    clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => setShowMonth(false), 2000);
  }, [activeDate]);

  // 🖱️ Wenn der Nutzer scrollt → Monat einblenden
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleScroll = () => {
      setShowMonth(true);
      clearTimeout(hideTimeout.current);
      hideTimeout.current = setTimeout(() => setShowMonth(false), 2000);
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const isToday = toISO(activeDate) === toISO(today);

  return (
    <div className="relative w-full">
        {/* 🔘 "Heute"-Button – erscheint nur wenn nötig */}
      {!isToday && (
        <div className="absolute right-3 top-0">
          <Button
            size="sm"
            radius="full"
            color="default"
            className="bg-slate-200/70 hover:bg-slate-300 text-slate-700 text-xs font-medium shadow-sm"
            onPress={() => onChange(today)}
          >
            Heute
          </Button>
        </div>
    )}
      {/* 🔹 Monatstitel (wird eingeblendet beim Klick oder Scroll) */}
      <Chip
        className={`absolute h-6 m-auto left-0 right-0 -top-6 bg-slate-200/50 text-slate-500 text-xs select-none transition-opacity duration-500 ${
          showMonth ? "opacity-100" : "opacity-0"
        }`}
      >
        {visibleMonth}
      </Chip>

      {/* 🔹 Scrollbare Timeline */}
      <div
        ref={containerRef}
        className="flex gap-2 overflow-x-auto no-scrollbar py-2 px-1"
      >
        {days.map((d) => {
          const iso = toISO(d);
          const isActive = iso === toISO(activeDate);
          const isFuture = d > today;
          const dayPct = getDayProgress(iso);

          const base =
            "px-2 py-2 rounded-2xl text-sm text-center select-none transition-all flex flex-col items-center";
          const look = isActive
            ? "min-w-[64px] bg-gradient-to-b from-slate-400/30 to-slate-400/30 text-slate-500"
            : "text-slate-500 hover:bg-slate-200";
          const dis =
            isFuture && disableFuture ? "opacity-40 pointer-events-none" : "";

          return (
            <button
              key={iso}
              onClick={() => onChange(d)}
              className={`${base} ${look} ${dis}`}
              title={`${iso} (${dayPct} %)`}
            >
              <div className="font-medium">{weekdayShort(d)}</div>

              {/* 🔹 Kreis-Fortschritt */}
              <div className="relative w-9 h-9 my-1">
                <CircularProgressbar
                  value={dayPct}
                  maxValue={100}
                  strokeWidth={10}
                  styles={buildStyles({
                    pathColor: "currentColor",
                    trailColor: "rgba(0,0,0,0.05)",
                    strokeLinecap: "round",
                  })}
                />
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold">
                  {d.getDate()}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}