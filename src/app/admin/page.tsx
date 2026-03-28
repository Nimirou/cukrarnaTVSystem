"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Media {
  id: string;
  filename: string;
  mimeType: string;
  path: string;
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
  updatedAt: string;
  items: DisplayItem[];
}

const modeLabels: Record<string, string> = {
  single: "Jeden obrázek",
  video: "Video",
  slideshow: "Slideshow",
};

export default function AdminDashboard() {
  const [displays, setDisplays] = useState<Display[]>([]);
  const [mediaCount, setMediaCount] = useState(0);

  useEffect(() => {
    fetch("/api/displays")
      .then((r) => r.json())
      .then(setDisplays);
    fetch("/api/media")
      .then((r) => r.json())
      .then((m: Media[]) => setMediaCount(m.length));
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
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm font-medium text-zinc-900">Displeje</p>
          <p className="text-3xl font-bold mt-1 text-zinc-900">{displays.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm font-medium text-zinc-900">Nahraná média</p>
          <p className="text-3xl font-bold mt-1 text-zinc-900">{mediaCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm font-medium text-zinc-900">Přiřazený obsah celkem</p>
          <p className="text-3xl font-bold mt-1 text-zinc-900">{totalItems}</p>
        </div>
      </div>

      {/* Displays */}
      <h2 className="text-lg font-semibold mb-4">Televize</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displays.map((d) => {
          const firstImage = d.items.find((i) =>
            i.media.mimeType.startsWith("image/")
          );
          const hasContent = d.items.length > 0;

          return (
            <div
              key={d.id}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              {/* Preview */}
              <div className="aspect-video bg-zinc-900 relative">
                {firstImage ? (
                  <img
                    src={`/api/uploads/${firstImage.media.path}`}
                    alt={firstImage.media.filename}
                    className="w-full h-full object-cover"
                  />
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
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-lg">{d.name}</h3>
                <div className="mt-2 space-y-1 text-sm text-zinc-900">
                  <p>
                    Režim: <span className="text-zinc-700">{modeLabels[d.mode] || d.mode}</span>
                  </p>
                  <p>
                    Položek: <span className="text-zinc-700">{d.items.length}</span>
                  </p>
                  {d.mode === "slideshow" && (
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
