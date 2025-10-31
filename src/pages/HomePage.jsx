// src/pages/HomePage.jsx
import { useContext, useMemo, useState } from "react";
import { AppContext } from "../context/AppContext";
import HeaderBar from "../components/layout/HeaderBar.jsx";
import DayTimeline from "../components/layout/DayTimeline";
import HabitGroup from "../components/habits/HabitGroup";
import TodoGroup from "../components/todos/TodoGroup";
import HabitModal from "../components/habits/HabitModal.jsx";
import TodoModal from "../components/todos/TodoModal";
import NewDropdown from "../components/ui/NewDropdown";
import { ScrollShadow, ButtonGroup, Button } from "@nextui-org/react";
import { Calendar1, ChartNoAxesColumn, Settings } from "lucide-react";
import { toISO } from "../components/index.js";
import { useNavigate } from "react-router-dom";

// 🔹 Bestimmt, wie viele Einträge nötig sind, um das Habit als "erfüllt" zu werten
const getDayLimit = (habit) => {
  switch (habit.frequency) {
    case "täglich":
    case "pro_tag":
      return habit.times_per_day && habit.times_per_day > 0 ? habit.times_per_day : 1;

    case "pro_woche":
      return habit.times_per_week && habit.times_per_week > 0 ? habit.times_per_week : 1;

    case "pro_monat":
      return habit.times_per_month && habit.times_per_month > 0 ? habit.times_per_month : 1;

    case "pro_jahr":
      return habit.times_per_year && habit.times_per_year > 0 ? habit.times_per_year : 1;

    default:
      return 1;
  }
};

export default function HomePage() {
  
  const navigate = useNavigate();  
  const {
    activeDate,
    setActiveDate,
    groups,
    habits,
    todos,
    completions,
    increment,
    deleteHabit,
    saveHabit,
    saveTodo,
    deleteTodo,
    resetToday,
    toggleTodo,
  } = useContext(AppContext);

  const [showHabitModal, setShowHabitModal] = useState(false);
  const [editHabit, setEditHabit] = useState(null);
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [editTodo, setEditTodo] = useState(null);

  const grouped = useMemo(() => {
    const by = new Map();
    for (const h of habits) {
      const gName = groups.find((x) => x.id === h.group_id)?.name || "Allgemein";
      if (!by.has(gName)) by.set(gName, []);
      by.get(gName).push(h);
    }
    return Array.from(by.entries());
  }, [habits, groups]);

  const doneCount = todos.filter((t) => t.done).length;

  return (
    <div className="">
    <div className="-z-10 fixed w-screen h-screen min-h-screen bg-gradient-to-b from-slate-100 to-slate-200"></div>

      {location.pathname !== "/auth" && <HeaderBar
        onNewHabit={() => setShowHabitModal(true)}
        onNewTodo={() => setShowTodoModal(true)}
        />}
      
      <main className="relative">
        <div className="mx-auto min-h-screen max-w-5xl pt-4 px-4 pb-8 space-y-6">
            {grouped.map(([groupName, list]) => (
                <HabitGroup
                key={groupName}
                groupName={groupName}
                list={list}
                activeDate={activeDate}
                increment={increment}
                onEditRequest={(hb) => { setEditHabit(hb); setShowHabitModal(true); }}
                onDeleteRequest={deleteHabit}
                onResetTodayRequest={resetToday}
                getDayLimit={getDayLimit}
                completions={completions}
                />
            ))}
        </div>
            <ScrollShadow className="mx-auto overflow-visible py-2 bg-gradient-to-b from-slate-300/50 to-slate-200/90 left-0 right-0 backdrop-blur-sm z-50 left-0 sticky z-50 border-t-1 border-slate-100/0 shadow-[rgba(100,116,139,0.15)_0px_-25px_25px_0px] bottom-0">
                <DayTimeline
                activeDate={activeDate}
                onChange={(newDate) => setActiveDate(newDate)}
                habits={habits}
                completions={completions}
                />
            </ScrollShadow>
        <div className="w-screen p-4  bg-slate-500">
        {todos.length > 0 && (
        <TodoGroup
            groupName="To-Dos"
            list={todos}
            toggleTodo={toggleTodo} 
            onEditRequest={(todo) => { setEditTodo(todo); setShowTodoModal(true); }}
            onDeleteRequest={(todo) => deleteTodo(todo.id)}
        />
        )}
        </div>
      </main>

      <HabitModal
        isOpen={showHabitModal}
        onOpenChange={(v) => {
          if (!v) setEditHabit(null);
          setShowHabitModal(v);
        }}
        onSave={saveHabit}
        initialHabit={editHabit}
        groups={[{ id: null, name: "Allgemein" }, ...groups]}
      />
      <TodoModal
        isOpen={showTodoModal}
        onOpenChange={(v) => {
          if (!v) setEditTodo(null);
          setShowTodoModal(v);
        }}
        onSave={saveTodo}
        initialTodo={editTodo}
      />
    </div>
  );
}