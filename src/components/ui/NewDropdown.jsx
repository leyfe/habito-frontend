// src/components/ui/NewDropdown.jsx
import React from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from "@nextui-org/react";
import { Plus, ListChecks, CirclePlus } from "lucide-react";

export default function NewDropdown({ onNewHabit, onNewTodo }) {
  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <Button
          isIconOnly
          radius="full"
          color="primary"
          variant="solid"
          className="bg-slate-500"
          aria-label="Neu hinzufügen"
        >
          <Plus size={18} />
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
  );
}