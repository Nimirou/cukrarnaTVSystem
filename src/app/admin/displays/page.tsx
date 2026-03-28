"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Display {
  id: string;
  name: string;
  mode: string;
  interval: number;
  items: { id: string; media: { filename: string } }[];
}

export default function DisplaysPage() {
  const [displays, setDisplays] = useState<Display[]>([]);
  const [newName, setNewName] = useState("");

  const loadDisplays = () => {
    fetch("/api/displays")
      .then((r) => r.json())
      .then(setDisplays);
  };

  useEffect(() => {
    loadDisplays();
  }, []);

  const createDisplay = async () => {
    if (!newName.trim()) return;
    await fetch("/api/displays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    setNewName("");
    loadDisplays();
  };

  const deleteDisplay = async (id: string) => {
    if (!confirm("Opravdu smazat displej?")) return;
    await fetch(`/api/displays/${id}`, { method: "DELETE" });
    loadDisplays();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-zinc-900">Displeje</h1>

      {/* Create new */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Název nového displeje..."
          className="border rounded-md px-3 py-2 flex-1 max-w-xs text-zinc-900"
          onKeyDown={(e) => e.key === "Enter" && createDisplay()}
        />
        <button
          onClick={createDisplay}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Vytvořit
        </button>
      </div>

      {/* Display list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displays.map((d) => (
          <div
            key={d.id}
            className="bg-white rounded-lg shadow p-4 flex flex-col"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-semibold text-lg text-zinc-900">{d.name}</h2>
                <p className="text-sm text-zinc-900">
                  Režim: {d.mode}
                  {d.mode === "slideshow" && ` (${d.interval}s)`} | Položek:{" "}
                  {d.items.length}
                </p>
              </div>
              <button
                onClick={() => deleteDisplay(d.id)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Smazat
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <Link
                href={`/admin/displays/${d.id}`}
                className="text-sm bg-zinc-700 text-white hover:bg-zinc-800 px-3 py-1 rounded"
              >
                Upravit
              </Link>
              <a
                href={`/display/${d.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded"
              >
                Zobrazit
              </a>
            </div>
          </div>
        ))}
      </div>

      {displays.length === 0 && (
        <p className="text-zinc-900 mt-4">
          Žádné displeje. Vytvořte nový displej výše.
        </p>
      )}
    </div>
  );
}
