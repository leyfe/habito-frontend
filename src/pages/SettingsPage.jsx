import React, { useEffect, useState, useContext } from "react";
import {
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Switch,
  Select,
  SelectItem,
  Divider,
  Card,
} from "@nextui-org/react";
import { toast } from "react-hot-toast";
import {
  Palette,
  Pencil,
  Trash2,
  Plus,
  ArrowLeft,
  Moon,
  Sun,
  GripVertical,
  LogOut,
  Settings,
  HelpCircle,
  Mail,
  Database,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { AuthContext } from "@/context/AuthContext";
import { api } from "../components";

// 🧩 DnD imports
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { logout } = useContext(AuthContext);

  const [groups, setGroups] = useState([]);
  const [editGroup, setEditGroup] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // neue Settings
  const [accentColor, setAccentColor] = useState("sky");
  const [sortMode, setSortMode] = useState("default");
  const [dayStart, setDayStart] = useState("05:00");
  const [weekStart, setWeekStart] = useState("monday");

  useEffect(() => setMounted(true), []);

  // 🔹 Gruppen laden
  const loadGroups = async () => {
    const g = await api("type=groups");
    setGroups(Array.isArray(g) ? g.sort((a, b) => a.sort_order - b.sort_order) : []);
  };
  useEffect(() => { loadGroups(); }, []);

  // 🔹 Gruppen speichern/löschen (wie vorher)
  const saveGroup = async (payload) => {
    try {
      const res = await api(`type=groups${payload.id ? `&id=${payload.id}` : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const newId = res?.id || payload.id;
      setGroups((prev) => {
        const existing = prev.find((g) => g.id === payload.id);
        if (existing) {
          return prev.map((g) => g.id === payload.id ? { ...g, ...payload } : g);
        } else {
          const maxOrder = Math.max(0, ...prev.map((g) => g.sort_order || 0));
          const newGroup = { ...payload, id: newId, sort_order: maxOrder + 1 };
          return [...prev, newGroup].sort((a, b) => a.sort_order - b.sort_order);
        }
      });
      toast.success(payload.id ? "Gruppe aktualisiert" : "Gruppe erstellt");
      setShowModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Speichern");
    }
  };

  const deleteGroup = async (id) => {
    if (!window.confirm("Diese Gruppe wirklich löschen?")) return;
    await api(`type=groups&id=${id}`, { method: "DELETE" });
    toast.success("Gruppe gelöscht");
    loadGroups();
  };

  // 🔹 DnD-Handling
  const sensors = useSensors(useSensor(PointerSensor));
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = groups.findIndex((g) => String(g.id) === String(active.id));
    const newIndex = groups.findIndex((g) => String(g.id) === String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(groups, oldIndex, newIndex).map((g, i) => ({
      ...g,
      sort_order: i + 1,
    }));
    setGroups(newOrder);

    try {
      await api("type=groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOrder.map((g) => ({ id: g.id, sort_order: g.sort_order }))),
      });
      toast.success("Reihenfolge gespeichert");
    } catch (err) {
      toast.error("Fehler beim Speichern der Reihenfolge");
    }
  };

  const handleLogout = () => {
    if (confirm("Möchtest du dich wirklich abmelden?")) {
      logout();
      navigate("/");
    }
  };

  // 🔹 Dummy Funktionen für Export & Delete
  const handleExport = () => toast.success("Export gestartet… (Demo)");
  const handleDeleteAll = () => {
    if (confirm("Wirklich ALLE Daten löschen?")) {
      toast.success("Alle Daten gelöscht (Demo)");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <div className="flex items-center gap-2 px-4 pt-4">
        <Button
          size="lg"
          variant="light"
          color="default"
          radius="full"
          isIconOnly
          onPress={() => navigate("/")}
        >
          <ArrowLeft size={18} />
        </Button>
        <div className="font-semibold">Einstellungen</div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-10">

        {/* 🌓 Erscheinungsbild */}
        <Card className="p-4 bg-content1">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Palette size={18} /> Erscheinungsbild
          </h2>
          {mounted && (
            <div className="flex justify-between items-center mb-4">
              <span>Dark Mode</span>
              <Switch
                isSelected={resolvedTheme === "dark"}
                onValueChange={(isDark) => setTheme(isDark ? "dark" : "light")}
                color="primary"
                startContent={<Sun size={14} />}
                endContent={<Moon size={14} />}
              />
            </div>
          )}
          <div>
            <p className="text-sm mb-2">Accent-Farbe</p>
            <Select
              selectedKeys={[accentColor]}
              onChange={(e) => setAccentColor(e.target.value)}
              className="max-w-xs"
            >
              {["sky", "violet", "rose", "emerald", "amber", "blue", "neutral"].map((c) => (
                <SelectItem key={c}>{c}</SelectItem>
              ))}
            </Select>
          </div>
        </Card>

        {/* 🧭 Sortierung */}
        <Card className="p-4 bg-content1">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings size={18} /> Sortierung
          </h2>
          <Select
            selectedKeys={[sortMode]}
            onChange={(e) => setSortMode(e.target.value)}
            className="max-w-xs"
          >
            <SelectItem key="default">Standard</SelectItem>
            <SelectItem key="progress">Nach Fortschritt</SelectItem>
            <SelectItem key="done-bottom">Erledigte unten</SelectItem>
            <SelectItem key="hide-completed">Abgeschlossene ausblenden</SelectItem>
          </Select>
        </Card>

        {/* ⚙️ Allgemein */}
        <Card className="p-4 bg-content1">
          <h2 className="text-lg font-semibold mb-4">Allgemein</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              type="time"
              label="Der Tag beginnt um"
              value={dayStart}
              onChange={(e) => setDayStart(e.target.value)}
            />
            <Select
              label="Die Woche beginnt am"
              selectedKeys={[weekStart]}
              onChange={(e) => setWeekStart(e.target.value)}
            >
              <SelectItem key="monday">Montag</SelectItem>
              <SelectItem key="sunday">Sonntag</SelectItem>
            </Select>
          </div>
        </Card>

        {/* 🔄 Sync & Export */}
        <Card className="p-4 bg-content1">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Database size={18} /> Sync & Export
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button color="primary" onPress={handleExport}>Exportieren</Button>
            <Button color="danger" variant="flat" onPress={handleDeleteAll}>
              Alle Daten löschen
            </Button>
          </div>
        </Card>

        {/* 🆘 Hilfe & Support */}
        <Card className="p-4 bg-content1">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <HelpCircle size={18} /> Hilfe & Support
          </h2>
          <Button
            color="primary"
            variant="flat"
            startContent={<Mail size={16} />}
            onPress={() => (window.location.href = "mailto:support@readflow.app")}
          >
            Kontaktformular öffnen
          </Button>
        </Card>

        {/* 🧩 Gruppen (bestehender Teil bleibt unverändert) */}
        <section>
          <Divider className="my-10" />
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Gruppen</h2>
            <Button
              color="primary"
              startContent={<Plus size={16} />}
              onPress={() => { setEditGroup(null); setShowModal(true); }}
            >
              Neue Gruppe
            </Button>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={groups.map((g) => String(g.id))} strategy={verticalListSortingStrategy}>
              <div className="grid gap-3">
                {groups.map((g) => (
                  <SortableGroup
                    key={g.id}
                    group={g}
                    onEdit={(grp) => { setEditGroup(grp); setShowModal(true); }}
                    onDelete={deleteGroup}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {groups.length === 0 && (
            <p className="text-sm opacity-70 italic">Noch keine Gruppen vorhanden.</p>
          )}
        </section>

        {/* 🚪 Logout */}
        <section className="pt-8 border-t border-default-200">
          <Button
            color="danger"
            variant="flat"
            fullWidth
            startContent={<LogOut size={18} />}
            onPress={handleLogout}
          >
            Logout
          </Button>
        </section>
      </main>
    </div>
  );
}

/* ---------- SortableGroup ---------- */
function SortableGroup({ group, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: String(group.id),
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between border border-default-200 rounded-xl p-4 bg-content1 hover:shadow-sm transition"
    >
      <div className="flex items-center gap-3">
        <GripVertical {...attributes} {...listeners} className="text-default-400 cursor-grab" />
        <div className={`h-5 w-5 rounded-full border bg-${group.color}-500`} />
        <span className="font-medium">{group.name}</span>
      </div>
      <div className="flex gap-2">
        <Button isIconOnly variant="light" color="default" onPress={() => onEdit(group)}>
          <Pencil size={16} />
        </Button>
        <Button isIconOnly color="danger" variant="light" onPress={() => onDelete(group.id)}>
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  );
}