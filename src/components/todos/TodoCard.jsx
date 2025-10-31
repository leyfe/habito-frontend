// src/components/todos/TodoCard.jsx
import React from "react";
import { Card, Checkbox, Button, Tooltip } from "@nextui-org/react";
import { Edit3, Trash2 } from "lucide-react";

export default function TodoCard({ todo, toggleTodo, onEdit, onDelete }) {
  return (
    <Card
      className={`flex flex-row items-center justify-between px-4 py-3 border rounded-xl transition-all ${
        todo.done
          ? "bg-slate-200/80 border-slate-300 text-emerald-800 opacity-70"
          : "bg-slate-200/80 border-slate-300 text-slate-700"
      }`}
    >
      <div className="flex items-center gap-3 flex-1">
        <Checkbox
          isSelected={todo.done}
          color="light"
          onChange={() => toggleTodo(todo)}
            classNames={{
                wrapper: "bg-slate-400", // Rand
                icon: "text-white", // Häkchenfarbe
            }}
        />
        <div className="flex flex-col text-left">
          <span
            className={`text-sm font-medium ${
              todo.done ? "line-through text-slate-500" : ""
            }`}
          >
            {todo.name}
          </span>
          {todo.due_date && (
            <span className="text-xs text-slate-500">
              Fällig: {new Date(todo.due_date).toLocaleDateString("de-DE")}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 ml-3">
        {onEdit && (
          <Tooltip content="Bearbeiten">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="default"
              onPress={() => onEdit(todo)}
            >
              <Edit3 className="text-slate-500" size={16} />
            </Button>
          </Tooltip>
        )}

        {onDelete && (
          <Tooltip content="Löschen">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={() => onDelete(todo)} // ✅ todo, nicht id
            >
              <Trash2 className="text-slate-500" size={16} />
            </Button>
          </Tooltip>
        )}
      </div>
    </Card>
  );
}