// src/components/habits/HabitGroup.jsx
import React, { useContext, useState } from "react";
import { AppContext } from "../../context/AppContext";
import { ChevronDown, ChevronRight } from "lucide-react";
import HabitCard from "./HabitCard";
import ProgressBar from "../ui/ProgressBar";
import { weekIsoList, periodCount, limitFor } from "../../utils/habitUtils";


export default function HabitGroup({
  groupName = "Allgemein",
  list = [],
  activeDate,
  increment,
  getDayLimit,
  onEditRequest,
  onDeleteRequest,
  onResetTodayRequest,
  completions = {},
}) {
  const { groups } = useContext(AppContext);
  const [collapsed, setCollapsed] = useState(false);
  const groupColor = groups.find(g => g.name === groupName)?.color || "slate";

  // 🧱 Leerer Zustand
  if (!Array.isArray(list) || list.length === 0) {
    return (
      <div className="bg-slate-900/70 border border-slate-700 rounded-2xl overflow-hidden mb-3">
        <div
          className="px-4 py-3 flex items-center justify-between cursor-pointer"
          onClick={() => setCollapsed(!collapsed)}
        >
          <div className="flex items-center gap-2">
            {collapsed ? (
              <ChevronRight size={18} className="text-foreground/70" />
            ) : (
              <ChevronDown size={18} className="text-foreground/70" />
            )}
            <span className="font-semibold text-white">{groupName}</span>
          </div>
        </div>
        {!collapsed && (
          <div className="px-4 py-3 text-sm text-slate-400 italic">
            Keine Gewohnheiten in dieser Gruppe.
          </div>
        )}
      </div>
    );
  }

  // 📊 Gruppenfortschritt berechnen
    let achieved = 0;
    let target = 0;

    for (const h of list) {
    const by = completions?.[h.id] || {};
    const lim = limitFor(h);
    const isBad = h.type === "bad";
    const weekISOs = weekIsoList(activeDate);

    // 👉 Wochenabhängig berechnen
    if (h.frequency === "täglich" || h.frequency === "pro_tag") {
        const reachedDays = weekISOs.filter((iso) => (by[iso] || 0) >= lim).length;
        achieved += isBad ? (7 - reachedDays) : reachedDays;
        target += 7;
    } 
    else if (h.frequency === "pro_woche") {
        const weekCount = weekISOs.reduce(
        (s, iso) => s + Number(by[iso] || 0),
        0
        );
        const progress = Math.min(weekCount / lim, 1);
        achieved += isBad ? (1 - progress) : progress;
        target += 1;
    } 
    else if (h.frequency === "pro_monat") {
        const prefix = toISO(activeDate).slice(0, 7);
        const monthCount = Object.entries(by)
        .filter(([k]) => k.startsWith(prefix))
        .reduce((s, [, v]) => s + Number(v || 0), 0);
        const progress = Math.min(monthCount / lim, 1);
        achieved += isBad ? (1 - progress) : progress;
        target += 1;
    } 
    else {
        achieved += 0;
        target += 1;
    }
    }

    const pct = target > 0 ? Math.round((achieved / target) * 100) : 0;


  // 🟩 Farbverlauf basierend auf Fortschritt (optional, sieht cool aus)

  return (
    <div className="mb-3">
      <div
        className="px-4 py-3 flex rounded-2xl items-center justify-between cursor-pointer transition-all"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          {collapsed ? (
            <ChevronRight size={18} className="text-slate-500" />
          ) : (
            <ChevronDown size={18} className="text-slate-500" />
          )}
          <span className="font-semibold text-sm text-slate-500">{groupName}</span>
        </div>

        <div className="flex items-center gap-3 w-[40%]">
          <div className="h-2 w-full rounded bg-slate-200 overflow-hidden">
            <div
              className={`h-full bg-${groupColor}-500 transition-all`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-slate-500">{pct}%</span>
        </div>
      </div>

      {!collapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {list.map((h) => (
            <HabitCard
              key={h.id}
              habit={h}
              activeDate={activeDate}
              increment={increment}
              getDayLimit={getDayLimit}
              onEditRequest={onEditRequest}
              onDeleteRequest={onDeleteRequest}
              onResetTodayRequest={onResetTodayRequest}
              completions={completions}
              groupColor={groups.find(g => g.id === h.group_id)?.color || "slate"}
            />
          ))}
        </div>
      )}
    </div>
  );
}