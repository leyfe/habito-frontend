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
} from "@nextui-org/react";
import { toISO, api } from "../components";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { AuthContext } from "@/context/AuthContext"; // 🔑 hinzugefügt

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

  const [groups, setGroups] = useState([]);
  const [editGroup, setEditGroup] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // 🔐 AuthContext
  const { logout } = useContext(AuthContext);

  useEffect(() => setMounted(true), []);

  const loadGroups = async () => {
    const g = await api("type=groups");
    setGroups(Array.isArray(g) ? g.sort((a, b) => a.sort_order - b.sort_order) : []);
  };

  useEffect(() => {
    loadGroups();
  }, []);

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
          return prev.map((g) =>
            g.id === payload.id ? { ...g, ...payload } : g
          );
        } else {
          const maxOrder = Math.max(0, ...prev.map((g) => g.sort_order || 0));
          const newGroup = { ...payload, id: newId, sort_order: maxOrder + 1 };
          return [...prev, newGroup].sort((a, b) => a.sort_order - b.sort_order);
        }
      });

      toast.success(payload.id ? "Gruppe aktualisiert" : "Gruppe erstellt");
      setShowModal(false);
      setEditGroup(null);
      setTimeout(loadGroups, 250);
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

  // 🔹 DnD sensors
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
      const payload = newOrder.map((g) => ({ id: g.id, sort_order: g.sort_order }));
      const res = await api("type=groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res?.error) throw new Error(res.error);

      toast.success("Reihenfolge gespeichert");
      setTimeout(loadGroups, 400);
    } catch (err) {
      console.error("Fehler beim Speichern der Sortierung:", err);
      toast.error("Fehler beim Speichern der Reihenfolge");
      loadGroups();
    }
  };

  const handleLogout = () => {
    if (confirm("Möchtest du dich wirklich abmelden?")) {
      logout();
      navigate("/"); // 🔁 automatische Rückkehr zur Login-Seite
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <div className="flex items-center gap-2">
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
        <h2 className="text-xl font-semibold">Darstellung</h2>
        {/* 🌙 Theme-Umschalter */}
        {mounted && (
          <section className="flex items-center justify-between border border-default-200 rounded-xl bg-content1 px-4 py-3">
            <div className="flex items-center gap-3">
              {resolvedTheme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
              <span className="font-medium">Dark Mode</span>
            </div>
            <Switch
              isSelected={resolvedTheme === "dark"}
              onValueChange={(isDark) => setTheme(isDark ? "dark" : "light")}
              size="lg"
              color="primary"
            />
          </section>
        )}

        {/* 🎨 Gruppen */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Gruppen</h2>
            <Button
              color="primary"
              startContent={<Plus size={16} />}
              onPress={() => {
                setEditGroup(null);
                setShowModal(true);
              }}
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

        {/* 🚪 Logout-Bereich */}
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

      {/* 🟣 Modal */}
      <Modal isOpen={showModal} onOpenChange={setShowModal}>
        <ModalContent>
          {(onClose) => {
            let name = editGroup?.name || "";
            let color = editGroup?.color || "#888888";
            const save = () => {
              if (!name.trim()) return toast.error("Bitte Namen eingeben");
              saveGroup({ id: editGroup?.id, name, color });
              onClose();
            };
            return (
              <>
                <ModalHeader>{editGroup ? "Gruppe bearbeiten" : "Neue Gruppe"}</ModalHeader>
                <ModalBody className="space-y-4">
                  <Input
                    label="Gruppenname"
                    defaultValue={name}
                    onChange={(e) => (name = e.target.value)}
                    autoFocus
                  />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Palette size={18} className="text-foreground/60" />
                      <span className="text-sm opacity-80">Farbe</span>
                    </div>
                    <div className="grid grid-cols-8 gap-2">
                      {[
                        "blue",
                        "violet",
                        "pink",
                        "orange",
                        "green",
                        "teal",
                        "yellow",
                        "rose",
                        "slate",
                        "cyan",
                        "lime",
                        "purple",
                      ].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => (color = c)}
                          className={`w-7 h-7 rounded-full border transition-all ${
                            color === c
                              ? "ring-2 ring-slate-100/80 border-primary"
                              : "border-default-300 hover:scale-110"
                          } bg-${c}-500`}                   
                        />
                      ))}
                    </div>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button variant="bordered" onPress={onClose}>
                    Abbrechen
                  </Button>
                  <Button color="primary" onPress={save}>
                    Speichern
                  </Button>
                </ModalFooter>
              </>
            );
          }}
        </ModalContent>
      </Modal>
    </div>
  );
}

/* ---------- SortableGroup ---------- */
function SortableGroup({ group, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: String(group.id),
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between border border-default-200 rounded-xl p-4 bg-content1 hover:shadow-sm transition"
    >
      <div className="flex items-center gap-3">
        <GripVertical {...attributes} {...listeners} className="text-default-400 cursor-grab" />
        <div className={`h-5 w-5 rounded-full border bg-${group.color}-500`}></div>
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