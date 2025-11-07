// src/components/index.js

// 🔹 ISO-Datum zurückgeben (YYYY-MM-DD)
export function toISO(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const tzOffset = d.getTimezoneOffset() * 60000;
  const local = new Date(d.getTime() - tzOffset);
  return local.toISOString().slice(0, 10);
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

// =======================================================
// ✅ STRATO-kompatibler API-Wrapper (mit Query-Fix + CORS-freundlich)
// =======================================================
export const API_URL = import.meta.env.VITE_API_URL;

export async function api(path = "", options = {}) {
  // Falls path kein ? enthält → automatisch hinzufügen
  const url = path.startsWith("?")
    ? `${API_URL}${path}`
    : `${API_URL}?${path}`;

  const token = JSON.parse(localStorage.getItem("user") || "{}")?.token;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });

    // 🟠 CORS / Auth Fehler abfangen
    if (res.status === 401) {
      console.warn("⚠️ Token evtl. temporär ungültig – bleibe eingeloggt");
      return [];
    }

    if (!res.ok) {
      console.error(`API Fehler: ${res.status}`, url);
      throw new Error("API error");
    }

    return await res.json();
  } catch (err) {
    console.error("❌ Fetch-Fehler:", err.message, url);
    throw err;
  }
}