"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getActiveItem } from "@/lib/schedule";

interface Media {
  id: string;
  filename: string;
  mimeType: string;
  path: string;
}

interface DisplayItem {
  id: string;
  order: number;
  showUntil: string | null;
  scheduleDate: string | null;
  media: Media;
}

interface Display {
  id: string;
  name: string;
  mode: string;
  interval: number;
  scheduleMode: string;
  updatedAt: string;
  items: DisplayItem[];
}

const modeLabels: Record<string, string> = {
  single: "Jeden obrázek",
  video: "Video",
  slideshow: "Slideshow",
};

function getNowPlaying(display: Display, now: Date): DisplayItem | null {
  if (display.items.length === 0) return null;

  if (display.scheduleMode === "none") {
    return display.items[0] || null;
  }

  const scheduleItems = display.items.map((item) => ({
    order: item.order,
    showUntil: item.showUntil,
    scheduleDate: item.scheduleDate,
  }));

  const { activeIndex } = getActiveItem(
    scheduleItems,
    display.scheduleMode as "daily" | "date",
    now
  );

  if (activeIndex >= 0 && activeIndex < display.items.length) {
    return display.items[activeIndex];
  }

  return null;
}

export default function AdminDashboard() {
  const [displays, setDisplays] = useState<Display[]>([]);
  const [mediaCount, setMediaCount] = useState(0);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    fetch("/api/displays")
      .then((r) => r.json())
      .then(setDisplays);
    fetch("/api/media")
      .then((r) => r.json())
      .then((m: Media[]) => setMediaCount(m.length));
  }, []);

  // Auto-refresh now-playing every 60s
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const totalItems = displays.reduce((sum, d) => sum + d.items.length, 0);

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Přehledová obrazovka</h1>
        <p className="text-zinc-900 text-sm mt-1">
          Přehled všech displejů a obsahu
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/admin/displays" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-zinc-900">Displeje</p>
          <p className="text-3xl font-bold mt-1 text-zinc-900">{displays.length}</p>
        </Link>
        <Link href="/admin/media" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-zinc-900">Nahraná média</p>
          <p className="text-3xl font-bold mt-1 text-zinc-900">{mediaCount}</p>
        </Link>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm font-medium text-zinc-900">Přiřazený obsah celkem</p>
          <p className="text-3xl font-bold mt-1 text-zinc-900">{totalItems}</p>
        </div>
      </div>

      {/* Displays */}
      <h2 className="text-lg font-semibold mb-4">Televize</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displays.map((d) => {
          const nowPlaying = getNowPlaying(d, now);
          const hasContent = d.items.length > 0;
          const isImage = nowPlaying?.media.mimeType.startsWith("image/");

          return (
            <div
              key={d.id}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              {/* Preview */}
              <div className="aspect-video bg-zinc-900 relative">
                {nowPlaying && isImage ? (
                  <img
                    src={`/api/uploads/${nowPlaying.media.path}`}
                    alt={nowPlaying.media.filename}
                    className="w-full h-full object-cover"
                  />
                ) : nowPlaying ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-white text-sm">Video</p>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-white text-sm">Žádný náhled</p>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      hasContent
                        ? "bg-green-100 text-green-700"
                        : "bg-zinc-200 text-zinc-900"
                    }`}
                  >
                    {hasContent ? "Aktivní" : "Prázdný"}
                  </span>
                </div>
                {/* Now playing overlay */}
                {nowPlaying && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-1.5 flex items-center gap-2">
                    <span className="text-green-400 text-xs">&#9654;</span>
                    <span className="text-white text-xs truncate">
                      {d.scheduleMode !== "none"
                        ? `Právě hraje: ${nowPlaying.media.filename}`
                        : d.mode === "slideshow"
                          ? `Slideshow (${d.items.length} položek)`
                          : nowPlaying.media.filename}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-lg">{d.name}</h3>
                <div className="mt-2 space-y-1 text-sm text-zinc-900">
                  <p>
                    Režim: <span className="text-zinc-700">
                      {d.scheduleMode !== "none"
                        ? d.scheduleMode === "daily" ? "Denní plánování" : "Kalendář"
                        : modeLabels[d.mode] || d.mode}
                    </span>
                  </p>
                  <p>
                    Položek: <span className="text-zinc-700">{d.items.length}</span>
                  </p>
                  {d.mode === "slideshow" && d.scheduleMode === "none" && (
                    <p>
                      Interval: <span className="text-zinc-700">{d.interval}s</span>
                    </p>
                  )}
                  <p>
                    Aktualizováno:{" "}
                    <span className="text-zinc-700">
                      {new Date(d.updatedAt).toLocaleString("cs-CZ")}
                    </span>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <Link
                    href={`/admin/displays/${d.id}`}
                    className="flex-1 text-center bg-blue-600 text-white text-sm px-3 py-2 rounded-md hover:bg-blue-700"
                  >
                    Upravit
                  </Link>
                  <a
                    href={`/display/${d.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center bg-zinc-100 text-zinc-700 text-sm px-3 py-2 rounded-md hover:bg-zinc-200"
                  >
                    Zobrazit na TV
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {displays.length === 0 && (
        <p className="text-zinc-900 mt-4">
          Žádné displeje. Vytvořte je v sekci{" "}
          <Link href="/admin/displays" className="text-blue-600 underline">
            Displeje
          </Link>
          .
        </p>
      )}
    </div>
  );
}
