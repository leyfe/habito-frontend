// src/utils/habitLinks.js

import { periodCount, limitFor } from "./habitUtils";

// IDs immer als String
export function idOf(habit) {
  return String(habit?.id);
}

export function linksOf(habit) {
  return Array.isArray(habit?.linked_ids) ? habit.linked_ids.map(String) : [];
}

// Bidirektionale Verknüpfung (vorwärts + rückwärts)
export function getLinkedGroup(habit, allHabits) {
  const map = new Map(allHabits.map((h) => [idOf(h), h]));
  const startId = idOf(habit);
  const visited = new Set();
  const stack = [startId];

  while (stack.length) {
    const curId = stack.pop();
    if (visited.has(curId)) continue;
    visited.add(curId);

    const h = map.get(curId);
    if (!h) continue;

    for (const lid of linksOf(h)) if (!visited.has(lid)) stack.push(lid);
    for (const other of allHabits) {
      if (linksOf(other).includes(curId) && !visited.has(idOf(other))) {
        stack.push(idOf(other));
      }
    }
  }

  return Array.from(visited);
}

export function isAnyOfGroupDone(groupIds, allHabits, activeDate, completions) {
  for (const id of groupIds) {
    const h = allHabits.find((x) => x.id === id);
    if (!h) continue;
    const cnt = periodCount(h, activeDate, completions);
    const lim = limitFor(h);
    if (cnt >= lim) return true;
  }
  return false;
}