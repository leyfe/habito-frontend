// src/components/habits/HabitCard.jsx
import React, { useRef, useState, useEffect, useContext, useMemo } from "react";
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
  X,
} from "lucide-react";
import * as Icons from "lucide-react";
import { CustomIcons } from "../../icons/CustomIcons.jsx";
import { toast } from "react-hot-toast";
import HabitIntensityModal from "./HabitIntensityModal";
import { AppContext } from "../../context/AppContext";
import ButtonConfetti from "./ButtonConfetti";
import WeekDots from "./WeekDots";
import StreakBadge from "./StreakBadge";
import { toISO, addDays, calculateStreak, periodCount, limitFor, weekIsoList} from "@/utils/habitUtils"; 
import { getLinkedGroup, isAnyOfGroupDone } from "@/utils/habitLinks";


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
  isPreview = false, 
}) {
  const { habits: allHabits, groups } = useContext(AppContext);

  const isBadHabit = habit.type === "bad";
  const [localCompletions, setLocalCompletions] = useState(completions);

  // Eigene Metriken (für Anzeige und Ring)
  const ownLimit = limitFor(habit);
  const ownCount = periodCount(habit, activeDate, localCompletions);
  const [streak, setStreak] = useState(0);
  const [isLocalUpdate, setIsLocalUpdate] = useState(false);


// 🔄 Wenn globale Completions sich ändern (z. B. Reset), übernehmen
useEffect(() => {
  if (!isLocalUpdate) {
    setLocalCompletions(completions);
    setStreak(calculateStreak(habit, completions, activeDate));
  } else {
    const t = setTimeout(() => setIsLocalUpdate(false), 300);
    return () => clearTimeout(t);
  }
}, [JSON.stringify(completions), habit.id, activeDate ? activeDate.toISOString() : null]);

  const groupIds = getLinkedGroup(habit, allHabits);
  const linkedDone = isAnyOfGroupDone(groupIds, allHabits, activeDate, localCompletions);

  // Endgültiger Done-Status (bad habits bleiben bei count===0 Logik)
  const done = isBadHabit ? ownCount <= ownLimit : linkedDone;

  // Wochenfortschritt (nur bis inkl. „heute“)
  const weekISOs = weekIsoList(activeDate);
  const by = localCompletions?.[habit.id] || {};
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
  const [showIntensity, setShowIntensity] = useState(false);

  // Long-Press fürs Dropdown
    const timer = useRef(null);
    const startPos = useRef({ x: 0, y: 0 });

    const handlePressStart = (e) => {
    const touch = e.touches ? e.touches[0] : null;
    if (touch) startPos.current = { x: touch.clientX, y: touch.clientY };

    timer.current = setTimeout(() => {
        setMenuOpen(true);
    }, 600);
    };

    const handlePressMove = (e) => {
    const touch = e.touches?.[0];
    if (!touch || !timer.current) return;
    const dx = Math.abs(touch.clientX - startPos.current.x);
    const dy = Math.abs(touch.clientY - startPos.current.y);
    if (dx > 10 || dy > 10) clearTimeout(timer.current); // Finger bewegt → abbrechen
    };

    const handlePressEnd = () => {
    clearTimeout(timer.current);
    };

const handleIncrement = () => {
  const iso = toISO(activeDate);
  const by = localCompletions?.[habit.id] || {};
  const limit = limitFor(habit);
  const prevCount = Number(by[iso] || 0);

  const nextBy = { ...by, [iso]: prevCount + 1 };
  const nextCompletions = { ...localCompletions, [habit.id]: nextBy };

  // 🧠 Direkt hier:
  const newStreak = calculateStreak(habit, nextCompletions, activeDate);
  setStreak(newStreak); // sofort sichtbar!

  setLocalCompletions(nextCompletions);
  setIsLocalUpdate(true);

  // 🔄 Server/Store sync
  increment(habit.id, activeDate);

  // 🎉 Animation (optional)
  const group = groups.find((g) => g.id === habit.group_id);
  const isSportHabit =
    group?.name?.toLowerCase().includes("sport") ||
    group?.name?.toLowerCase().includes("training");
  if (isSportHabit) setTimeout(() => setShowIntensity(true), 300);

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
  ? "bg-slate-300 dark:bg-neutral-800 opacity-50 border-slate-200/0 text-slate-400 dark:text-neutral-500 shadow-none"
  : "bg-slate-100 dark:bg-neutral-800 border-slate-300 dark:border-neutral-700";

  /* -------------------------------- Render -------------------------------- */

  return (
    <Card
      className={`relative group flex-row py-3 px-4 border rounded-2xl shadow-xl shadow-slate-200 dark:shadow-neutral-950 transition-all duration-500
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
      onTouchMove={handlePressMove}
      onTouchEnd={() => {
        handlePressEnd();
        setTimeout(() => setShowWeekDots(false), 5000);
      }}
    >

      {/* Kopfzeile */}
      <div className="flex flex-1 items-center justify-between relative z-10">
        <div className="flex flex-1 items-center gap-3 pl-1">
            {habit.icon && (
            <span className="text-slate-500 dark:text-neutral-300">
                {React.createElement(
                Icons[habit.icon] || CustomIcons[habit.icon] || Icons.HelpCircle,
                { size: 22 }
                )}
            </span>
            )}
            <div>
                <h3 className="font-semibold -mb-1 text-slate-600 dark:text-neutral-200 text-md ">
                    {habit.name}
                </h3>
                <span className="text-xs text-slate-500 dark:text-neutral-400">
                    {ownCount}/{ownLimit}{" "}
                    <span className="opacity-70">
                        {habit.frequency === "täglich"
                        ? "täglich"
                        : habit.frequency === "pro_woche"
                        ? "wöchentlich"
                        : habit.frequency === "pro_monat"
                        ? "monatlich"
                        : habit.frequency === "pro_jahr"
                        ? "jährlich"
                        : ""}
                    </span>
                </span>
            </div>
        </div>

        <WeekDots
          habit={habit}
          weekISOs={weekISOs}
          completions={localCompletions}
          groupColor={groupColor}
          show={showWeekDots}
        />

        {!isPreview && Math.abs(streak) >= 3 && (
          <StreakBadge value={streak} />
        )}
        
        {!isPreview && (
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
                    <div className="bg-slate-500 min-w-[90%] text-slate-200 px-4 py-3 rounded-xl shadow-lg flex flex-col items-center gap-3">
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
                          className="px-3 py-1 bg-slate-200 text-slate-500 rounded-md hover:bg-slate-100 transition"
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
        )}
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
                  className="fill-slate-100 dark:fill-neutral-800 transition-all duration-500 ease-out stroke-slate-200 dark:stroke-neutral-700"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 28}
                  strokeDashoffset={2 * Math.PI * 28 * (1 - weekProgress)}
                  strokeLinecap="round"
                  className={`fill-slate-100 dark:fill-neutral-700 transition-all duration-500 ease-out stroke-${groupColor}-500`}
                />
              </>
            )}
          </svg>

          {/* Hauptbutton */}
          <Button
            isIconOnly
            size="md"
            className={`border-0 rounded-full h-12 w-12 relative z-10 transition-all duration-300 ${
              done ? "bg-slate-500/0" : "bg-slate-100 dark:bg-neutral-800"
            }`}
            onPress={!isPreview ? handleIncrement : undefined}
            isDisabled={isPreview}
          >
            {done ? (
              <Check className="text-white" size={32} />
            ) : isBadHabit ? (
              <X className="text-slate-500 dark:text-neutral-500" size={32} />
            ) : (
              <Plus className="text-slate-500 dark:text-neutral-500" size={32} />
            )}
          </Button>

        </div>
      </div>
      <HabitIntensityModal
        isOpen={showIntensity}
        habit={habit}
        onClose={() => setShowIntensity(false)}
      />
    </Card>
  );
}