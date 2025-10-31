// src/utils/habitUtils.js
import { toISO, addDays } from "../components";

// 🔹 ISO-Liste der aktuellen Kalenderwoche (Mo–So)
export function weekIsoList(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const mondayOffset = (d.getDay() + 6) % 7; // Mo=0
  const monday = new Date(d);
  monday.setDate(d.getDate() - mondayOffset);

  return Array.from({ length: 7 }, (_, i) => {
    const x = addDays(monday, i);
    x.setHours(0, 0, 0, 0);
    return toISO(x);
  });
}

// 🔹 Zähler abhängig vom Zeitraum bilden
export function periodCount(habit, activeDate, completions) {
  const by = completions?.[habit.id] || {};
  const iso = toISO(activeDate);

  switch (habit.frequency) {
    case "täglich":
    case "pro_tag":
      return Number(by[iso] || 0);
    case "pro_woche":
      return weekIsoList(activeDate).reduce(
        (sum, key) => sum + Number(by[key] || 0),
        0
      );
    case "pro_monat": {
      const prefix = iso.slice(0, 7);
      return Object.entries(by)
        .filter(([k]) => k.startsWith(prefix))
        .reduce((sum, [, v]) => sum + Number(v || 0), 0);
    }
    case "pro_jahr": {
      const year = String(activeDate.getFullYear());
      return Object.entries(by)
        .filter(([k]) => k.startsWith(year))
        .reduce((sum, [, v]) => sum + Number(v || 0), 0);
    }
    default:
      return Number(by[iso] || 0);
  }
}

// 🔹 Limit abhängig von der Frequenz bestimmen
export function limitFor(habit) {
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