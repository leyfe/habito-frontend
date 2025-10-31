// src/context/AppLogic.js
import { useState, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import { api, lsGet, lsSet, toISO, addDays, API_URL } from "../components";

export default function useAppLogic() {
  const [activeDate, setActiveDate] = useState(() => new Date());
  const [groups, setGroups] = useState(lsGet("habito.groups", []));
  const [habits, setHabits] = useState(lsGet("habito.habits", []));
  const [todos, setTodos] = useState(lsGet("habito.todos", []));
  const [completions, setCompletions] = useState(lsGet("habito.completions", {}));

  const [collapsed, setCollapsed] = useState(() => lsGet("habito-collapsed", {}));
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [editHabit, setEditHabit] = useState(null);
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [editTodo, setEditTodo] = useState(null);

  const useAPI = !!API_URL;

  const setCollapsedPersist = (next) => {
    setCollapsed(next);
    lsSet("habito-collapsed", next);
  };

  const loadAll = async () => {
    const h = await api("?type=habits");
    const t = await api("?type=todos");
    const g = await api("?type=groups");

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
      map[hb.id] = Object.fromEntries((rows || []).map((r) => [r.date, Number(r.count)]));
    }
    setCompletions(map);

    lsSet("habito.groups", allGroups);
    lsSet("habito.habits", fixedHabits);
    lsSet("habito.todos", t || []);
    lsSet("habito.completions", map);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const weekDates = useMemo(() => {
    const start = new Date(activeDate);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [activeDate]);

  const enrichedHabits = useMemo(() => {
    const iso = toISO(activeDate);
    return habits.map((h) => ({
      ...h,
      _byDate: completions[h.id] || {},
      _todayCount: (completions[h.id] || {})[iso] || 0,
    }));
  }, [habits, completions, activeDate]);

  const getDayLimit = (h) =>
    h.times_per_day && h.times_per_day > 0 ? h.times_per_day : 1;

  const increment = async (habitId, date) => {
    const iso = toISO(date);
    setCompletions((prev) => {
      const copy = { ...prev };
      const by = { ...(copy[habitId] || {}) };
      by[iso] = (by[iso] || 0) + 1;
      copy[habitId] = by;
      lsSet("habito.completions", copy);
      return copy;
    });
    await api(`?type=habit_progress&habit_id=${habitId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: iso }),
    });
  };

  const resetToday = async (habit) => {
    const iso = toISO(activeDate);
    await api(`type=habit_progress&habit_id=${habit.id}&date=${iso}`, {
      method: "DELETE",
    });
    setCompletions((m) => {
      const copy = { ...m };
      const by = { ...(copy[habit.id] || {}) };
      delete by[iso];
      copy[habit.id] = by;
      lsSet("habito.completions", copy);
      return copy;
    });
  };

  const deleteHabit = async (habit) => {
    try {
      await api(`id=${habit.id}`, { method: "DELETE" });
      setHabits((prev) => {
        const updated = prev.filter((h) => h.id !== habit.id);
        lsSet("habito.habits", updated);
        return updated;
      });
      setCompletions((prev) => {
        const copy = { ...prev };
        delete copy[habit.id];
        lsSet("habito.completions", copy);
        return copy;
      });
      toast.success(`"${habit.name}" gelöscht`);
    } catch {
      toast.error("Fehler beim Löschen der Gewohnheit");
    }
  };

  const saveHabit = async (payload) => {
    if (payload.id) {
      await api("type=habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setHabits((hs) => {
        const arr = hs.map((h) => (h.id === payload.id ? { ...h, ...payload } : h));
        lsSet("habito.habits", arr);
        return arr;
      });
      toast.success(`"${payload.name}" aktualisiert`);
    } else {
      const created = await api("type=habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const id = created?.id || (Math.random() * 1e9) | 0;
      const item = { ...payload, id };
      setHabits((hs) => {
        const arr = [item, ...hs];
        lsSet("habito.habits", arr);
        return arr;
      });
      toast.success(`"${payload.name}" hinzugefügt`);
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
    if (payload.id) {
      await api(`type=todos&id=${payload.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setTodos((ts) => {
        const arr = ts.map((t) =>
          t.id === payload.id ? { ...t, ...payload } : t
        );
        lsSet("habito.todos", arr);
        return arr;
      });
    } else {
      const created = await api("type=todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const id = created?.id || (Math.random() * 1e9) | 0;
      const item = { id, ...payload, done: false };
      setTodos((ts) => {
        const arr = [item, ...ts];
        lsSet("habito.todos", arr);
        return arr;
      });
    }
  };

  const deleteTodo = async (id) => {
    try {
      await api(`type=todos&id=${id}`, { method: "DELETE" });
      setTodos((ts) => ts.filter((t) => t.id !== id));
      toast.success("Aufgabe gelöscht");
    } catch {
      toast.error("Fehler beim Löschen der Aufgabe");
    }
  };

  const grouped = useMemo(() => {
    const by = new Map();
    for (const h of enrichedHabits) {
      const gName =
        groups.find((x) => x.id === h.group_id)?.name || "Allgemein";
      if (!by.has(gName)) by.set(gName, []);
      by.get(gName).push(h);
    }
    for (const [, arr] of by)
      arr.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    return Array.from(by.entries());
  }, [enrichedHabits, groups]);

  const todosCollapsed = !!collapsed["__todos"];
  const doneCount = todos.filter((t) => t.done).length;
  const totalTodos = todos.length;

  useEffect(() => {
    if (totalTodos > 0 && doneCount === totalTodos && !todosCollapsed)
      setCollapsedPersist({ ...collapsed, ["__todos"]: true });
  }, [doneCount, totalTodos]);

  return {
    activeDate,
    setActiveDate,
    groups,
    habits,
    todos,
    completions,
    increment,
    getDayLimit,
    deleteHabit,
    resetToday,
    saveHabit,
    saveTodo,
    deleteTodo,
    collapsed,
    setCollapsedPersist,
    todosCollapsed,
    doneCount,
    totalTodos,
    grouped,
    weekDates,
    showHabitModal,
    setShowHabitModal,
    showTodoModal,
    setShowTodoModal,
    editHabit,
    setEditHabit,
    editTodo,
    setEditTodo,
  };
}