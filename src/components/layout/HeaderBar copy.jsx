// src/components/layout/BottomNav.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { BarChart2, Settings, Plus, CirclePlus, ListChecks } from "lucide-react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from "@nextui-org/react";
import clsx from "clsx";

export default function BottomNav({ onNewHabit, onNewTodo }) {
  const navItems = [
    {
      to: "/habit",
      label: "Habit's",
      space: "pr-5 sm:pr-6",
    },
    {
      to: "/todo",
      label: "Todo's",
      space: "pl-5 sm:pl-6",
    },
  ];

  return (
    <nav className="sticky top-0 pt-12 left-0 right-0 flex justify-around py-3 z-50">
      {navItems.map(({ to, label, space }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `${space} flex flex-col items-center gap-1 transition-colors ${
              isActive
                ? `text-slate-500`
                : "text-slate-500 hover:text-slate-500"
            }`
          }
        >
          {label}
        </NavLink>
      ))}

      {/* 🟣 Floating Add Dropdown */}
      <Dropdown placement="top-center">
        <DropdownTrigger>
          <Button
            isIconOnly
            variant="flat"
            size="lg"
            className={clsx(
              "bg-slate-100/0 absolute top-2  rounded-full",
            )}
          >
            <Plus className="text-slate-500" size={22} />
          </Button>
        </DropdownTrigger>

        <DropdownMenu
          aria-label="Neu hinzufügen Menü"
          variant="faded"
          className="min-w-[160px]"
        >
          <DropdownItem
            key="new-habit"
            startContent={<CirclePlus size={16} />}
            onPress={onNewHabit}
          >
            Neue Gewohnheit
          </DropdownItem>
          <DropdownItem
            key="new-todo"
            startContent={<ListChecks size={16} />}
            onPress={onNewTodo}
          >
            Neues To-do
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </nav>
  );
}