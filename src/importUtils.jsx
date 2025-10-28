// importUtils.jsx
export async function handleImportFile(file, { habits, groups, setHabits, setGroups }) {
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data.habits) throw new Error("Ungültige Datei: kein 'habits'-Array gefunden");

    // Datumsstring → ISO
    const parseDate = (str) => {
      if (!str) return null;
      try {
        const cleaned = str
          .replace(" um ", "T")
          .replace(" MESZ", "+02:00")
          .replace(" MEZ", "+01:00");
        return new Date(cleaned).toISOString();
      } catch {
        return null;
      }
    };

    // goal -> Frequenztext
    const toWeeklyGoal = (goal) => (goal === 1 ? "täglich" : `${goal}× pro Woche`);

    // 1️⃣ Gruppen mergen (keine Duplikate)
    const importedGroups = [
      ...new Set(data.habits.map((h) => h.group).filter(Boolean)),
    ];
    const mergedGroups = Array.from(new Set([...groups, ...importedGroups]));

    // 2️⃣ Habits mergen / hinzufügen
    const mergedHabits = [...habits];

    data.habits.forEach((imp) => {
      const existingIndex = mergedHabits.findIndex(
        (h) => h.name === imp.name && h.group === imp.group
      );

      const importedLogs = (imp.logs || [])
        .map((l) => ({
          value: l.value ?? 1,
          date: parseDate(l.date),
        }))
        .filter((l) => l.date);

      if (existingIndex >= 0) {
        // Bestehenden Habit updaten (Logs zusammenführen)
        const existing = mergedHabits[existingIndex];
        const allLogs = [...(existing.logs || []), ...importedLogs];

        // doppelte Logs raus (nach Datum)
        const uniqueLogs = [
          ...new Map(allLogs.map((l) => [l.date, l])).values(),
        ];

        mergedHabits[existingIndex] = {
          ...existing,
          logs: uniqueLogs,
          goal: imp.goal ?? existing.goal,
          frequency: toWeeklyGoal(imp.goal ?? existing.goal),
        };
      } else {
        // Neuen Habit hinzufügen
        mergedHabits.push({
          ...imp,
          id: crypto.randomUUID(),
          logs: importedLogs,
          frequency: toWeeklyGoal(imp.goal),
        });
      }
    });

    // 3️⃣ States + localStorage aktualisieren
    setGroups(mergedGroups);
    setHabits(mergedHabits);

    localStorage.setItem("habito.groups", JSON.stringify(mergedGroups));
    localStorage.setItem("habito.habits", JSON.stringify(mergedHabits));

    alert("✅ Import erfolgreich abgeschlossen!");
  } catch (err) {
    console.error("❌ Fehler beim Import:", err);
    alert("❌ Fehler beim Import: " + err.message);
  }
}