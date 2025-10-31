// src/components/habits/HabitModal.jsx
import React, { useEffect, useState, useContext } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
} from "@nextui-org/react";
import { AppContext } from "../../context/AppContext";

export default function HabitModal({
  isOpen,
  onOpenChange,
  onSave,
  initialHabit,
  groups,
}) {
  const { habits } = useContext(AppContext);
  const [form, setForm] = useState({
    id: null,
    name: "",
    frequency: "täglich",
    times_per_day: 1,
    times_per_week: 1,
    times_per_month: 1,
    times_per_year: 1,
    group_id: null,
    linked_ids: [],
  });

  // 🧠 beim Öffnen: Werte aus bestehendem Habit übernehmen
  useEffect(() => {
    if (initialHabit) {
      setForm({
        id: initialHabit.id || null,
        name: initialHabit.name || "",
        frequency: initialHabit.frequency || "täglich",
        times_per_day: initialHabit.times_per_day || 1,
        times_per_week: initialHabit.times_per_week || 1,
        times_per_month: initialHabit.times_per_month || 1,
        times_per_year: initialHabit.times_per_year || 1,
        group_id: initialHabit.group_id || null,
        linked_ids: initialHabit.linked_ids || [],
      });
    } else {
      setForm({
        id: null,
        name: "",
        frequency: "täglich",
        times_per_day: 1,
        times_per_week: 1,
        times_per_month: 1,
        times_per_year: 1,
        group_id: null,
        linked_ids: [],
      });
    }
  }, [initialHabit]);

  const handleChange = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave(form);
    onOpenChange(false);
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>
              {form.id ? "Gewohnheit bearbeiten" : "Neue Gewohnheit"}
            </ModalHeader>
            <ModalBody>
              <Input
                label="Name"
                value={form.name}
                onValueChange={(v) => handleChange("name", v)}
                placeholder="z. B. Lesen, Joggen, Meditation …"
                autoFocus
              />

              <Select
                label="Häufigkeit"
                selectedKeys={[form.frequency]}
                onSelectionChange={(v) =>
                  handleChange("frequency", Array.from(v)[0])
                }
              >
                <SelectItem key="täglich">Täglich</SelectItem>
                <SelectItem key="pro_woche">Wöchentlich</SelectItem>
                <SelectItem key="pro_monat">Monatlich</SelectItem>
                <SelectItem key="pro_jahr">Jährlich</SelectItem>
              </Select>

              {/* 👇 dynamische Eingaben je nach Frequenz */}
              {form.frequency === "täglich" && (
                <Input
                  type="number"
                  label="Ziele pro Tag"
                  value={form.times_per_day}
                  onValueChange={(v) => handleChange("times_per_day", Number(v))}
                  min={1}
                  max={10}
                />
              )}

              {form.frequency === "pro_woche" && (
                <Input
                  type="number"
                  label="Ziele pro Woche"
                  value={form.times_per_week}
                  onValueChange={(v) =>
                    handleChange("times_per_week", Number(v))
                  }
                  min={1}
                  max={7}
                />
              )}

              {form.frequency === "pro_monat" && (
                <Input
                  type="number"
                  label="Ziele pro Monat"
                  value={form.times_per_month}
                  onValueChange={(v) =>
                    handleChange("times_per_month", Number(v))
                  }
                  min={1}
                  max={31}
                />
              )}

              {form.frequency === "pro_jahr" && (
                <Input
                  type="number"
                  label="Ziele pro Jahr"
                  value={form.times_per_year}
                  onValueChange={(v) =>
                    handleChange("times_per_year", Number(v))
                  }
                  min={1}
                  max={365}
                />
              )}

              <Select
                label="Typ"
                selectedKeys={[form.type ?? "good"]}
                onSelectionChange={(v) => handleChange("type", Array.from(v)[0])}
                >
                <SelectItem key="good">Gute Gewohnheit</SelectItem>
                <SelectItem key="bad">Schlechte Gewohnheit</SelectItem>
            </Select>

              <Select
                label="Gruppe"
                selectedKeys={[String(form.group_id ?? "null")]}
                onSelectionChange={(v) => {
                  const val = Array.from(v)[0];
                  handleChange("group_id", val === "null" ? null : Number(val));
                }}
              >
                {groups.map((g) => (
                  <SelectItem key={String(g.id ?? "null")}>{g.name}</SelectItem>
                ))}
              </Select>
              <Select
                label="Verknüpfte Habits"
                selectionMode="multiple"
                placeholder="Optional: wähle verwandte Gewohnheiten"
                selectedKeys={form.linked_ids.map(String)}
                onSelectionChange={(keys) =>
                    handleChange("linked_ids", Array.from(keys).map(Number))
                }
                >
                {habits
                    .filter((h) => h.id !== form.id) // sich selbst nicht anzeigen
                    .map((h) => (
                    <SelectItem key={String(h.id)}>{h.name}</SelectItem>
                    ))}
                </Select>
            </ModalBody>

            <ModalFooter>
              <Button color="default" variant="light" onPress={onClose}>
                Abbrechen
              </Button>
              <Button color="primary" onPress={handleSave}>
                Speichern
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}