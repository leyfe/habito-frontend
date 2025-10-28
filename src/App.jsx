import React, { useEffect, useMemo, useState, createContext } from "react";
import { ThumbsUp, ListChecks, CircleCheckBig, ChartNoAxesColumn, Calendar1, ChevronRight, ChevronDown, Settings } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { ScrollShadow, ButtonGroup, Button } from "@nextui-org/react";
import { Outlet } from "react-router-dom";

import { useNavigate } from "react-router-dom";
import {
  HeaderBar, DayTimeline, NewDropdown, HabitCard, TodoCard,
  HabitModal, TodoModal, api, lsGet, lsSet, toISO, addDays, API_URL
} from "./components";

export const AppContext = createContext();

export default function App() {
  const navigate = useNavigate();
  const [activeDate, setActiveDate] = useState(()=>new Date());

  // Daten (API-first, sonst LS)
  const [groups, setGroups] = useState(lsGet("habito.groups", []));
  const [habits, setHabits] = useState(lsGet("habito.habits", []));
  const [todos, setTodos] = useState(lsGet("habito.todos", []));
  const [completions, setCompletions] = useState(lsGet("habito.completions", {})); // { habitId: {iso:count} }

  const useAPI = !!API_URL; // Flag – wir versuchen API, fallen zurück auf LS, wenn Calls fehlschlagen

const loadAll = async () => {
  const h = await api("?type=habits");
  const t = await api("?type=todos");
  const g = await api("?type=groups");

  const allGroups = Array.isArray(g) ? g : lsGet("habito.groups", []);

  const fixedHabits = (h?.length ? h : lsGet("habito.habits", [])).map(hb => {
    if (!hb.group_id && hb.group) {
      const match = allGroups.find(gx => gx.name === hb.group);
      if (match) return { ...hb, group_id: match.id };
    }
    return hb;
  });

  setGroups(allGroups);
  setHabits(Array.isArray(h) ? h : lsGet("habito.habits", []));
  setTodos(Array.isArray(t) ? t : lsGet("habito.todos", []));

  // 🧠 completions laden
  const map = {};
  for (const hb of fixedHabits) {
    const rows = await api(`?type=habit_progress&habit_id=${hb.id}`);
    map[hb.id] = Object.fromEntries(
      (rows || []).map(r => [r.date, Number(r.count)])
    );
  }
  setCompletions(map);

  // 🪣 local speichern
  lsSet("habito.groups", allGroups);
  lsSet("habito.habits", fixedHabits);
  lsSet("habito.todos", t || []);
  lsSet("habito.completions", map);
};
  useEffect(()=>{ loadAll(); }, []);

  const weekDates = useMemo(()=>{
    const start=new Date(activeDate); start.setDate(start.getDate()-((start.getDay()+6)%7));
    return Array.from({length:7},(_,i)=>addDays(start,i));
  },[activeDate]);

  const enrichedHabits = useMemo(()=>{
    const iso=toISO(activeDate);
    return habits.map(h=>({ ...h, _byDate: completions[h.id]||{}, _todayCount: (completions[h.id]||{})[iso]||0 }));
  },[habits, completions, activeDate]);

  const getDayLimit = (h)=> (h.times_per_day && h.times_per_day>0 ? h.times_per_day : 1);

  // Increment (API or LS)
  // 🟢 Hochzählen (lokal + API/Storage)
const increment = async (habitId, date) => {
  const iso = toISO(date);

  // 🔹 Schritt 1: Sofort lokal hochzählen (UI-Feedback)
  setCompletions(prev => {
    const copy = { ...prev };
    const by = { ...(copy[habitId] || {}) };
    by[iso] = (by[iso] || 0) + 1;
    copy[habitId] = by;
    lsSet("habito.completions", copy);
    return copy;
  });

  // 🔹 Schritt 2: An API senden
  const res = await api(`?type=habit_progress&habit_id=${habitId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date: iso })
  });

  // 🔹 Schritt 3: Optional nochmal laden, falls du sicherstellen willst, dass DB-Wert stimmt
  if (res && res.ok) {
    // DB hat bestätigt → kein Refresh nötig
  } else {
    // Fallback: neu laden (seltener nötig)
    loadAll();
  }
};
  const resetToday = async (habit) => {
    const iso = toISO(activeDate);
    await api(`type=habit_progress&habit_id=${habit.id}&date=${iso}`, { method: "DELETE" });
    //await api(`/habits/${habit.id}/completions/${iso}`, { method:"DELETE" });
    setCompletions((m)=>{ const copy={...m}; const by={...(copy[habit.id]||{})}; delete by[iso]; copy[habit.id]=by; lsSet("habito.completions", copy); return copy; });
  };
  // 🗑️ Gewohnheit löschen (API + LocalStorage)
  const deleteHabit = async (habit) => {
  try {
    // 🔹 Sofort löschen
    const res = await api(`id=${habit.id}`, { method: "DELETE" });
    if (!res || res.error) console.warn("API delete fehlgeschlagen, fallback auf LocalStorage.");

    const deletedHabit = habit;

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

    if (navigator.vibrate) navigator.vibrate(25);

    // 🔹 Toast mit Undo
    toast(
      (t) => (
        <div className="flex items-center gap-3">
          <span><b>{habit.name}</b> gelöscht.</span>
          <Button
            size="sm"
            color="primary"
            variant="light"
            onPress={() => {
              setHabits((prev) => {
                const updated = [...prev, deletedHabit];
                lsSet("habito.habits", updated);
                return updated;
              });
              toast.dismiss(t.id);
              toast.success(`"${habit.name}" wiederhergestellt`);
            }}
          >
            Rückgängig
          </Button>
        </div>
      ),
      { duration: 4000 }
    );
  } catch (err) {
    console.error("Fehler beim Löschen:", err);
    toast.error("Fehler beim Löschen der Gewohnheit.");
  }
};
  
  // Habits: create/update (API or LS)
  const saveHabit = async (payload) => {
    if (payload.id) {
      await api("type=habits", {method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({name: payload.name, frequency: payload.frequency, times_per_week: payload.times_per_week, group_id: payload.group_id})});
      //await api("type=habits", {method: "POST",  headers: { "Content-Type": "application/json" },  body: JSON.stringify(payload),});
      //await api(`/habits/${payload.id}`, { method:"PUT", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
      setHabits((hs)=>{ const arr=hs.map(h=> h.id===payload.id?{...h,...payload}:h); lsSet("habito.habits", arr); return arr; });
      toast.success(`"${payload.name}" aktualisiert`);
    } else {
      const created = await api("type=habits", {method: "POST",  headers: { "Content-Type": "application/json" },  body: JSON.stringify(payload),});
      //const created = await api("", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
      const id = created?.id || (Math.random()*1e9|0);
      const item = { ...payload, id };
      setHabits((hs)=>{ const arr=[item, ...hs]; lsSet("habito.habits", arr); return arr; });
      
      toast.custom((t) => (
        <div
          className={`${
            t.visible ? 'animate-custom-enter' : 'animate-custom-leave'
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <ThumbsUp className="h-10 w-10 rounded-full" size={18} />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Neue Gewohnheit angelegt
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {payload.name}
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Close
            </button>
          </div>
        </div>
      ))
          }
  };

  // Todos
  const toggleTodo = async (todo) => {
    const upd = { ...todo, done: !todo.done };
    await api(`type=todos&id=${todo.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({name: todo.name, due_date: todo.due_date, done: upd.done})});
    //await api(`/todos/${todo.id}`, { method:"PUT", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(upd) });
    setTodos(ts=>{ const arr=ts.map(t=> t.id===todo.id?upd:t); lsSet("habito.todos", arr); return arr; });
  };
  const saveTodo = async (payload) => {
    if (payload.id) {
      await api(`type=todos&id=${payload.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: payload.name, due_date: payload.due_date,  done: false})});
      //await api(`/todos/${payload.id}`, { method:"PUT", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ name: payload.name, due_date: payload.due_date, done:false }) });
      setTodos(ts=>{ const arr=ts.map(t=> t.id===payload.id?{...t, name:payload.name, due_date:payload.due_date}:t); lsSet("habito.todos", arr); return arr; });
      toast.custom((t) => (
        <div
          className={`${
            t.visible ? 'animate-custom-enter' : 'animate-custom-leave'
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <CircleCheckBig className="h-10 w-10 rounded-full" size={18} />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Aufgabe aktualisiert
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {payload.name}
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Close
            </button>
          </div>
        </div>
      ))
    } else {
      const created = await api("type=todos", {method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({name: payload.name, due_date: payload.due_date })});
      //const created = await api("/todos", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ name: payload.name, due_date: payload.due_date }) });
      const id = created?.id || (Math.random()*1e9|0);
      const item = { id, name: payload.name, due_date: payload.due_date || null, done:false };
      setTodos(ts=>{ const arr=[item, ...ts]; lsSet("habito.todos", arr); return arr; });
      toast.custom((t) => (
        <div
          className={`${
            t.visible ? 'animate-custom-enter' : 'animate-custom-leave'
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <CircleCheckBig className="h-10 w-10 rounded-full" size={18} />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Neue Aufgabe hinzugefügt
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {payload.name}
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Close
            </button>
          </div>
        </div>
      ))
    }
  };
  const deleteTodo = async (id) => {
    try {
      await api(`type=todos&id=${id}`, { method: "DELETE" });
      setTodos((ts) => ts.filter((t) => t.id !== id));
      toast.success("Aufgabe gelöscht");
    } catch (err) {
      console.error("Fehler beim Löschen:", err);
      toast.error("Fehler beim Löschen der Aufgabe");
    }
  };
  // Grouped view
  const grouped = useMemo(()=>{
    const by=new Map();
    for(const h of enrichedHabits){
      const gName = (groups.find(x=>x.id===h.group_id)?.name) || "Allgemein";
      if(!by.has(gName)) by.set(gName, []);
      by.get(gName).push(h);
    }
    for(const [,arr] of by) arr.sort((a,b)=>(a.name||"").localeCompare(b.name||""));
    return Array.from(by.entries());
  },[enrichedHabits, groups]);

  // Collapsible UI
  const [collapsed, setCollapsed] = useState(()=> lsGet("habito-collapsed", {}));
  const setCollapsedPersist=(next)=>{ setCollapsed(next); lsSet("habito-collapsed", next); };
  const todosCollapsed = !!collapsed["__todos"];
  const doneCount=todos.filter(t=>t.done).length, totalTodos=todos.length;
  useEffect(()=>{ if(totalTodos>0 && doneCount===totalTodos && !todosCollapsed) setCollapsedPersist({ ...collapsed, ["__todos"]: true }); }, [doneCount,totalTodos]);

  // Modals
  const [showHabitModal, setShowHabitModal] = useState(false);
  const [editHabit, setEditHabit] = useState(null);
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [editTodo, setEditTodo] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900/100 to-slate-900/100 bg-background text-foreground">
        <Toaster position="bottom-center" />

      <HeaderBar left={
        <ButtonGroup className="border-1 rounded-full border-slate-200/25 bg-gradient-to-r from-slate-100/10 to-slate-200/00">
          <Button className="bg-slate-200/0" size="lg" variant="flat" color="default" radius="full" isIconOnly onPress={()=>navigate("/stats")}><ChartNoAxesColumn size={18} /></Button>
          <Button className="bg-slate-200/0" size="lg" variant="flat" color="default" radius="full" isIconOnly onPress={()=>navigate("/settings")}><Settings size={18} /></Button>
          {toISO(activeDate) !== toISO(new Date()) && (
              <Button className="bg-slate-200/0 transition-all" size="lg" variant="light" color="default" radius="full" isIconOnly onPress={() => setActiveDate(new Date())}><Calendar1 size={18} /></Button>
          )}
          </ButtonGroup>
        /*
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 grid place-items-center">
            <ListChecks size={18} className="text-indigo-500" />
          </div>
          <div className="font-semibold">Habito</div>
        </div>
        */
      } 
      right={
        <div className="flex items-center gap-2">
        
          <ButtonGroup>
            <NewDropdown onNewHabit={()=>setShowHabitModal(true)} onNewTodo={()=>setShowTodoModal(true)} />
          </ButtonGroup>
        </div>
      } />

      <div className="bg-gradient-to-b from-slate-950/0 to-slate-950/0">
        <div className="mx-auto py-0">
          <ScrollShadow >
            <DayTimeline
              activeDate={activeDate}
              onChange={(newDate) => setActiveDate(newDate)} 
              disableFuture
              habits={habits}
              completions={completions}
            />
          </ScrollShadow>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 mt-4 pb-8 space-y-6">
        {/* Groups & Habits */}
        {grouped.map(([groupName, list])=>{
          const key=`grp:${groupName}`, isCol=!!collapsed[key];
          const groupObj = groups.find(g => g.name === groupName);
          const groupColor = groupObj?.color || "var(--nextui-colors-primary)";
          // 🔹 Berechnung Gruppenfortschritt (alle Habits)
          // 🔹 Gruppen-Fortschrittsberechnung (Weekly Score)
          // 🔹 Gruppen-Fortschritt (dynamisch & korrekt)
          const weekISOs = weekDates.map(d => toISO(d));
          const monthPrefix = toISO(activeDate).slice(0, 7); // z. B. "2025-10"
          const yearPrefix = String(new Date(activeDate).getFullYear());

          let achieved = 0;
          let target = 0;

          const breakdown = []; // nur Debug

          for (const h of list) {
            const by = completions?.[h.id] || {};
            let a = 0, t = 0;

            if (h.frequency === "täglich" || h.frequency === "pro_tag") {
              // 📅 tägliches Habit → 7 Tage pro Woche
              const weekCount = weekISOs.reduce((sum, iso) => sum + ((by[iso] ?? 0) > 0 ? 1 : 0), 0);
              a = Math.min(weekCount, 7);
              t = 7;
            }

            else if (h.frequency === "pro_woche") {
              // 📆 Wöchentliches Habit (z. B. 3×/Woche)
              const goal = h.times_per_week || 1;
              const weekCount = weekISOs.reduce((sum, iso) => sum + ((by[iso] ?? 0) > 0 ? 1 : 0), 0);
              a = Math.min(weekCount, goal);
              t = goal;
            }

            else if (h.frequency === "pro_monat") {
              // 🗓 Monats-Habit
              const monthCount = Object.keys(by).reduce((sum, iso) => {
                return sum + (iso.startsWith(monthPrefix) && (by[iso] ?? 0) > 0 ? 1 : 0);
              }, 0);
              const goal = h.times_per_month || 1;
              a = Math.min(monthCount, goal);
              t = goal;
            }

            else if (h.frequency === "pro_jahr") {
              // 🕕 Jahres-Habit
              const yearCount = Object.keys(by).reduce((sum, iso) => {
                return sum + (iso.startsWith(yearPrefix) && (by[iso] ?? 0) > 0 ? 1 : 0);
              }, 0);
              const goal = h.times_per_year || 1;
              a = Math.min(yearCount, goal);
              t = goal;
            }

            else {
              // Fallback
              a = 0;
              t = 0;
            }

            achieved += Number(a);
            target   += Number(t);

            breakdown.push({
              name: h.name,
              frequency: h.frequency,
              goal: t,
              achieved: a
            });
          }

          // Debug-Ausgabe → bei Bedarf wieder auskommentieren
          console.table(breakdown);
          console.log("Group totals → achieved:", achieved, "target:", target);

          const pct = target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0;
          
          return (
            <div key={groupName} className="bg-slate-900/90 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between cursor-pointer"
                   onClick={()=>setCollapsedPersist({ ...collapsed, [key]: !isCol })}>
                <div className="flex items-center gap-2">
                  {isCol ? (
                    <ChevronRight size={18} className="text-foreground/70" />
                  ) : (
                    <ChevronDown size={18} className="text-foreground/70" />
                  )}
                   <span className="font-semibold">{groupName}</span></div>
                  <div className="flex items-center gap-3 w-[40%]">
                    <div className="h-2 w-full rounded bg-default-200 overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${pct}%`, backgroundColor: groupColor }} />
                    </div>
                    <span className="text-xs text-foreground-500">{pct}%</span>
                  </div>
                
              </div>
              {!isCol && (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {list.map(h=>(
                    <HabitCard
                      key={h.id}
                      habit={h}
                      activeDate={activeDate}
                      weekDates={weekDates}
                      increment={increment}
                      getDayLimit={getDayLimit}
                      onEditRequest={(hb) => { setEditHabit(hb); setShowHabitModal(true); }}
                      onDeleteRequest={deleteHabit}
                      onResetTodayRequest={resetToday}
                      groups={groups}
                      completions={completions}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {/* Todos */}
        {totalTodos>0 && (
          <div className="shadow-sm rounded-lg overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between cursor-pointer"
              onClick={()=>setCollapsedPersist({ ...collapsed, ["__todos"]: !todosCollapsed })}>
              <div className="flex items-center gap-2">
                  {todosCollapsed ? (
                    <ChevronRight size={18} className="text-foreground/70" />
                  ) : (
                    <ChevronDown size={18} className="text-foreground/70" />
                  )} <span className="font-semibold">To-Dos</span></div>
                <div className="flex items-center gap-3 w-[40%]">
                  <div className="h-2 w-full rounded bg-default-200 overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${Math.round((doneCount/Math.max(1,totalTodos))*100)}%` }} />
                  </div>
                  <span className="text-xs text-foreground-500">{Math.round((doneCount/Math.max(1,totalTodos))*100)}%</span>
                </div>
            </div>
            {!todosCollapsed && (
              <div className="p-4 grid gap-3">
                {todos.map(t=>(
                  <TodoCard key={t.id} todo={t}
                    toggleTodo={(todo)=>toggleTodo(todo)}
                    onEdit={(td)=>{ setEditTodo(td); setShowTodoModal(true); }}
                    onDelete={(id)=>deleteTodo(id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <HabitModal
        isOpen={showHabitModal}
        onOpenChange={(v)=>{ if(!v) setEditHabit(null); setShowHabitModal(v); }}
        onSave={saveHabit}
        initialHabit={editHabit}
        groups={[{id:null,name:"Allgemein"}, ...groups]}
      />
      <TodoModal
        isOpen={showTodoModal}
        onOpenChange={(v)=>{ if(!v) setEditTodo(null); setShowTodoModal(v); }}
        onSave={saveTodo}
        initialTodo={editTodo}
      />
            <Outlet />

    </div>
  
  );
}