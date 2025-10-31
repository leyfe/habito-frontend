import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import TodoCard from "./TodoCard";

export default function TodoGroup({
  groupName = "To-Dos",
  list = [],
  toggleTodo,
  onEditRequest,
  onDeleteRequest,
}) {
  const [collapsed, setCollapsed] = useState(false);

  if (!Array.isArray(list) || list.length === 0) return null;

  const doneCount = list.filter((t) => t.done).length;
  const total = list.length;
  const pct = Math.round((doneCount / total) * 100);

  return (
    <div className="mb-3">
      <div
        className="px-4 py-3 flex items-center justify-between cursor-pointer rounded-2xl transition"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          {collapsed ? (
            <ChevronRight size={18} className="text-slate-300/70" />
          ) : (
            <ChevronDown size={18} className="text-slate-300/70" />
          )}
        
          <span className="font-semibold text-sm text-slate-300">{groupName}</span>

        
        </div>
        <div className="flex items-center gap-2 w-[40%]">
          <div className="h-2 flex-1 bg-slate-300/50 rounded-full overflow-hidden">
            <div
              className="h-2 bg-slate-200 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-slate-300">{pct}%</span>
        </div>
      </div>

      {!collapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
          {list.map((todo) => (
            <TodoCard
              key={todo.id}
              todo={todo}
              toggleTodo={toggleTodo}
              onEdit={onEditRequest}
              onDelete={onDeleteRequest}
            />
          ))}
        </div>
      )}
    </div>
  );
}