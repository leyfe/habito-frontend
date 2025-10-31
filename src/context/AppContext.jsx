// src/context/AppContext.jsx
import { createContext, useState, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import { api, lsGet, lsSet, toISO, addDays, API_URL } from "../components";

export const AppContext = createContext();

export function AppProvider({ children }) {
    const [activeDate, setActiveDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
    });
  const [groups, setGroups] = useState(lsGet("habito.groups", []));
  const [habits, setHabits] = useState(lsGet("habito.habits", []));
  const [todos, setTodos] = useState(lsGet("habito.todos", []));
  const [completions, setCompletions] = useState(lsGet("habito.completions", {}));

  const useAPI = !!API_URL;

  const loadAll = async () => {
    try {
      const [h, t, g] = await Promise.all([
        api("?type=habits"),
        api("?type=todos"),
        api("?type=groups"),
      ]);

      const allGroups = Array.isArray(g) ? g : lsGet("habito.groups", []);
      const fixedHabits = (h?.length ? h : lsGet("habito.habits", [])).map((hb) => {
        if (!hb.group_id && hb.group) {
          const match = allGroups.find((gx) => gx.name === hb.group);
          if (match) return { ...hb, group_id: match.id };
        }
        return hb;
      });

      setGroups(allGroups);
      setHabits(Array.isArray(h) ? h : lsGet("habito.habits", []));
      setTodos(Array.isArray(t) ? t : lsGet("habito.todos", []));

      const map = {};
      for (const hb of fixedHabits) {
        const rows = await api(`?type=habit_progress&habit_id=${hb.id}`);
        map[hb.id] = Object.fromEntries(
          (rows || []).map((r) => [r.date, Number(r.count)])
        );
      }
      setCompletions(map);

      lsSet("habito.groups", allGroups);
      lsSet("habito.habits", fixedHabits);
      lsSet("habito.todos", t || []);
      lsSet("habito.completions", map);
    } catch (err) {
      console.error("Load error:", err);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

const increment = async (habitId, date) => {
  const iso = toISO(date);

  // 🔹 1. Lokaler Sofort-Update mit "structuredClone" für tiefe Kopie
  setCompletions((prev) => {
    const copy = structuredClone(prev || {}); // tiefe Kopie
    if (!copy[habitId]) copy[habitId] = {};
    copy[habitId][iso] = (copy[habitId][iso] || 0) + 1;

    lsSet("habito.completions", copy);
    return copy; // neue Referenz = neues Rendering
  });

  // 🔹 2. API (Fehler werden geloggt, UI bleibt schnell)
  try {
    await api(`?type=habit_progress&habit_id=${habitId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: iso }),
    });
  } catch (err) {
    console.warn("Increment API failed:", err);
  }

  if (navigator.vibrate) navigator.vibrate(20);
};

  const deleteHabit = async (habit) => {
    try {
      await api(`id=${habit.id}`, { method: "DELETE" });
      setHabits((prev) => {
        const updated = prev.filter((h) => h.id !== habit.id);
        lsSet("habito.habits", updated);
        return updated;
      });
      toast.success(`"${habit.name}" gelöscht`);
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Löschen der Gewohnheit");
    }
  };

  const saveHabit = async (payload) => {
  try {
    const isUpdate = !!payload.id;

    // 1) Server schreiben
    const createdOrOk = await api(
      isUpdate ? `?type=habits&id=${payload.id}` : `?type=habits`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    // 2) Optimistisch (sofortige UI-Reaktion)
    if (isUpdate) {
      setHabits((hs) => {
        const updated = hs.map((h) =>
          h.id === payload.id ? { ...h, ...payload } : h
        );
        lsSet("habito.habits", updated);
        return updated;
      });
    } else {
      const id = createdOrOk?.id || (Math.random() * 1e9) | 0;
      const item = { ...payload, id };
      setHabits((hs) => {
        const arr = [item, ...hs];
        lsSet("habito.habits", arr);
        return arr;
      });
    }

    // 3) Einmal „hart“ nachziehen → garantiert identisch mit DB
    await loadAll();

    toast.success(`"${payload.name}" ${isUpdate ? "aktualisiert" : "hinzugefügt"}`);
  } catch (err) {
    console.error("saveHabit failed:", err);
    toast.error("Fehler beim Speichern der Gewohnheit");
  }
};
  const toggleTodo = async (todo) => {
    const upd = { ...todo, done: !todo.done };
    await api(`type=todos&id=${todo.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(upd),
    });
    setTodos((ts) => {
      const arr = ts.map((t) => (t.id === todo.id ? upd : t));
      lsSet("habito.todos", arr);
      return arr;
    });
  };

const saveTodo = async (payload) => {
    try {
        // 🟩 UPDATE (bestehendes Todo)
        if (payload.id && Number(payload.id) > 0) {
        await api(`type=todos&id=${payload.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        setTodos((todos) => {
            const updated = todos.map((t) =>
            Number(t.id) === Number(payload.id) ? { ...t, ...payload } : t
            );
            lsSet("habito.todos", updated);
            return updated;
        });

        toast.success(`"${payload.name}" aktualisiert ✅`);
        return;
        }

        // 🟦 INSERT (neues Todo)
        const created = await api("type=todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        });

        const id = created?.id || (Math.random() * 1e9) | 0;
        const newTodo = { id, ...payload, done: false };

        setTodos((todos) => {
        const arr = [newTodo, ...todos];
        lsSet("habito.todos", arr);
        return arr;
        });

        toast.success(`"${payload.name}" hinzugefügt ✨`);
    } catch (err) {
        console.error("❌ Fehler beim Speichern des Todos:", err);
        toast.error("Fehler beim Speichern der Aufgabe");
    }
    };

  const deleteTodo = async (id) => {
    try {
      await api(`type=todos&id=${id}`, { method: "DELETE" });
      setTodos((ts) => ts.filter((t) => t.id !== id));
      toast.success("Aufgabe gelöscht");
    } catch (err) {
      toast.error("Fehler beim Löschen der Aufgabe");
    }
  };

  const resetToday = async (habit) => {
    const iso = toISO(activeDate);

    // 🔹 Fortschritt lokal entfernen
    setCompletions((prev) => {
        const copy = { ...prev };
        const by = { ...(copy[habit.id] || {}) };
        delete by[iso];
        copy[habit.id] = by;
        lsSet("habito.completions", copy);
        return copy;
    });

    // 🔹 Optional: API-Aufruf, wenn du Server syncen willst
    try {
        await api(`?type=habit_progress&habit_id=${habit.id}&date=${iso}`, {
        method: "DELETE",
        });
    } catch (err) {
        console.error("Fehler beim Zurücksetzen:", err);
    }
    };

  return (
    <AppContext.Provider
      value={{
        activeDate,
        setActiveDate,
        groups,
        habits,
        todos,
        completions,
        increment,
        saveHabit,
        deleteHabit,
        toggleTodo,
        saveTodo,
        deleteTodo,
        loadAll,
        resetToday
      }}
    >
      {children}
    </AppContext.Provider>
  );
}