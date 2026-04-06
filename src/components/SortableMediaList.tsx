"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensors,
  useSensor,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

interface MediaItem {
  id: string;
  filename: string;
  path: string;
  mimeType: string;
}

interface SortableMediaListProps {
  mediaIds: string[];
  allMedia: MediaItem[];
  showUntilMap?: Record<string, string>;
  onReorder: (newIds: string[]) => void;
  onRemove: (mediaId: string) => void;
  onShowUntilChange?: (mediaId: string, value: string) => void;
  showTimeInputs: boolean;
}

function isVideo(mimeType: string) {
  return mimeType.startsWith("video/");
}

function MediaRow({
  media,
  index,
  total,
  showTimeInputs,
  showUntilValue,
  onShowUntilChange,
  onRemove,
  dragHandleProps,
  isDragging,
}: {
  media: MediaItem;
  index: number;
  total: number;
  showTimeInputs: boolean;
  showUntilValue?: string;
  onShowUntilChange?: (value: string) => void;
  onRemove: () => void;
  dragHandleProps?: Record<string, unknown>;
  isDragging?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 bg-zinc-50 rounded-md p-2 ${
        isDragging ? "shadow-lg ring-2 ring-blue-400 bg-white" : ""
      }`}
    >
      {/* Drag handle */}
      <button
        {...dragHandleProps}
        className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-600 px-0.5"
        title="Přetáhnout"
      >
        <svg className="w-4 h-5" viewBox="0 0 16 20" fill="currentColor">
          <circle cx="5" cy="4" r="1.5" />
          <circle cx="11" cy="4" r="1.5" />
          <circle cx="5" cy="10" r="1.5" />
          <circle cx="11" cy="10" r="1.5" />
          <circle cx="5" cy="16" r="1.5" />
          <circle cx="11" cy="16" r="1.5" />
        </svg>
      </button>
      <span className="text-xs text-zinc-900 w-5 text-center font-medium">{index + 1}</span>
      {isVideo(media.mimeType) ? (
        <div className="w-16 h-10 bg-zinc-900 rounded flex items-center justify-center text-white text-xs">
          Video
        </div>
      ) : (
        <img
          src={`/api/uploads/${media.path}`}
          alt={media.filename}
          className="w-16 h-10 object-cover rounded"
        />
      )}
      <span className="flex-1 text-sm truncate text-zinc-900">{media.filename}</span>
      {showTimeInputs && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-zinc-500">do:</span>
          {index < total - 1 ? (
            <input
              type="time"
              value={showUntilValue || ""}
              onChange={(e) => onShowUntilChange?.(e.target.value)}
              className="border rounded px-2 py-1 text-xs text-zinc-900 w-24"
            />
          ) : (
            <span className="text-xs text-zinc-500 italic">konce dne</span>
          )}
        </div>
      )}
      <button
        onClick={onRemove}
        className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
      >
        Odebrat
      </button>
    </div>
  );
}

function SortableItem({
  mediaId,
  media,
  index,
  total,
  showTimeInputs,
  showUntilValue,
  onShowUntilChange,
  onRemove,
}: {
  mediaId: string;
  media: MediaItem;
  index: number;
  total: number;
  showTimeInputs: boolean;
  showUntilValue?: string;
  onShowUntilChange?: (value: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: mediaId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <MediaRow
        media={media}
        index={index}
        total={total}
        showTimeInputs={showTimeInputs}
        showUntilValue={showUntilValue}
        onShowUntilChange={onShowUntilChange}
        onRemove={onRemove}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

export function SortableMediaList({
  mediaIds,
  allMedia,
  showUntilMap,
  onReorder,
  onRemove,
  onShowUntilChange,
  showTimeInputs,
}: SortableMediaListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = mediaIds.indexOf(active.id as string);
      const newIndex = mediaIds.indexOf(over.id as string);
      onReorder(arrayMove(mediaIds, oldIndex, newIndex));
    }
  };

  const activeMedia = activeId ? allMedia.find((m) => m.id === activeId) : null;
  const activeIndex = activeId ? mediaIds.indexOf(activeId) : -1;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={mediaIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {mediaIds.map((mediaId, index) => {
            const media = allMedia.find((m) => m.id === mediaId);
            if (!media) return null;
            return (
              <SortableItem
                key={mediaId}
                mediaId={mediaId}
                media={media}
                index={index}
                total={mediaIds.length}
                showTimeInputs={showTimeInputs}
                showUntilValue={showUntilMap?.[mediaId]}
                onShowUntilChange={
                  onShowUntilChange ? (val) => onShowUntilChange(mediaId, val) : undefined
                }
                onRemove={() => onRemove(mediaId)}
              />
            );
          })}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeMedia && (
          <MediaRow
            media={activeMedia}
            index={activeIndex}
            total={mediaIds.length}
            showTimeInputs={showTimeInputs}
            showUntilValue={showUntilMap?.[activeId!]}
            isDragging
            onRemove={() => {}}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
