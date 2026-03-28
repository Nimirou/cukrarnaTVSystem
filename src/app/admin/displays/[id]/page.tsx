"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

interface Media {
  id: string;
  filename: string;
  path: string;
  mimeType: string;
}

interface DisplayItem {
  id: string;
  order: number;
  media: Media;
}

interface Display {
  id: string;
  name: string;
  mode: string;
  interval: number;
  items: DisplayItem[];
}

export default function DisplayEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [display, setDisplay] = useState<Display | null>(null);
  const [allMedia, setAllMedia] = useState<Media[]>([]);
  const [name, setName] = useState("");
  const [mode, setMode] = useState("single");
  const [interval, setInterval] = useState(5);
  const [assignedMedia, setAssignedMedia] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/displays/${id}`)
      .then((r) => r.json())
      .then((d: Display) => {
        setDisplay(d);
        setName(d.name);
        setMode(d.mode);
        setInterval(d.interval);
        setAssignedMedia(d.items.map((i) => i.media.id));
      });
    fetch("/api/media")
      .then((r) => r.json())
      .then(setAllMedia);
  }, [id]);

  const save = async () => {
    setSaving(true);
    await fetch(`/api/displays/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        mode,
        interval,
        items: assignedMedia.map((mediaId, i) => ({
          mediaId,
          order: i,
        })),
      }),
    });
    setSaving(false);
    // Reload
    const d = await fetch(`/api/displays/${id}`).then((r) => r.json());
    setDisplay(d);
  };

  const toggleMedia = (mediaId: string) => {
    setAssignedMedia((prev) =>
      prev.includes(mediaId)
        ? prev.filter((id) => id !== mediaId)
        : [...prev, mediaId]
    );
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setAssignedMedia((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveDown = (index: number) => {
    setAssignedMedia((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  if (!display) {
    return <div className="p-6">Načítám...</div>;
  }

  const isVideo = (mimeType: string) => mimeType.startsWith("video/");

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/admin/displays" className="text-blue-600 hover:underline">
          Displeje
        </Link>
        <span className="text-zinc-400">/</span>
        <h1 className="text-2xl font-bold text-zinc-900">{display.name}</h1>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-1">
              Název
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border rounded-md px-3 py-2 w-full text-zinc-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-1">
              Režim
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="border rounded-md px-3 py-2 w-full text-zinc-900"
            >
              <option value="single">Jeden obrázek</option>
              <option value="video">Video</option>
              <option value="slideshow">Slideshow</option>
            </select>
          </div>
          {mode === "slideshow" && (
            <div>
              <label className="block text-sm font-medium text-zinc-900 mb-1">
                Interval (s)
              </label>
              <input
                type="number"
                min={1}
                max={120}
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
                className="border rounded-md px-3 py-2 w-full text-zinc-900"
              />
            </div>
          )}
        </div>
      </div>

      {/* Assigned media */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="font-semibold mb-3 text-zinc-900">
          Přiřazená média ({assignedMedia.length})
        </h2>
        {assignedMedia.length === 0 ? (
          <p className="text-zinc-500 text-sm">
            Žádná média. Vyberte z dostupných níže.
          </p>
        ) : (
          <div className="space-y-2">
            {assignedMedia.map((mediaId, index) => {
              const m = allMedia.find((m) => m.id === mediaId);
              if (!m) return null;
              return (
                <div
                  key={mediaId}
                  className="flex items-center gap-3 bg-zinc-50 rounded-md p-2"
                >
                  <span className="text-xs text-zinc-900 w-6 text-center font-medium">
                    {index + 1}
                  </span>
                  {isVideo(m.mimeType) ? (
                    <div className="w-16 h-10 bg-zinc-900 rounded flex items-center justify-center text-white text-xs">
                      Video
                    </div>
                  ) : (
                    <img
                      src={`/api/uploads/${m.path}`}
                      alt={m.filename}
                      className="w-16 h-10 object-cover rounded"
                    />
                  )}
                  <span className="flex-1 text-sm truncate text-zinc-900">{m.filename}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveUp(index)}
                      className="text-xs px-2 py-1 bg-zinc-700 text-white rounded hover:bg-zinc-800"
                    >
                      Nahoru
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      className="text-xs px-2 py-1 bg-zinc-700 text-white rounded hover:bg-zinc-800"
                    >
                      Dolů
                    </button>
                    <button
                      onClick={() => toggleMedia(mediaId)}
                      className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                    >
                      Odebrat
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Available media */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="font-semibold mb-3 text-zinc-900">Dostupná média</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {allMedia.map((m) => {
            const isAssigned = assignedMedia.includes(m.id);
            return (
              <div
                key={m.id}
                onClick={() => toggleMedia(m.id)}
                className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-colors ${
                  isAssigned
                    ? "border-blue-500 ring-2 ring-blue-200"
                    : "border-transparent hover:border-zinc-300"
                }`}
              >
                {isVideo(m.mimeType) ? (
                  <div className="aspect-video bg-zinc-900 flex items-center justify-center text-white text-xs">
                    Video
                  </div>
                ) : (
                  <img
                    src={`/api/uploads/${m.path}`}
                    alt={m.filename}
                    className="aspect-video object-cover"
                  />
                )}
                <p className="text-xs p-1 truncate text-zinc-900">{m.filename}</p>
              </div>
            );
          })}
        </div>
        {allMedia.length === 0 && (
          <p className="text-zinc-500 text-sm">
            Žádná média.{" "}
            <Link href="/admin/media" className="text-blue-600 underline">
              Nahrajte je
            </Link>
            .
          </p>
        )}
      </div>

      {/* Save */}
      <div className="flex gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Ukládám..." : "Uložit"}
        </button>
        <a
          href={`/display/${id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
        >
          Zobrazit na TV
        </a>
      </div>
    </div>
  );
}
