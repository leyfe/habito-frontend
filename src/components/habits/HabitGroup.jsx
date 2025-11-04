// src/components/habits/HabitGroup.jsx
import React, { useContext, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import HabitCard from "./HabitCard";
import { AppContext } from "../../context/AppContext";

// 🧩 Hilfsfunktionen ----------------------------------------------------

const toISO = (date) => new Date(date).toISOString().split("T")[0];

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const weekIsoList = (date) => {
  const d = new Date(date);
  const mondayOffset = (d.getDay() + 6) % 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - mondayOffset);
  return Array.from({ length: 7 }, (_, i) => toISO(addDays(monday, i)));
};

const limitFor = (h) => {
  switch (h.frequency) {
    case "täglich":
    case "pro_tag":
      return Math.max(1, Number(h.times_per_day || 1));
    case "pro_woche":
      return Math.max(1, Number(h.times_per_week || 1));
    case "pro_monat":
      return Math.max(1, Number(h.times_per_month || 1));
    case "pro_jahr":
      return Math.max(1, Number(h.times_per_year || 1));
    default:
      return 1;
  }
};

// Fortschritt pro Habit (0–1, Teilfortschritt erlaubt)
const habitProgress = (h, activeDate, completions) => {
  const by = completions?.[h.id] || {};
  const lim = limitFor(h);
  const weekISOs = weekIsoList(activeDate);
  const iso = toISO(activeDate);

  let value = 0;
  if (h.frequency === "täglich" || h.frequency === "pro_tag") {
    const reachedDays = weekISOs.filter((iso) => (by[iso] || 0) >= lim).length;
    value = reachedDays / weekISOs.length;
  } else if (h.frequency === "pro_woche") {
    const weekCount = weekISOs.reduce((sum, iso) => sum + (by[iso] || 0), 0);
    value = Math.min(weekCount / lim, 1);
  } else if (h.frequency === "pro_monat") {
    const prefix = iso.slice(0, 7);
    const monthCount = Object.entries(by)
      .filter(([k]) => k.startsWith(prefix))
      .reduce((sum, [, v]) => sum + Number(v), 0);
    value = Math.min(monthCount / lim, 1);
  }

  return h.type === "bad" ? 1 - value : value;
};

// 🔗 Clusterbildung (verknüpfte Habits zählen gemeinsam)
function buildClusters(habits) {
  const map = new Map(habits.map((h) => [String(h.id), h]));
  const visited = new Set();
  const clusters = [];

  for (const h of habits) {
    const startId = String(h.id);
    if (visited.has(startId)) continue;

    const stack = [startId];
    const cluster = [];

    while (stack.length) {
      const curId = stack.pop();
      if (visited.has(curId)) continue;
      visited.add(curId);
      cluster.push(curId);

      const cur = map.get(curId);
      const fwd = (cur?.linked_ids || []).map(String);

      for (const n of fwd) if (!visited.has(n) && map.has(n)) stack.push(n);

      for (const other of habits) {
        if ((other.linked_ids || []).map(String).includes(curId) && !visited.has(String(other.id)))
          stack.push(String(other.id));
      }
    }

    clusters.push(cluster);
  }

  return clusters;
}

// 🧠 Hauptkomponente ----------------------------------------------------

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
  const groupColor = groups.find((g) => g.name === groupName)?.color || "slate";

  if (!list.length) return null;

  // ---- Fortschritt der Gruppe (inkl. Linked-Logik) ----
  const clusters = buildClusters(list);
  const byId = new Map(list.map((h) => [String(h.id), h]));
  let totalProgress = 0;

  for (const cluster of clusters) {
    let clusterProgress = 0;
    let clusterDone = false;

    for (const id of cluster) {
      const h = byId.get(String(id));
      if (!h) continue;
      const progress = habitProgress(h, activeDate, completions);
      if (progress >= 1) clusterDone = true;
      if (progress > clusterProgress) clusterProgress = progress;
    }

    totalProgress += clusterDone ? 1 : clusterProgress;
  }

  const pct =
    clusters.length > 0 ? Math.round((totalProgress / clusters.length) * 100) : 0;

  // 🧩 UI ----------------------------------------------------
  return (
    <div className="mb-3">
      <div
        className="px-4 py-3 flex rounded-2xl items-center justify-between cursor-pointer transition-all"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          {collapsed ? (
            <ChevronRight size={18} className="text-slate-500 dark:text-neutral-500" />
          ) : (
            <ChevronDown size={18} className="text-slate-500 dark:text-neutral-500" />
          )}
          <span className="font-semibold text-sm text-slate-500 dark:text-neutral-400">{groupName}</span>
        </div>

        {/* ✅ Gruppenfortschritt */}
        <div className="flex items-center gap-3 w-[40%]">
          <div className="h-2 w-full rounded bg-slate-200 dark:bg-neutral-800 overflow-hidden">
            <div
              className={`h-full bg-${groupColor}-500 transition-all`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-slate-500 dark:text-neutral-500">{pct}%</span>
        </div>
      </div>

      {/* 🔹 Habits anzeigen */}
      {!collapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {clusters.map((cluster, i) => {
  // alle Habits-Objekte aus den IDs holen
  const habitsInCluster = cluster.map((id) => byId.get(String(id))).filter(Boolean);

  // Wenn nur 1 Habit → normale Darstellung
  if (habitsInCluster.length === 1) {
    const habit = habitsInCluster[0];
    return (
      <HabitCard
        key={habit.id}
        habit={habit}
        activeDate={activeDate}
        increment={increment}
        getDayLimit={getDayLimit}
        onEditRequest={onEditRequest}
        onDeleteRequest={onDeleteRequest}
        onResetTodayRequest={onResetTodayRequest}
        completions={completions}
        groupColor={
          groups.find((g) => g.id === habit.group_id)?.color || "slate"
        }
      />
    );
  }

  // Wenn mehrere → in gemeinsamer Card rendern
  return (
    <div
      key={i}
      className="rounded-2xl border-slate-300 mb-2"
    >
      <div className="flex gap-0.5 flex-col">
        {habitsInCluster.map((habit) => (
          <HabitCard
            key={habit.id}
            habit={habit}
            activeDate={activeDate}
            increment={increment}
            getDayLimit={getDayLimit}
            onEditRequest={onEditRequest}
            onDeleteRequest={onDeleteRequest}
            onResetTodayRequest={onResetTodayRequest}
            completions={completions}
            groupColor={
              groups.find((g) => g.id === habit.group_id)?.color || "slate"
            }
          />
        ))}
      </div>
    </div>
  );
})}
        </div>
      )}
    </div>
  );
}