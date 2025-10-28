import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Button, Card, CardHeader, CardBody, Checkbox, Modal, ModalContent,
  ModalHeader, ModalBody, ModalFooter, Input, Select, SelectItem,
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection

} from "@nextui-org/react";


import { Plus, ListChecks, ThumbsUp, SquareCheckBig } from "lucide-react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

/* ---------- API config + Fallback ---------- */
export const API_URL = "http://52071041.swh.strato-hosting.eu/habito/habito-api.php";

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

export const lsGet = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };
export const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

/* ---------- Date utils ---------- */
export const toISO = (d)=>{ const t=new Date(d); t.setHours(0,0,0,0); return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`; };
export const addDays=(d,n)=> new Date(d.getFullYear(), d.getMonth(), d.getDate()+n);
export const weekdayShort=(d)=>["Mo","Di","Mi","Do","Fr","Sa","So"][(new Date(d).getDay()+6)%7];

/* ---------- Header ---------- */
export function HeaderBar({ left, right }) {
  return (
    <div className="sticky top-0 z-40 backdrop-blur bg-gradient-to-b from-gray-950/50 to-gray-950/0 ">
      <div className="mx-auto max-w-5xl px-5 h-20 flex items-center justify-between gap-3">
        
        <div className="flex items-center gap-2">{left}</div>
        <div className="flex items-center gap-2">{right}</div>
      </div>
    </div>
  );
}

export function getWeekdayProgress(iso) {
  // Beispiel: Summiert alle täglichen Habits, die an diesem Tag erledigt wurden
  // → später kannst du das aus deinen completions holen
  const completionsForDay = completionsByDate?.[iso] || 0;
  const totalHabits = totalHabitsCount || 1; // fallback
  const pct = Math.round((completionsForDay / totalHabits) * 100);
  return pct;
}

/* ---------- Timeline ---------- */
export function DayTimeline({
  activeDate,
  onChange,
  disableFuture = true,
  habits = [],
  completions = {},
}) {
  const containerRef = useRef(null);
  const firstScroll = useRef(true);

  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const arr = [];
    for (let i = 180; i >= 1; i--) arr.push(addDays(today, -i));
    arr.push(today);
    for (let i = 1; i <= 60; i++) arr.push(addDays(today, i));
    return arr;
  }, []);

  // Scrollt automatisch zum aktiven Tag
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const t = setTimeout(() => {
      const idx = days.findIndex((d) => toISO(d) === toISO(activeDate));
      if (idx >= 0) {
        const child = el.children[idx];
        if (child) {
          el.scrollTo({
            left: child.offsetLeft - el.clientWidth / 2 + child.clientWidth / 2,
            behavior: firstScroll.current ? "instant" : "smooth",
          });
        }
      }
      firstScroll.current = false;
    }, 20);
    return () => clearTimeout(t);
  }, [activeDate, days]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 🧠 Fortschritt pro Tag berechnen (0–100 %)
  const getDayProgress = (iso) => {
    const totalHabits = habits.length;
    if (totalHabits === 0) return 0;

    let doneHabits = 0;
    for (const h of habits) {
      const val = completions?.[h.id]?.[iso] ?? 0;
      if (Number(val) > 0) doneHabits++;
    }

    return Math.round((doneHabits / totalHabits) * 100);
  };

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="flex gap-2 overflow-x-auto no-scrollbar py-1"
      >
        {days.map((d) => {
          const iso = toISO(d);
          const isActive = iso === toISO(activeDate);
          const isFuture = d > today;

          const base =
            "min-w-[64px] px-2 py-2 rounded-2xl text-sm text-center select-none transition-all flex flex-col items-center";
          const look = isActive
            ? "bg-gradient-to-r from-indigo-500 to-indigo-700 text-primary-foreground border-primary shadow-md "
            : "hover:bg-violet-100/10";
          const dis =
            isFuture && disableFuture
              ? "opacity-40 pointer-events-none"
              : "";

          // 🔹 Fortschritt dieses Tages
          const dayPct = getDayProgress(iso);

          return (
            <button
              key={iso}
              onClick={() => onChange(d)}
              className={`${base} ${look} ${dis}`}
              title={`${iso} (${dayPct}%)`}
            >
              <div className="font-medium">{weekdayShort(d)}</div>

              {/* 🔹 Kreis-Fortschritt */}
              <div className="relative w-9 h-9 my-1">
                <CircularProgressbar
                  value={dayPct}
                  maxValue={100}
                  strokeWidth={10}
                  styles={buildStyles({
                    pathColor:
                      dayPct < 33
                        ? "#ffffff"
                        : dayPct < 66
                        ? "#ffffff"
                        : "#ffffff",
                    trailColor: "rgba(255,255,255,0.1)",
                    strokeLinecap: "round",
                  })}
                />
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold">
                  {iso.slice(8, 10)}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Modals ---------- */
export function HabitModal({ isOpen, onOpenChange, onSave, initialHabit, groups }) {
  const FREQ = [
    { key: "täglich", label: "Täglich" },
    { key: "pro_tag", label: "X / Tag" },
    { key: "pro_woche", label: "X / Woche" },
    { key: "pro_monat", label: "X / Monat" },
    { key: "pro_jahr", label: "X / Jahr" },
  ];

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
      <ModalContent>
        {(onClose) => {
          const [name, setName] = useState(initialHabit?.name || "");
          const [groupId, setGroupId] = useState(initialHabit?.group_id ?? null);
          const [frequency, setFrequency] = useState(initialHabit?.frequency || "täglich");
          const [tpd, setTpd] = useState(initialHabit?.times_per_day || 0);
          const [tpw, setTpw] = useState(initialHabit?.times_per_week || 0);
          const [tpm, setTpm] = useState(initialHabit?.times_per_month || 0);
          const [tpy, setTpy] = useState(initialHabit?.times_per_year || 0);

          const save = () => {
            if (!name.trim()) return;
            onSave({
              id: initialHabit?.id,
              name: name.trim(),
              group_id: groupId,
              frequency,
              times_per_day: tpd,
              times_per_week: tpw,
              times_per_month: tpm,
              times_per_year: tpy,
            });
            onClose();
          };

          const getLabel = () => {
            switch (frequency) {
              case "pro_tag":
                return "Anzahl pro Tag";
              case "pro_woche":
                return "Anzahl pro Woche";
              case "pro_monat":
                return "Anzahl pro Monat";
              case "pro_jahr":
                return "Anzahl pro Jahr";
              default:
                return "";
            }
          };

          const getValue = () => {
            switch (frequency) {
              case "pro_tag":
                return tpd;
              case "pro_woche":
                return tpw;
              case "pro_monat":
                return tpm;
              case "pro_jahr":
                return tpy;
              default:
                return "";
            }
          };

          const setValue = (v) => {
            const val = Number(v || 0);
            if (frequency === "pro_tag") setTpd(val);
            else if (frequency === "pro_woche") setTpw(val);
            else if (frequency === "pro_monat") setTpm(val);
            else if (frequency === "pro_jahr") setTpy(val);
          };

          return (
            <>
              <ModalHeader>{initialHabit ? "Gewohnheit bearbeiten" : "Neue Gewohnheit"}</ModalHeader>
              <ModalBody className="space-y-3">
                <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
                <Select
                  label="Gruppe"
                  selectedKeys={[String(groupId ?? "")]}
                  onChange={(e) => setGroupId(Number(e.target.value) || null)}
                >
                  {(groups?.length ? groups : [{ id: null, name: "Allgemein" }]).map((g) => (
                    <SelectItem key={String(g.id ?? "")}>{g.name}</SelectItem>
                  ))}
                </Select>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select label="Frequenz" selectedKeys={[frequency]} onChange={(e) => setFrequency(e.target.value)}>
                    {FREQ.map((f) => (
                      <SelectItem key={f.key}>{f.label}</SelectItem>
                    ))}
                  </Select>


                  {frequency !== "täglich" && (
                    <Input
                      type="number"
                      label={getLabel()}
                      value={getValue()}
                      onChange={(e) => setValue(e.target.value)}
                    />
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="bordered" onPress={() => onClose()}>
                  Abbrechen
                </Button>
                <Button color="primary" onPress={save}>
                  {initialHabit ? "Speichern" : "Anlegen"}
                </Button>
              </ModalFooter>
            </>
          );
        }}
      </ModalContent>
    </Modal>
  );
}

export function TodoModal({ isOpen, onOpenChange, onSave, initialTodo }) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md">
      <ModalContent>{(onClose)=>{
        let name=initialTodo?.name||"", due=initialTodo?.due_date||"";
        const save=()=>{ if(!name.trim()) return; onSave({ id:initialTodo?.id, name:name.trim(), due_date:due||null }); onClose(); };
        return (<>
          <ModalHeader>{initialTodo?"Aufgabe bearbeiten":"Neue Aufgabe"}</ModalHeader>
          <ModalBody className="space-y-3">
            <Input label="Bezeichnung" defaultValue={name} onChange={(e)=>name=e.target.value} autoFocus />
            <Input type="date" label="Erledigen bis" defaultValue={due||""} onChange={(e)=>due=e.target.value} />
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" onPress={()=>onClose()}>Abbrechen</Button>
            <Button color="success" onPress={save}>{initialTodo?"Speichern":"Hinzufügen"}</Button>
          </ModalFooter>
        </>);
      }}</ModalContent>
    </Modal>
  );
}

/* ---------- Cards + Dropdown ---------- */
export function NewDropdown({ onNewHabit, onNewTodo }) {
  const [open,setOpen]=useState(false);
  return (


    <Dropdown backdrop="blur" isOpen={open} onOpenChange={setOpen}>

      <DropdownTrigger>
        <Button className={`bg-gradient-to-r from-indigo-950/80 to-slate-950/40`} size="md" radius="full" isIconOnly><Plus size={18} /></Button>
      </DropdownTrigger>
      <DropdownMenu variant="flat" color="primary"> 
        <DropdownSection showDivider aria-label="Preferences">
        <DropdownItem
          onPress={()=>{onNewHabit?.();setOpen(false);}}
          startContent={<ThumbsUp
          key="habit" />}
        >
          Neue Gewohnheit
        </DropdownItem>
        </DropdownSection>
        
         <DropdownItem
          onPress={()=>{onNewTodo?.();setOpen(false);}}
          startContent={<SquareCheckBig
          key="todo" />}
        >
          Neue Aufgabe
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}

export function TodoCard({ todo, toggleTodo, onEdit, onDelete }) {
  const [menuOpen,setMenuOpen]=useState(false);
  const timer=useRef(null);
  const start=(e)=>{ if(e.type==="mousedown"&&e.button!==0) return; timer.current=setTimeout(()=>{setMenuOpen(true);timer.current=null;},700); };
  const clear=()=>{ if(timer.current){ clearTimeout(timer.current); timer.current=null; } };
  return (<>
    <div onClick={()=>toggleTodo?.(todo)} onPointerDown={start} onPointerUp={clear} onPointerLeave={clear}
      className={`rounded-lg flat bg-content1 p-3 transition-all cursor-pointer ${todo.done?"opacity-50 line-through":"hover:shadow-md"}`}
      title={todo.due_date?`bis ${todo.due_date}`:undefined}>
      <Checkbox
        isSelected={todo.done}
        color="success"
        radius="sm"
        onChange={() => toggleTodo?.(todo)}
      >
        <div className="text-sm">{todo.name}</div>
      {todo.due_date && <div className="text-[11px] opacity-70">{todo.due_date}</div>}
      </Checkbox>
    </div>
    <Modal isOpen={menuOpen} onOpenChange={setMenuOpen} size="xs">
      <ModalContent>{(onClose)=>(<>
        <ModalHeader>Aufgabe</ModalHeader>
        <ModalBody className="space-y-2">
          <Button color="primary" variant="flat" onPress={()=>{onClose(); onEdit?.(todo);}}>Bearbeiten</Button>
          <Button color="danger" variant="flat" onPress={()=>{onClose(); onDelete?.(todo.id);}}>Löschen</Button>
        </ModalBody>
        <ModalFooter><Button variant="bordered" onPress={()=>onClose()}>Abbrechen</Button></ModalFooter>
      </>)}</ModalContent>
    </Modal>
  </>);
}
/* =========================================================
   Habit Card (klickbar + Wochen-Progress + Long-Press Menü)
   ========================================================= */
/* =========================================================
   Habit Card – klickbar, Longpress & korrekte Gruppenfarbe
   ========================================================= */
function hexToRgba(hex, alpha = 0.85) {
  if (!hex || !hex.startsWith("#")) return hex;
  const int = parseInt(hex.slice(1), 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ---------- Helpers für Habit-Progress ---------- */
function getWeekRange(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Montag=0
  const monday = new Date(d);
  monday.setDate(d.getDate() - day);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { monday, sunday };
}

export function getDayLimit(habit, date = new Date()) {
  // Rückgabe: Wie oft darf / soll diese Gewohnheit heute noch gemacht werden
  if (habit.frequency === "täglich") return 1;
  if (habit.frequency === "pro_tag") return habit.times_per_day || 1;
  if (habit.frequency === "pro_woche") return habit.times_per_week || 1;
  if (habit.frequency === "pro_monat") return habit.times_per_month || 1;
  if (habit.frequency === "pro_jahr") return habit.times_per_year || 1;
  return 1;
}

/* ---------- Wochenfortschritt zählen ---------- */
export function getWeekProgress(habit, weekDates, completions) {
  const completedDays = weekDates.filter((d) => {
    const iso = toISO(d);
    const val = completions?.[habit.id]?.[iso];
    return Number(val) > 0;
  }).length;

  const goal = habit.times_per_week || 1;
  const progress = Math.min(completedDays, goal);
  return { progress, goal };
}

export function HabitCard({
  habit,
  activeDate,
  weekDates,
  increment,
  getDayLimit,
  onEditRequest,
  onDeleteRequest,
  onResetTodayRequest,
  groups,
  completions={completions}
}) {
  const iso = toISO(activeDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isFutureDay = new Date(activeDate).setHours(0, 0, 0, 0) > today;

  // 🔹 Fortschrittsberechnung
let count = 0;
let limit = getDayLimit(habit);

if (habit.frequency === "pro_woche") {
  const { progress, goal } = getWeekProgress(habit, weekDates, completions);
  count = progress;
  limit = goal;
} else {
  const v = completions?.[habit.id]?.[iso] ?? 0;
  count = Number(v);
}

  // 🔹 Farblogik: Gruppenfarbe > Habitfarbe > Standardfarbe
  const groupColor =
    groups?.find((g) => g.id === habit.group_id)?.color ||
    habit.color ||
    "var(--nextui-colors-primary)";

  const [menuOpen, setMenuOpen] = React.useState(false);
  const timer = React.useRef(null);

  const handleClick = React.useCallback(() => {
    if (isFutureDay) return;
    increment(habit.id, activeDate);
    if (navigator.vibrate) navigator.vibrate(25);
  }, [increment, habit.id, activeDate, isFutureDay]);

  const handleDown = () => {
    timer.current = setTimeout(() => setMenuOpen(true), 700);
  };
  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  return (
    <div

      className={`rounded-lg flat p-4 hover:shadow-md transition-all cursor-pointer select-none bg-gradient-to-r from-${groupColor}-600/100 to-${groupColor}-800 ${
        count >= limit && limit > 0 ? "opacity-60" : ""
      }`}
      onClick={handleClick}
      onPointerDown={handleDown}
      onPointerUp={clearTimer}
      onPointerLeave={clearTimer}
    >
      <div className="flex items-center justify-between pb-1">
        <div className="text-sm font-semibold">{habit.name}</div>
        <div className="text-xs font-semibold opacity-75 tabular-nums">
          {count}/{limit}
        </div>
      </div>

      {/* Wochenbalken – korrekt mit Gruppenfarbe */}
      <div className="flex gap-1 mb-2">
        {weekDates.map((d) => {
          const wISO = toISO(d);
          const val = completions?.[habit.id]?.[wISO];
          const n =
            val === true
              ? 1
              : val === false || val == null
              ? 0
              : Math.max(0, Number(val) || 0);
          const isFuture = new Date(d).setHours(0, 0, 0, 0) > today;

          let bg, height;
          if (n > 0) {
            bg = "rgba(255,255,255,1)"
            height = "h-0.5 flex-1 rounded";
          } else {
            bg = isFuture
              ? "rgba(255,255,255,0)"
              : "rgba(255,255,255,0)";
            height = isFuture
              ? "h-0.5 flex-1 rounded"
              : "h-0.5 flex-1 rounded";
          }

          return (
            <div
              key={wISO}
              className= {`${height}`}
              style={{ backgroundColor: bg }}
              title={`${wISO} • ${n}`}
            />
          );
        })}
      </div>

      {/* Long-Press Menü */}
      <Modal isOpen={menuOpen} onOpenChange={setMenuOpen} size="xs">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Aktionen</ModalHeader>
              <ModalBody className="space-y-2">
                <Button
                  color="primary"
                  variant="flat"
                  onPress={() => {
                    onClose();
                    onEditRequest?.(habit);
                  }}
                >
                  Bearbeiten
                </Button>
                <Button
                  color="warning"
                  variant="flat"
                  onPress={() => {
                    onClose();
                    onResetTodayRequest?.(habit);
                  }}
                >
                  Fortschritt (heute) zurücksetzen
                </Button>
                <Button
                  color="danger"
                  variant="flat"
                  onPress={() => {
                    onClose();
                    onDeleteRequest?.(habit);
                  }}
                >
                  Löschen
                </Button>
              </ModalBody>
              <ModalFooter>
                <Button variant="bordered" onPress={() => onClose()}>
                  Schließen
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}