// src/components/habits/HabitCard.jsx
import React, { useRef, useState, useEffect, useContext } from "react";
import {
  Card,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";
import {
  Check,
  Edit3,
  RotateCcw,
  Trash2,
  MoreVertical,
  Plus,
  Minus,
} from "lucide-react";
import { toISO, addDays } from "../index.js";
import { toast } from "react-hot-toast";
import { AppContext } from "../../context/AppContext";

/* -------------------------------- Utils -------------------------------- */

function limitFor(habit) {
  switch (habit.frequency) {
    case "täglich":
    case "pro_tag":
      return Math.max(1, Number(habit.times_per_day || 1));
    case "pro_woche":
      return Math.max(1, Number(habit.times_per_week || 1));
    case "pro_monat":
      return Math.max(1, Number(habit.times_per_month || 1));
    case "pro_jahr":
      return Math.max(1, Number(habit.times_per_year || 1));
    default:
      return 1;
  }
}

function weekIsoList(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const mondayOffset = (d.getDay() + 6) % 7; // Mo=0 … So=6
  const monday = new Date(d);
  monday.setDate(d.getDate() - mondayOffset);
  return Array.from({ length: 7 }, (_, i) => toISO(addDays(monday, i)));
}

function periodCount(habit, activeDate, completions) {
  const by = completions?.[habit.id] || {};
  const iso = toISO(activeDate);
  switch (habit.frequency) {
    case "täglich":
    case "pro_tag":
      return Number(by[iso] || 0);
    case "pro_woche": {
      const isos = weekIsoList(activeDate);
      return isos.reduce((sum, key) => sum + Number(by[key] || 0), 0);
    }
    case "pro_monat": {
      const prefix = iso.slice(0, 7); // YYYY-MM
      return Object.entries(by)
        .filter(([k]) => k.startsWith(prefix))
        .reduce((s, [, v]) => s + Number(v || 0), 0);
    }
    case "pro_jahr": {
      const year = String(activeDate.getFullYear()); // YYYY
      return Object.entries(by)
        .filter(([k]) => k.startsWith(year))
        .reduce((s, [, v]) => s + Number(v || 0), 0);
    }
    default:
      return Number(by[iso] || 0);
  }
}

/* ---- Symmetrische Verknüpfung: ganze Komponente (vorwärts + rückwärts) ---- */

function getLinkedGroup(habit, allHabits) {
  const map = new Map(allHabits.map((h) => [h.id, h]));
  const visited = new Set();
  const stack = [habit.id];

  while (stack.length) {
    const id = stack.pop();
    if (visited.has(id)) continue;
    visited.add(id);

    const h = map.get(id);
    const forward = h?.linked_ids ?? [];

    // Vorwärtskanten
    for (const lid of forward) if (!visited.has(lid)) stack.push(lid);

    // Rückwärtskanten: alle, die auf id zeigen
    for (const other of allHabits) {
      if ((other.linked_ids || []).includes(id) && !visited.has(other.id)) {
        stack.push(other.id);
      }
    }
  }
  return Array.from(visited);
}

function isAnyOfGroupDone(groupIds, allHabits, activeDate, completions) {
  for (const id of groupIds) {
    const h = allHabits.find((x) => x.id === id);
    if (!h) continue;
    const cnt = periodCount(h, activeDate, completions);
    const lim = limitFor(h);
    if (cnt >= lim) return true;
  }
  return false;
}

/* --------------------------- Button-Konfetti (Canvas) --------------------------- */

function ButtonConfetti({ trigger }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!trigger) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const W = (canvas.width = 150);
    const H = (canvas.height = 150);

    const parts = Array.from({ length: 25 }, () => ({
      x: W / 2,
      y: H / 2,
      r: Math.random() * 2 + 1.5,
      a: Math.random() * Math.PI * 2,
      v: Math.random() * 4 + 1,
      hue: Math.random() * 360,
      alpha: 1,
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      parts.forEach((p) => {
        ctx.beginPath();
        ctx.fillStyle = `hsla(${p.hue}, 90%, 60%, ${p.alpha})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        p.x += Math.cos(p.a) * p.v;
        p.y += Math.sin(p.a) * p.v;
        p.v *= 0.97;
        p.alpha -= 0.03;
      });
      for (let i = parts.length - 1; i >= 0; i--) {
        if (parts[i].alpha <= 0) parts.splice(i, 1);
      }
      if (parts.length > 0) raf = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, W, H);
    };
    draw();

    return () => cancelAnimationFrame(raf);
  }, [trigger]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ width: 150, height: 150 }}
    />
  );
}

/* ------------------------------- Hauptkomponente ------------------------------- */

export default function HabitCard({
  habit,
  activeDate,
  increment,
  onEditRequest,
  onDeleteRequest,
  onResetTodayRequest,
  completions,
  groupColor = "slate",
}) {
  const { habits: allHabits } = useContext(AppContext);

  const isBadHabit = habit.type === "bad";

  // Eigene Metriken (für Anzeige und Ring)
  const ownLimit = limitFor(habit);
  const ownCount = periodCount(habit, activeDate, completions);

  // Symmetrische Gruppe + Gruppenerledigung
  const groupIds = getLinkedGroup(habit, allHabits);
  const linkedDone = isAnyOfGroupDone(groupIds, allHabits, activeDate, completions);

  // Endgültiger Done-Status (bad habits bleiben bei count===0 Logik)
  const done = isBadHabit ? ownCount === 0 : linkedDone;

  // Wochenfortschritt (nur bis inkl. „heute“)
  const weekISOs = weekIsoList(activeDate);
  const by = completions?.[habit.id] || {};
  const todayISO = toISO(activeDate);
  const upToToday = weekISOs.filter((iso) => iso <= todayISO);

  let weekProgress = 0;
  if (habit.frequency === "täglich" || habit.frequency === "pro_tag") {
    const reachedDays = upToToday.filter((iso) => (by[iso] || 0) >= ownLimit).length;
    weekProgress = upToToday.length > 0 ? reachedDays / upToToday.length : 0;
  } else {
    const weekCountSoFar = upToToday.reduce(
      (sum, iso) => sum + Number(by[iso] || 0),
      0
    );
    weekProgress = ownLimit > 0 ? weekCountSoFar / ownLimit : 0; // kann >1 werden
  }

  /* ------------------------------- UI-States ------------------------------- */

  const [menuOpen, setMenuOpen] = useState(false);
  const [showWeekDots, setShowWeekDots] = useState(false);
  const [partyMode, setPartyMode] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [shake, setShake] = useState(false);

  // Long-Press fürs Dropdown
  const timer = useRef(null);
  const handlePressStart = () =>
    (timer.current = setTimeout(() => setMenuOpen(true), 600));
  const handlePressEnd = () => clearTimeout(timer.current);

  const handleIncrement = () => {
    const prevCount = periodCount(habit, activeDate, completions);
    increment(habit.id, activeDate);
    const limit = limitFor(habit);
    if (prevCount < limit && prevCount + 1 >= limit) {
        setPartyMode(true);
        setConfetti(true);
        setShake(true);
        setTimeout(() => setPartyMode(false), 800);
        setTimeout(() => setConfetti(false), 1000);
        setTimeout(() => setShake(false), 700);
    }
  };

  const cardColor = done
    ? "bg-slate-300/50 border-slate-200/0 text-slate-400 shadow-none"
    : "bg-slate-100 border-slate-300";

  /* -------------------------------- Render -------------------------------- */

  return (
    <Card
      className={`relative group flex-row py-3 px-4 border rounded-2xl shadow-xl shadow-slate-200 transition-all duration-500
        ${cardColor}
        ${partyMode ? "animate-[party_0.8s_ease-in-out]" : ""}
        ${shake ? "animate-shake" : ""}
      `}
      onMouseDown={() => {
        handlePressStart();
        setShowWeekDots(true);
      }}
      onMouseUp={() => {
        handlePressEnd();
        setTimeout(() => setShowWeekDots(false), 5000);
      }}
      onTouchStart={() => {
        handlePressStart();
        setShowWeekDots(true);
      }}
      onTouchEnd={() => {
        handlePressEnd();
        setTimeout(() => setShowWeekDots(false), 5000);
      }}
    >

      {/* Kopfzeile */}
      <div className="flex flex-1 items-center justify-between relative z-10">
        <div className="pl-2">
          <h3 className="font-semibold -mb-1 text-slate-600 text-md truncate">
            {habit.name}
          </h3>
          <span className="text-xs text-slate-500">
            {ownCount}/{ownLimit}
          </span>
        </div>

        {/* Wochen-Dots (hover/touch) */}
        <div
          className={`absolute right-28 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
            showWeekDots ? "opacity-100" : ""
          }`}
        >
          {weekISOs.map((iso) => {
            const byLocal = completions?.[habit.id] || {};
            let doneToday = false;

            if (habit.frequency === "täglich" || habit.frequency === "pro_tag") {
              doneToday = (byLocal[iso] ?? 0) >= ownLimit;
            } else if (habit.frequency === "pro_woche") {
              doneToday = (byLocal[iso] ?? 0) > 0;
            } else if (habit.frequency === "pro_monat") {
              doneToday = Object.entries(byLocal).some(
                ([k, v]) => k.startsWith(iso.slice(0, 7)) && v > 0
              );
            }
            if (habit.type === "bad") doneToday = !doneToday;

            return (
              <div
                key={iso}
                className={`w-4 h-1 rounded-full ${
                  doneToday
                    ? `bg-${groupColor}-500`
                    : "bg-slate-300/40 dark:bg-slate-700/40"
                }`}
              />
            );
          })}
        </div>

        {/* Menü */}
        <Dropdown isOpen={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownTrigger>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="default"
              onPress={() => setMenuOpen(!menuOpen)}
              className="mr-2"
            >
              <MoreVertical size={16} />
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Habit actions"
            onAction={(key) => {
              if (key === "edit" && onEditRequest) onEditRequest(habit);
              if (key === "reset" && onResetTodayRequest)
                onResetTodayRequest(habit);
              if (key === "delete") {
                toast.custom(
                  (t) => (
                    <div className="bg-slate-800 text-white px-4 py-3 rounded-xl shadow-lg flex flex-col items-center gap-3">
                      <span className="text-sm font-medium">
                        Löschen bestätigen?
                      </span>
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-1 bg-slate-600 rounded-md hover:bg-slate-500 transition"
                          onClick={() => toast.dismiss(t.id)}
                        >
                          Abbrechen
                        </button>
                        <button
                          className="px-3 py-1 bg-red-500 rounded-md hover:bg-red-400 transition"
                          onClick={() => {
                            toast.dismiss(t.id);
                            onDeleteRequest(habit);
                          }}
                        >
                          OK
                        </button>
                      </div>
                    </div>
                  ),
                  { duration: 4000 }
                );
              }
              setMenuOpen(false);
            }}
          >
            <DropdownItem key="edit" startContent={<Edit3 size={14} />}>
              Bearbeiten
            </DropdownItem>
            <DropdownItem
              key="reset"
              color="default"
              startContent={<RotateCcw size={14} />}
            >
              Zurücksetzen (heute)
            </DropdownItem>
            <DropdownItem
              key="delete"
              color="danger"
              startContent={<Trash2 size={14} />}
            >
              Löschen
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>

      {/* Button + Konfetti + Progress-Ring */}
      <div className="flex items-center justify-between relative z-10">
        <div className="relative flex items-center justify-center scale-[0.8]">
          {/* Konfetti hinter dem Button */}
          <div className="absolute inset-0 z-0">
            <ButtonConfetti trigger={confetti} />
          </div>

          {/* Fortschrittsring */}
          <svg
            className="absolute -rotate-90"
            width="64"
            height="64"
            viewBox="0 0 64 64"
          >
            {done ? (
              <circle
                cx="32"
                cy="32"
                r="28"
                strokeWidth="0"
                className={`transition-all duration-500 ease-out fill-${groupColor}-500/40`}
              />
            ) : (
              <>
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  strokeWidth="8"
                  className="fill-slate-100 transition-all duration-500 ease-out stroke-slate-200"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 28}
                  strokeDashoffset={2 * Math.PI * 28 * (1 - weekProgress)}
                  strokeLinecap="round"
                  className={`fill-slate-100 transition-all duration-500 ease-out stroke-${groupColor}-500`}
                />
              </>
            )}
          </svg>

          {/* Hauptbutton */}
          <Button
            isIconOnly
            size="md"
            className={`border-0 rounded-full h-12 w-12 relative z-10 transition-all duration-300 ${
              done ? "bg-slate-500/0" : "bg-slate-100"
            }`}
            onPress={handleIncrement}
            isDisabled={false}
          >
            {done ? (
              <Check className="text-white" size={32} />
            ) : isBadHabit ? (
              <Minus className="text-slate-500" size={32} />
            ) : (
              <Plus className="text-slate-500" size={32} />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}