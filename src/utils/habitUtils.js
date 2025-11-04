// src/utils/habitUtils.js
//import { toISO } from "../components";

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

export function toISO(date) {
  // ❗ Fallback: leere Werte sofort abfangen
  if (!date) return null;

  const d = new Date(date);

  // ❗ Prüfen, ob das Datum gültig ist
  if (isNaN(d.getTime())) return null;

  // 👇 Dein bestehender Code bleibt gleich
  d.setHours(0, 0, 0, 0);
  const tzOffset = d.getTimezoneOffset() * 60000;
  const local = new Date(d.getTime() - tzOffset);
  return local.toISOString().slice(0, 10);
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// 🔥 Berechnet den aktuellen Streak (in Tagen, Wochen oder Monaten)
export function calculateStreak(habit, completions, activeDate = new Date()) {
  const by = completions?.[habit.id] || {};

  // Hilfsfunktionen: lokale Tage vergleichen, Keys IMMER via toISO(...)
  const startOfDayLocal = (d) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  const isoOf = (d) => toISO(startOfDayLocal(d)); // <— WICHTIG: dein toISO!

  const isBad = habit.type === "bad";
  const today = startOfDayLocal(activeDate);
  const prev = new Date(today); prev.setDate(today.getDate() - 1);

  // ---- TÄGLICH / PRO_TAG ----
  if (habit.frequency === "täglich" || habit.frequency === "pro_tag") {
    const limit = Math.max(1, Number(habit.times_per_day || 1));

    const successOn = (d) => {
      const v = Number(by[isoOf(d)] || 0);
      return isBad ? v < limit : v >= limit;
    };

    // 1) Heute erfüllt? → ab heute rückwärts zählen (inkl. heute)
    if (successOn(today)) {
      let streak = 0;
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        if (successOn(d)) streak++;
        else break;
      }
      return streak;
    }

    // 2) Heute noch nicht „erfüllt“, aber heute schon >0 → Serie ab heute = 1 + rückwärts
    if (!successOn(today) && Number(by[isoOf(today)] || 0) > 0) {
      let streak = 1;
      let d = new Date(today); d.setDate(today.getDate() - 1);
      while (successOn(d)) {
        streak++;
        d.setDate(d.getDate() - 1);
      }
      return streak;
    }

    // 3) Gestern erfüllt? → Serie bis gestern
    if (successOn(prev)) {
      let streak = 0;
      for (let i = 0; i < 365; i++) {
        const d = new Date(prev);
        d.setDate(prev.getDate() - i);
        if (successOn(d)) streak++;
        else break;
      }
      return streak;
    }

    // 4) Weder heute noch gestern → negative Serie (verpasste Tage bis zur letzten Erfüllung)
    let misses = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(prev);
      d.setDate(prev.getDate() - i);
      if (!successOn(d)) misses++;
      else break;
    }
    return misses > 0 ? -misses : 0;
  }

  // ---- PRO_WOCHE ----
  if (habit.frequency === "pro_woche") {
    const limit = Math.max(1, Number(habit.times_per_week || 1));

    const mondayOf = (d) => {
      const x = startOfDayLocal(d);
      const day = x.getDay() || 7; // So=0 → 7
      x.setDate(x.getDate() - day + 1);
      return x;
    };

    // Summe einer Woche: vergleiche über String-Keys (YYYY-MM-DD), NICHT Date-Parsing
    const weekSum = (monday) => {
      const start = mondayOf(monday);
      const startIso = isoOf(start);
      const end = new Date(start); end.setDate(start.getDate() + 7);
      const endIso = isoOf(end);

      return Object.entries(by).reduce((sum, [k, v]) => {
        // k ist "YYYY-MM-DD" (lokal), daher Stringvergleich ok:
        return (k >= startIso && k < endIso) ? sum + Number(v || 0) : sum;
      }, 0);
    };

    const currentMonday = mondayOf(today);
    const lastFullMonday = new Date(currentMonday);
    lastFullMonday.setDate(lastFullMonday.getDate() - 7);

    let pos = 0;
    for (let i = 0; i < 104; i++) {
      const m = new Date(lastFullMonday);
      m.setDate(lastFullMonday.getDate() - i * 7);
      const sum = weekSum(m);
      const ok = isBad ? sum <= Math.max(0, 7 - limit) : sum >= limit;
      if (ok) pos++; else break;
    }
    if (pos > 0) return pos;

    let lastGood = null;
    for (let i = 0; i < 104; i++) {
      const m = new Date(lastFullMonday);
      m.setDate(lastFullMonday.getDate() - i * 7);
      const sum = weekSum(m);
      const ok = isBad ? sum <= Math.max(0, 7 - limit) : sum >= limit;
      if (ok) { lastGood = m; break; }
    }
    if (!lastGood) return 0;

    const diffWeeks = Math.floor((lastFullMonday - lastGood) / (1000 * 60 * 60 * 24 * 7));
    return diffWeeks >= 1 ? -diffWeeks : 0;
  }

  // ---- PRO_MONAT ----
  if (habit.frequency === "pro_monat") {
    const limit = Math.max(1, Number(habit.times_per_month || 1));

    const ym = (d) => {
      const x = startOfDayLocal(d);
      return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`;
    };

    const monthSum = (yearMonth) =>
      Object.entries(by)
        .filter(([k]) => k.startsWith(yearMonth)) // String-Check
        .reduce((s, [, v]) => s + Number(v || 0), 0);

    const lastFullMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    let pos = 0;
    for (let i = 0; i < 60; i++) {
      const d = new Date(lastFullMonth.getFullYear(), lastFullMonth.getMonth() - i, 1);
      const sum = monthSum(ym(d));
      const ok = isBad ? sum === 0 : sum >= limit;
      if (ok) pos++; else break;
    }
    if (pos > 0) return pos;

    let lastGood = null;
    for (let i = 0; i < 60; i++) {
      const d = new Date(lastFullMonth.getFullYear(), lastFullMonth.getMonth() - i, 1);
      const sum = monthSum(ym(d));
      const ok = isBad ? sum === 0 : sum >= limit;
      if (ok) { lastGood = d; break; }
    }
    if (!lastGood) return 0;

    const diffMonths =
      (lastFullMonth.getFullYear() - lastGood.getFullYear()) * 12 +
      (lastFullMonth.getMonth() - lastGood.getMonth());
    return diffMonths >= 1 ? -diffMonths : 0;
  }

  return 0;
}


// 🔹 Zähler abhängig vom Zeitraum bilden
export function periodCount(habit, activeDate, completions) {
  if (!activeDate) return 0; // 🧩 Schutz gegen null / undefined

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

