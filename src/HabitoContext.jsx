import React, { createContext, useContext, useState, useEffect } from "react";
import { lsGet, lsSet } from "./components"; // oder wo deine utils liegen

const HabitoContext = createContext();

export function HabitoProvider({ children }) {
  const [groups, setGroups] = useState(lsGet("habito.groups", []));
  const [habits, setHabits] = useState(lsGet("habito.habits", []));

  // 🧠 LocalStorage Sync
  useEffect(() => { lsSet("habito.groups", groups); }, [groups]);
  useEffect(() => { lsSet("habito.habits", habits); }, [habits]);

  return (
    <HabitoContext.Provider value={{ groups, setGroups, habits, setHabits }}>
      {children}
    </HabitoContext.Provider>
  );
}

export function useHabito() {
  return useContext(HabitoContext);
}