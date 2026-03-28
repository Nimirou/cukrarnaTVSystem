"use client";

import { useEffect, useState, useRef } from "react";

interface Tag {
  id: string;
  name: string;
}

interface MediaTag {
  id: string;
  tag: Tag;
}

interface Media {
  id: string;
  filename: string;
  path: string;
  mimeType: string;
  size: number;
  createdAt: string;
  tags: MediaTag[];
}

export default function MediaPage() {
  const [media, setMedia] = useState<Media[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMedia = () => {
    fetch("/api/media")
      .then((r) => r.json())
      .then(setMedia);
  };

  const loadTags = () => {
    fetch("/api/tags")
      .then((r) => r.json())
      .then(setTags);
  };

  useEffect(() => {
    loadMedia();
    loadTags();
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

  const createTag = async () => {
    const name = newTagName.trim();
    if (!name) return;
    await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setNewTagName("");
    loadTags();
  };

  const deleteTag = async (id: string) => {
    if (!confirm("Opravdu smazat tag?")) return;
    await fetch(`/api/tags/${id}`, { method: "DELETE" });
    if (filterTag === id) setFilterTag(null);
    loadTags();
    loadMedia();
  };

  const toggleMediaTag = async (mediaId: string, tagId: string) => {
    const m = media.find((m) => m.id === mediaId);
    if (!m) return;
    const currentTagIds = m.tags.map((t) => t.tag.id);
    const newTagIds = currentTagIds.includes(tagId)
      ? currentTagIds.filter((id) => id !== tagId)
      : [...currentTagIds, tagId];

    await fetch(`/api/media/${mediaId}/tags`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagIds: newTagIds }),
    });
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

  const filteredMedia = filterTag
    ? media.filter((m) => m.tags.some((t) => t.tag.id === filterTag))
    : media;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-zinc-900">Média</h1>

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

      {/* Tags management */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="font-semibold mb-3 text-zinc-900">Tagy</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => setFilterTag(null)}
            className={`text-sm px-3 py-1 rounded-full border transition-colors ${
              filterTag === null
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-zinc-900 border-zinc-300 hover:border-zinc-400"
            }`}
          >
            Vše ({media.length})
          </button>
          {tags.map((tag) => {
            const count = media.filter((m) =>
              m.tags.some((t) => t.tag.id === tag.id)
            ).length;
            return (
              <div key={tag.id} className="flex items-center gap-0.5">
                <button
                  onClick={() =>
                    setFilterTag(filterTag === tag.id ? null : tag.id)
                  }
                  className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                    filterTag === tag.id
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-zinc-900 border-zinc-300 hover:border-zinc-400"
                  }`}
                >
                  {tag.name} ({count})
                </button>
                <button
                  onClick={() => deleteTag(tag.id)}
                  className="text-red-500 hover:text-red-700 text-xs px-1"
                  title="Smazat tag"
                >
                  x
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createTag()}
            placeholder="Nový tag..."
            className="border rounded-md px-3 py-1.5 text-sm text-zinc-900 flex-1 max-w-xs"
          />
          <button
            onClick={createTag}
            className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-md hover:bg-blue-700"
          >
            Přidat tag
          </button>
        </div>
      </div>

      {/* Media grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredMedia.map((m) => (
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
              {/* Tags */}
              <div className="flex flex-wrap gap-1 mt-1">
                {m.tags.map((t) => (
                  <span
                    key={t.tag.id}
                    className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full"
                  >
                    {t.tag.name}
                  </span>
                ))}
              </div>
              {/* Tag edit button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingMediaId(editingMediaId === m.id ? null : m.id);
                }}
                className="text-[10px] text-blue-600 hover:underline mt-1"
              >
                {editingMediaId === m.id ? "Zavřít" : "Tagy"}
              </button>
              {/* Tag selector */}
              {editingMediaId === m.id && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {tags.map((tag) => {
                    const hasTag = m.tags.some((t) => t.tag.id === tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => toggleMediaTag(m.id, tag.id)}
                        className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-colors ${
                          hasTag
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-zinc-900 border-zinc-300"
                        }`}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              )}
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

      {filteredMedia.length === 0 && !uploading && (
        <p className="text-zinc-900 text-center mt-8">
          {filterTag
            ? "Žádná média s tímto tagem."
            : "Žádná média. Nahrajte obrázky nebo videa."}
        </p>
      )}
    </div>
  );
}
