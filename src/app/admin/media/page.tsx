"use client";

import { useEffect, useState, useRef } from "react";

interface Media {
  id: string;
  filename: string;
  path: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export default function MediaPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMedia = () => {
    fetch("/api/media")
      .then((r) => r.json())
      .then(setMedia);
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const uploadFiles = async (files: FileList | File[]) => {
    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      await fetch("/api/media", { method: "POST", body: formData });
    }
    setUploading(false);
    loadMedia();
  };

  const deleteMedia = async (id: string) => {
    if (!confirm("Opravdu smazat?")) return;
    await fetch(`/api/media/${id}`, { method: "DELETE" });
    loadMedia();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  const isVideo = (mimeType: string) => mimeType.startsWith("video/");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Média</h1>

      {/* Upload zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 cursor-pointer transition-colors ${
          dragOver
            ? "border-blue-500 bg-blue-50"
            : "border-zinc-300 hover:border-zinc-400"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
        {uploading ? (
          <p className="text-zinc-900">Nahrávám...</p>
        ) : (
          <p className="text-zinc-900">
            Přetáhněte soubory sem nebo klikněte pro výběr
          </p>
        )}
      </div>

      {/* Media grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {media.map((m) => (
          <div
            key={m.id}
            className="bg-white rounded-lg shadow overflow-hidden group relative"
          >
            {isVideo(m.mimeType) ? (
              <div className="aspect-video bg-zinc-900 flex items-center justify-center">
                <video
                  src={`/api/uploads/${m.path}`}
                  className="w-full h-full object-cover"
                  muted
                  preload="metadata"
                />
              </div>
            ) : (
              <div className="aspect-video bg-zinc-100">
                <img
                  src={`/api/uploads/${m.path}`}
                  alt={m.filename}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-2">
              <p className="text-xs text-zinc-900 truncate" title={m.filename}>
                {m.filename}
              </p>
              <p className="text-xs text-zinc-700">
                {(m.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
            <button
              onClick={() => deleteMedia(m.id)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              X
            </button>
          </div>
        ))}
      </div>

      {media.length === 0 && !uploading && (
        <p className="text-zinc-900 text-center mt-8">
          Žádná média. Nahrajte obrázky nebo videa.
        </p>
      )}
    </div>
  );
}
