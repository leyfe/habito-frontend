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
  Tabs,
  Tab,
  Card,
  CardBody,
} from "@nextui-org/react";
import { AppContext } from "../../context/AppContext";
import HabitCard from "./HabitCard";
import * as Icons from "lucide-react";

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
    description: "",
    frequency: "täglich",
    times_per_day: 1,
    times_per_week: 1,
    times_per_month: 1,
    times_per_year: 1,
    group_id: null,
    linked_ids: [],
    icon: "HeartPulse",
    type: "good",
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    if (initialHabit) setForm((f) => ({ ...f, ...initialHabit }));
  }, [initialHabit]);

  const handleChange = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => {
    const newHabit = { ...form };
    onSave(newHabit);

    // Rückwärtsverknüpfung
    for (const lid of newHabit.linked_ids) {
      const other = habits.find((h) => h.id === lid);
      if (other && !other.linked_ids.includes(newHabit.id)) {
        other.linked_ids = [...other.linked_ids, newHabit.id];
        onSave(other);
      }
    }
    onOpenChange(false);
  };

  const ALL_ICONS = { ...Icons };
  const ICON_OPTIONS = [
    { key: "Dumbbell", label: "Workout" },
    { key: "BookOpen", label: "Lesen" },
    { key: "Bike", label: "Radfahren" },
    { key: "Brain", label: "Meditation" },
    { key: "Droplets", label: "Trinken" },
    { key: "HeartPulse", label: "Gesundheit" },
    { key: "Apple", label: "Ernährung" },
    { key: "Moon", label: "Schlaf" },
  ];

  const IconComp = ALL_ICONS[form.icon] || Icons.HelpCircle;

  return (
    <Modal className="max-w-[90%] sm:max-w-screen-sm m-auto" isOpen={isOpen} onOpenChange={onOpenChange} size="lg" backdrop="blur" scrollBehavior="inside">
      <ModalContent className="">
        {(onClose) => (
          <>
            <ModalBody className=" rounded-2xl bg-slate-50 text-slate-600 space-y-6">
              <div className="flex flex-col">
                <span className="text-xl font-semibold mt-6 mb-2">{form.id ? "Gewohnheit bearbeiten" : "Neue Gewohnheit"}</span>
                <Tabs
                  color={form.type === "good" ? "success" : "danger"}
                  selectedKey={form.type}
                  onSelectionChange={(key) => handleChange("type", key)}
                  variant="underlined"
                  classNames={{
                    tabList: "w-full overflow-visible border-b border-slate-200 p-0",
                    tab: "h-10 z-40 data-[selected=true]:opacity-100 py-8 px-0 mb-[-1px]",
                    tabContent: [
                      "text-slate-600 text-xs",
                      "group-data-[hover=true]:!text-slate-200",
                      "group-data-[selected=true]:!text-slate-600",
                      "transition-colors font-medium"
                    ].join(" "),
                    cursor: `bg-slate-400 h-1 rounded`,
                    panel: "text-neutral-900 border border-neutral-200",
                  }}
                >
                  <Tab key="good" title="Gute Gewohnheit" />
                  <Tab key="bad" title="Schlechte Gewohnheit" />
                </Tabs>
              </div>
              {/* 🪪 Vorschau HabitCard */}
              <div className="mt-2">
                <HabitCard
                  habit={form}
                  activeDate={form.start_date ? new Date(form.start_date) : new Date()}
                  completions={{}}
                  increment={() => {}}
                  isPreview
                />
              </div>

              {/* 🎨 Erscheinungsbild */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-slate-600">
                  Erscheinungsbild
                </h4>

                <Input
                  label="Titel"
                  value={form.name}
                  onValueChange={(v) => handleChange("name", v)}
                  placeholder="z. B. Lesen, Joggen, Meditation …"
                  className="mt-2"
                  variant="default"
                  classNames={{
                    base: "data-[filled=true]:bg-slate-100 data-[focus=true]:bg-slate-100 bg-slate-100 rounded-xl",
                    inputWrapper: "border-1 border-slate-300 bg-slate-100 group-data-[focus=true]:bg-slate-200 hover:!bg-slate-200",
                    input: "text-slate-500 placeholder:text-slate-300",
                    label: "text-slate-500",
                  }}

                />
                <Select
                  label="Symbol"
                  selectedKeys={[form.icon]}
                  onSelectionChange={(v) =>
                    handleChange("icon", Array.from(v)[0])
                  }
                  classNames={{
                    base: "data-[filled=true]:bg-slate-100 data-[focus=true]:bg-slate-100 bg-slate-100 rounded-xl",
                    trigger: "border-1 border-slate-300 bg-slate-100 group-data-[focus=true]:bg-slate-200 hover:!bg-slate-200",
                    value: "text-slate-500",
                    label: "text-slate-500",
                    listboxWrapper: "bg-slate-50",
                    popoverContent: "bg-slate-50",
                  }}
                >
                  {ICON_OPTIONS.map((opt) => {
                    const Ico = ALL_ICONS[opt.key];
                    return (
                      <SelectItem
                        key={opt.key}
                        startContent={<Ico size={18} />}
                      >
                        {opt.label}
                      </SelectItem>
                    );
                  })}
                </Select>

                <Input
                  label="Beschreibung"
                  placeholder="Kurzbeschreibung (optional)"
                  value={form.description}
                  onValueChange={(v) => handleChange("description", v)}
                  classNames={{
                    base: "data-[filled=true]:bg-slate-100 data-[focus=true]:bg-slate-100 bg-slate-100 rounded-xl",
                    inputWrapper: "border-1 border-slate-300 bg-slate-100 group-data-[focus=true]:bg-slate-200 hover:!bg-slate-200",
                    input: "text-slate-500 placeholder:text-slate-300",
                    label: "text-slate-500",
                  }}
                />
              </div>

              {/* ⚙️ Allgemein */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-slate-600">
                  Allgemein
                </h4>

                <Select
                  label="Gruppe"
                  selectedKeys={[String(form.group_id ?? "null")]}
                  onSelectionChange={(v) => {
                    const val = Array.from(v)[0];
                    handleChange(
                      "group_id",
                      val === "null" ? null : Number(val)
                    );
                  }}
                  classNames={{
                    base: "data-[filled=true]:bg-slate-100 data-[focus=true]:bg-slate-100 bg-slate-100 rounded-xl",
                    trigger: "border-1 border-slate-300 bg-slate-100 group-data-[focus=true]:bg-slate-200 hover:!bg-slate-200",
                    value: "text-slate-500",
                    label: "text-slate-500",
                    listboxWrapper: "bg-slate-50",
                    popoverContent: "bg-slate-50",
                  }}
                >
                  {groups.map((g) => (
                    <SelectItem key={String(g.id)}>{g.name}</SelectItem>
                  ))}
                </Select>

                <Select
                  label="Wiederholung"
                  selectedKeys={[form.frequency]}
                  onSelectionChange={(v) =>
                    handleChange("frequency", Array.from(v)[0])
                  }
                  classNames={{
                    base: "data-[filled=true]:bg-slate-100 data-[focus=true]:bg-slate-100 bg-slate-100 rounded-xl",
                    trigger: "border-1 border-slate-300 bg-slate-100 group-data-[focus=true]:bg-slate-200 hover:!bg-slate-200",
                    value: "text-slate-500",
                    label: "text-slate-500",
                    listboxWrapper: "bg-slate-50",
                    popoverContent: "bg-slate-50",
                  }}
                >
                  <SelectItem key="täglich">Täglich</SelectItem>
                  <SelectItem key="pro_woche">Wöchentlich</SelectItem>
                  <SelectItem key="pro_monat">Monatlich</SelectItem>
                  <SelectItem key="pro_jahr">Jährlich</SelectItem>
                </Select>

                {form.frequency !== "täglich" && (
                  <Input
                    type="number"
                    label={`Ziele ${form.frequency.replace("pro_", "pro ")}`}
                    value={
                      form.frequency === "pro_woche"
                        ? form.times_per_week
                        : form.frequency === "pro_monat"
                        ? form.times_per_month
                        : form.times_per_year
                    }
                    onValueChange={(v) =>
                      handleChange(
                        form.frequency === "pro_woche"
                          ? "times_per_week"
                          : form.frequency === "pro_monat"
                          ? "times_per_month"
                          : "times_per_year",
                        Number(v)
                      )
                    }
                    min={1}
                    classNames={{
                      base: "data-[filled=true]:bg-slate-100 data-[focus=true]:bg-slate-100 bg-slate-100 rounded-xl",
                      inputWrapper: "border-1 border-slate-300 bg-slate-100 group-data-[focus=true]:bg-slate-200 hover:!bg-slate-200",
                      input: "text-slate-500 placeholder:text-slate-300",
                      label: "text-slate-500",
                    }}
                  />
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="date"
                    label="Beginnt am"
                    value={form.start_date}
                    onValueChange={(v) => handleChange("start_date", v)}
                    classNames={{
                      base: "data-[filled=true]:bg-slate-100 data-[focus=true]:bg-slate-100 bg-slate-100 rounded-xl",
                      inputWrapper: "border-1 border-slate-300 bg-slate-100 group-data-[focus=true]:bg-slate-200 hover:!bg-slate-200",
                      input: "text-slate-500 placeholder:text-slate-300",
                      label: "text-slate-500",
                    }}
                  />
                  <Input
                    type="date"
                    label="Endet am"
                    value={form.end_date}
                    onValueChange={(v) => handleChange("end_date", v)}
                    classNames={{
                      base: "data-[filled=true]:bg-slate-100 data-[focus=true]:bg-slate-100 bg-slate-100 rounded-xl",
                      inputWrapper: "border-1 border-slate-300 bg-slate-100 group-data-[focus=true]:bg-slate-200 hover:!bg-slate-200",
                      input: "text-slate-500 placeholder:text-slate-300",
                      label: "text-slate-500",
                    }}
                  />
                </div>
              </div>
            </ModalBody>

            <ModalFooter className="bg-slate-50 rounded-2xl">
              <Button variant="light" onPress={onClose}>
                Abbrechen
              </Button>
              <Button className="bg-slate-500" color="primary" onPress={handleSave}>
                Speichern
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
} 