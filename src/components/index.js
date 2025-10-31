// src/components/index.js

// 🔹 ISO-Datum zurückgeben (YYYY-MM-DD)
// gibt YYYY-MM-DD immer in lokaler Zeit zurück
export function toISO(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const tzOffset = d.getTimezoneOffset() * 60000;
  const local = new Date(d.getTime() - tzOffset);
  return local.toISOString().slice(0, 10); // z.B. "2025-10-29"
}

// 🔹 Tage addieren
export const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

// 🔹 LocalStorage lesen/schreiben
export const lsGet = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const lsSet = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    console.warn("LocalStorage write failed:", key);
  }
};

// ✅ Strato-kompatible API-Wrapper
// Hinweis: Strato-Server akzeptieren auch `/type=xyz`,
// da PHP $_SERVER['QUERY_STRING'] korrekt füllt.
export const API_URL = import.meta.env.VITE_API_URL || null;

export async function api(path, options = {}) {
  // 🔹 sorgt dafür, dass nur genau ein ? existiert
  const url = path.startsWith("?") ? `${API_URL}${path}` : `${API_URL}?${path}`;

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      console.error("API Fehler:", response.status, url);
      throw new Error("API error");
    }
    return await response.json();
  } catch (err) {
    console.error("API Fehler:", err);
    return null;
  }
}