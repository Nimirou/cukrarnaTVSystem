"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { SortableMediaList } from "@/components/SortableMediaList";
import { DisplayPreview } from "./DisplayPreview";

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
  tags: MediaTag[];
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
  items: DisplayItem[];
}

// Per-day schedule: ordered list of media with showUntil times
interface DaySchedule {
  mediaIds: string[];
  showUntilMap: Record<string, string>;
}

const SEGMENT_COLORS = [
  { bg: "bg-blue-400", border: "border-blue-600", text: "text-blue-950" },
  { bg: "bg-amber-400", border: "border-amber-600", text: "text-amber-950" },
  { bg: "bg-green-400", border: "border-green-600", text: "text-green-950" },
  { bg: "bg-purple-400", border: "border-purple-600", text: "text-purple-950" },
  { bg: "bg-pink-400", border: "border-pink-600", text: "text-pink-950" },
  { bg: "bg-cyan-400", border: "border-cyan-600", text: "text-cyan-950" },
  { bg: "bg-orange-400", border: "border-orange-600", text: "text-orange-950" },
  { bg: "bg-teal-400", border: "border-teal-600", text: "text-teal-950" },
];

const DAY_NAMES = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
const MONTH_NAMES = [
  "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
  "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec",
];

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function todayKey(): string {
  const d = new Date();
  return formatDateKey(d.getFullYear(), d.getMonth(), d.getDate());
}

// ─── Daily Timeline ─────────────────────────────────────────

function DailyTimeline({
  mediaIds,
  showUntilMap,
  allMedia,
}: {
  mediaIds: string[];
  showUntilMap: Record<string, string>;
  allMedia: Media[];
}) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentPercent = (currentMinutes / 1440) * 100;

  const segments: { name: string; from: number; to: number; colorIdx: number }[] = [];
  let prevEnd = 0;

  for (let i = 0; i < mediaIds.length; i++) {
    const mediaId = mediaIds[i];
    const m = allMedia.find((m) => m.id === mediaId);
    const until = showUntilMap[mediaId];
    const endMinutes = until ? timeToMinutes(until) : 1440;
    segments.push({
      name: m?.filename || "?",
      from: prevEnd,
      to: endMinutes,
      colorIdx: i % SEGMENT_COLORS.length,
    });
    prevEnd = endMinutes;
  }

  const hours = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];

  return (
    <div className="relative">
      <div className="relative h-12 rounded-lg overflow-hidden border border-zinc-200 flex">
        {segments.map((seg, i) => {
          const widthPercent = ((seg.to - seg.from) / 1440) * 100;
          if (widthPercent <= 0) return null;
          const color = SEGMENT_COLORS[seg.colorIdx];
          return (
            <div
              key={i}
              className={`${color.bg} ${color.border} border-r last:border-r-0 h-full flex items-center justify-center overflow-hidden px-1`}
              style={{ width: `${widthPercent}%` }}
              title={`${seg.name}: ${String(Math.floor(seg.from / 60)).padStart(2, "0")}:${String(seg.from % 60).padStart(2, "0")} – ${String(Math.floor(seg.to / 60)).padStart(2, "0")}:${String(seg.to % 60).padStart(2, "0")}`}
            >
              <span className={`text-xs font-medium truncate ${color.text}`}>{seg.name}</span>
            </div>
          );
        })}
        {segments.length > 0 && segments[segments.length - 1].to < 1440 && (
          <div
            className="bg-zinc-100 h-full flex items-center justify-center"
            style={{ width: `${((1440 - segments[segments.length - 1].to) / 1440) * 100}%` }}
          />
        )}
        {segments.length === 0 && (
          <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
            <span className="text-xs text-zinc-400">Žádná média</span>
          </div>
        )}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
          style={{ left: `${currentPercent}%` }}
        >
          <div className="absolute -top-1 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full" />
        </div>
      </div>
      <div className="relative h-5 mt-1">
        {hours.map((h) => (
          <span
            key={h}
            className="absolute text-[10px] text-zinc-500 -translate-x-1/2"
            style={{ left: `${(h / 24) * 100}%` }}
          >
            {h}:00
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Calendar Component ─────────────────────────────────────

function Calendar({
  selectedDate,
  onSelectDate,
  dateSchedules,
}: {
  selectedDate: string | null;
  onSelectDate: (dateKey: string) => void;
  dateSchedules: Record<string, DaySchedule>;
}) {
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());

  const today = todayKey();

  const firstDay = new Date(viewYear, viewMonth, 1);
  // Monday = 0, Sunday = 6
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="p-1 rounded hover:bg-zinc-100 text-zinc-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="font-semibold text-zinc-900">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="p-1 rounded hover:bg-zinc-100 text-zinc-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-zinc-500 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={i} />;
          }
          const dateKey = formatDateKey(viewYear, viewMonth, day);
          const isToday = dateKey === today;
          const isSelected = dateKey === selectedDate;
          const schedule = dateSchedules[dateKey];
          const hasSchedule = schedule && schedule.mediaIds.length > 0;

          // Build mini timeline segments
          const miniSegments: { widthPercent: number; colorIdx: number }[] = [];
          if (hasSchedule) {
            let prevEnd = 0;
            for (let si = 0; si < schedule.mediaIds.length; si++) {
              const mid = schedule.mediaIds[si];
              const until = schedule.showUntilMap[mid];
              const endMin = until ? timeToMinutes(until) : 1440;
              const w = ((endMin - prevEnd) / 1440) * 100;
              if (w > 0) {
                miniSegments.push({ widthPercent: w, colorIdx: si % SEGMENT_COLORS.length });
              }
              prevEnd = endMin;
            }
          }

          return (
            <button
              key={i}
              onClick={() => onSelectDate(dateKey)}
              className={`rounded-lg text-sm relative overflow-hidden transition-colors py-3
                ${isSelected ? "ring-2 ring-blue-600 ring-offset-1" : ""}
                ${!hasSchedule && isToday ? "bg-blue-50 text-blue-700 font-bold" : ""}
                ${!hasSchedule && !isToday ? "hover:bg-zinc-100 text-zinc-900" : ""}
                ${hasSchedule && !isSelected ? "hover:opacity-80" : ""}
              `}
            >
              {/* Colored background segments */}
              {hasSchedule && (
                <div className="absolute inset-0 flex">
                  {miniSegments.map((seg, si) => (
                    <div
                      key={si}
                      className={`h-full ${SEGMENT_COLORS[seg.colorIdx].bg}`}
                      style={{ width: `${seg.widthPercent}%` }}
                    />
                  ))}
                </div>
              )}
              <span className={`relative z-10 font-medium ${hasSchedule ? "text-zinc-900 drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]" : ""} ${isToday && !hasSchedule ? "" : ""}`}>
                {day}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Day Editor (used inside calendar date mode) ────────────

function DayEditor({
  dateKey,
  schedule,
  allMedia,
  tags,
  filterTag,
  setFilterTag,
  onUpdate,
}: {
  dateKey: string;
  schedule: DaySchedule;
  allMedia: Media[];
  tags: Tag[];
  filterTag: string | null;
  setFilterTag: (tag: string | null) => void;
  onUpdate: (dateKey: string, schedule: DaySchedule) => void;
}) {
  const { mediaIds, showUntilMap } = schedule;

  const isVideo = (mimeType: string) => mimeType.startsWith("video/");

  const toggleMedia = (mediaId: string) => {
    const newIds = mediaIds.includes(mediaId)
      ? mediaIds.filter((id) => id !== mediaId)
      : [...mediaIds, mediaId];
    onUpdate(dateKey, { mediaIds: newIds, showUntilMap });
  };

  const [y, m, d] = dateKey.split("-");
  const label = `${parseInt(d)}. ${parseInt(m)}. ${y}`;

  return (
    <div>
      <h3 className="font-semibold text-zinc-900 mb-3">
        Rozvrh pro {label}
      </h3>

      {/* Timeline preview */}
      {mediaIds.length > 0 && (
        <div className="mb-4">
          <DailyTimeline mediaIds={mediaIds} showUntilMap={showUntilMap} allMedia={allMedia} />
        </div>
      )}

      {/* Assigned items for this day */}
      {mediaIds.length === 0 ? (
        <p className="text-zinc-500 text-sm mb-4">
          Žádná média pro tento den. Vyberte z dostupných níže.
        </p>
      ) : (
        <div className="mb-4">
          <SortableMediaList
            mediaIds={mediaIds}
            allMedia={allMedia}
            showUntilMap={showUntilMap}
            showTimeInputs={true}
            onReorder={(newIds) => onUpdate(dateKey, { mediaIds: newIds, showUntilMap })}
            onRemove={(id) => toggleMedia(id)}
            onShowUntilChange={(id, val) =>
              onUpdate(dateKey, { mediaIds, showUntilMap: { ...showUntilMap, [id]: val } })
            }
          />
        </div>
      )}

      {/* Available media grid */}
      <h4 className="text-sm font-medium text-zinc-900 mb-2">Dostupná média</h4>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => setFilterTag(null)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              filterTag === null
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-zinc-900 border-zinc-300 hover:border-zinc-400"
            }`}
          >
            Vše
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setFilterTag(filterTag === tag.id ? null : tag.id)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                filterTag === tag.id
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-zinc-900 border-zinc-300 hover:border-zinc-400"
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
        {allMedia
          .filter((m) => !filterTag || m.tags?.some((t) => t.tag.id === filterTag))
          .map((med) => {
            const isAssigned = mediaIds.includes(med.id);
            return (
              <div
                key={med.id}
                onClick={() => toggleMedia(med.id)}
                className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-colors ${
                  isAssigned
                    ? "border-blue-500 ring-2 ring-blue-200"
                    : "border-transparent hover:border-zinc-300"
                }`}
              >
                {isVideo(med.mimeType) ? (
                  <div className="aspect-video bg-zinc-900 flex items-center justify-center text-white text-xs">
                    Video
                  </div>
                ) : (
                  <img
                    src={`/api/uploads/${med.path}`}
                    alt={med.filename}
                    className="aspect-video object-cover"
                  />
                )}
                <p className="text-xs p-1 truncate text-zinc-900">{med.filename}</p>
              </div>
            );
          })}
      </div>
    </div>
  );
}

// ─── Copy Day Modal ─────────────────────────────────────────

function CopyDayButton({
  sourceDate,
  dateSchedules,
  onCopy,
}: {
  sourceDate: string;
  dateSchedules: Record<string, DaySchedule>;
  onCopy: (targetDates: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());

  const source = dateSchedules[sourceDate];
  if (!source || source.mediaIds.length === 0) return null;

  const firstDay = new Date(viewYear, viewMonth, 1);
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const toggleDate = (dk: string) => {
    setSelectedDates((prev) =>
      prev.includes(dk) ? prev.filter((d) => d !== dk) : [...prev, dk]
    );
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-3 py-1.5 bg-zinc-100 text-zinc-700 rounded-md hover:bg-zinc-200"
      >
        Kopírovat do jiných dnů
      </button>
    );
  }

  return (
    <div className="mt-3 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-zinc-900">Vyberte dny pro kopírování</span>
        <button onClick={() => { setOpen(false); setSelectedDates([]); }} className="text-xs text-zinc-500 hover:text-zinc-700">
          Zrušit
        </button>
      </div>

      {/* Mini calendar for selecting target days */}
      <div className="max-w-xs">
        <div className="flex items-center justify-between mb-2">
          <button onClick={prevMonth} className="p-1 rounded hover:bg-zinc-200 text-zinc-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-xs font-medium text-zinc-700">{MONTH_NAMES[viewMonth]} {viewYear}</span>
          <button onClick={nextMonth} className="p-1 rounded hover:bg-zinc-200 text-zinc-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-[10px] text-zinc-500">{d}</div>
          ))}
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const dk = formatDateKey(viewYear, viewMonth, day);
            const isSrc = dk === sourceDate;
            const isSel = selectedDates.includes(dk);
            return (
              <button
                key={i}
                disabled={isSrc}
                onClick={() => toggleDate(dk)}
                className={`text-xs aspect-square rounded transition-colors ${
                  isSrc ? "bg-zinc-200 text-zinc-400" :
                  isSel ? "bg-blue-600 text-white" :
                  "hover:bg-zinc-200 text-zinc-700"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDates.length > 0 && (
        <button
          onClick={() => { onCopy(selectedDates); setOpen(false); setSelectedDates([]); }}
          className="mt-2 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Kopírovat do {selectedDates.length} {selectedDates.length === 1 ? "dne" : "dnů"}
        </button>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────

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
  const [saving, setSaving] = useState(false);
  const [scheduleMode, setScheduleMode] = useState("none");
  const [tags, setTags] = useState<Tag[]>([]);
  const [filterTag, setFilterTag] = useState<string | null>(null);

  // Daily mode state (flat list)
  const [assignedMedia, setAssignedMedia] = useState<string[]>([]);
  const [showUntilMap, setShowUntilMap] = useState<Record<string, string>>({});

  // Date mode state (per-day schedules)
  const [dateSchedules, setDateSchedules] = useState<Record<string, DaySchedule>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/displays/${id}`)
      .then((r) => r.json())
      .then((d: Display) => {
        setDisplay(d);
        setName(d.name);
        setMode(d.mode);
        setInterval(d.interval);
        setScheduleMode(d.scheduleMode || "none");

        // Load items into appropriate state
        if (d.scheduleMode === "date") {
          // Group items by scheduleDate
          const schedules: Record<string, DaySchedule> = {};
          for (const item of d.items) {
            const dk = item.scheduleDate || "unknown";
            if (!schedules[dk]) {
              schedules[dk] = { mediaIds: [], showUntilMap: {} };
            }
            schedules[dk].mediaIds.push(item.media.id);
            if (item.showUntil) {
              schedules[dk].showUntilMap[item.media.id] = item.showUntil;
            }
          }
          setDateSchedules(schedules);
          // Select first date with content, or today
          const dates = Object.keys(schedules).sort();
          setSelectedDate(dates.length > 0 ? dates[0] : todayKey());
        } else {
          // Daily / none mode
          setAssignedMedia(d.items.map((i) => i.media.id));
          setShowUntilMap(
            Object.fromEntries(
              d.items.map((i: DisplayItem) => [i.media.id, i.showUntil || ""])
            )
          );
        }
      });
    fetch("/api/media")
      .then((r) => r.json())
      .then(setAllMedia);
    fetch("/api/tags")
      .then((r) => r.json())
      .then(setTags);
  }, [id]);

  const save = async () => {
    setSaving(true);

    let items: { mediaId: string; order: number; showUntil: string | null; scheduleDate: string | null }[];

    if (scheduleMode === "date") {
      // Flatten dateSchedules into items
      items = [];
      let globalOrder = 0;
      const sortedDates = Object.keys(dateSchedules).sort();
      for (const dk of sortedDates) {
        const sched = dateSchedules[dk];
        for (let i = 0; i < sched.mediaIds.length; i++) {
          items.push({
            mediaId: sched.mediaIds[i],
            order: globalOrder++,
            showUntil: i < sched.mediaIds.length - 1 ? sched.showUntilMap[sched.mediaIds[i]] || null : null,
            scheduleDate: dk,
          });
        }
      }
    } else {
      items = assignedMedia.map((mediaId, i) => ({
        mediaId,
        order: i,
        showUntil:
          scheduleMode !== "none" && i < assignedMedia.length - 1
            ? showUntilMap[mediaId] || null
            : null,
        scheduleDate: null,
      }));
    }

    await fetch(`/api/displays/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, mode, interval, scheduleMode, items }),
    });
    setSaving(false);
    const d = await fetch(`/api/displays/${id}`).then((r) => r.json());
    setDisplay(d);
  };

  // Daily/none mode helpers
  const toggleMedia = (mediaId: string) => {
    setAssignedMedia((prev) =>
      prev.includes(mediaId) ? prev.filter((id) => id !== mediaId) : [...prev, mediaId]
    );
  };


  // Date mode helpers
  const updateDaySchedule = (dateKey: string, schedule: DaySchedule) => {
    setDateSchedules((prev) => {
      if (schedule.mediaIds.length === 0) {
        const next = { ...prev };
        delete next[dateKey];
        return next;
      }
      return { ...prev, [dateKey]: schedule };
    });
  };

  const copyToOtherDays = (targetDates: string[]) => {
    if (!selectedDate || !dateSchedules[selectedDate]) return;
    const source = dateSchedules[selectedDate];
    setDateSchedules((prev) => {
      const next = { ...prev };
      for (const dk of targetDates) {
        next[dk] = { mediaIds: [...source.mediaIds], showUntilMap: { ...source.showUntilMap } };
      }
      return next;
    });
  };

  if (!display) {
    return <div className="p-6">Načítám...</div>;
  }

  const isVideo = (mimeType: string) => mimeType.startsWith("video/");
  const currentDaySchedule = selectedDate
    ? dateSchedules[selectedDate] || { mediaIds: [], showUntilMap: {} }
    : { mediaIds: [], showUntilMap: {} };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/admin/displays" className="text-blue-600 hover:underline">
          Displeje
        </Link>
        <span className="text-zinc-900">/</span>
        <h1 className="text-2xl font-bold text-zinc-900">{display.name}</h1>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-1">Název</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border rounded-md px-3 py-2 w-full text-zinc-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-1">Plánování</label>
            <select
              value={scheduleMode}
              onChange={(e) => setScheduleMode(e.target.value)}
              className="border rounded-md px-3 py-2 w-full text-zinc-900"
            >
              <option value="none">Bez plánování</option>
              <option value="daily">Denní (HH:MM)</option>
              <option value="date">Kalendář</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-1">Režim</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              disabled={scheduleMode !== "none"}
              className="border rounded-md px-3 py-2 w-full text-zinc-900 disabled:opacity-50"
            >
              <option value="single">Jeden obrázek</option>
              <option value="video">Video</option>
              <option value="slideshow">Slideshow</option>
            </select>
            {scheduleMode !== "none" && (
              <p className="text-xs text-zinc-500 mt-1">Plánování je aktivní — režim bude ignorován</p>
            )}
          </div>
          {mode === "slideshow" && scheduleMode === "none" && (
            <div>
              <label className="block text-sm font-medium text-zinc-900 mb-1">Interval (s)</label>
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

      {/* ─── DATE MODE: Calendar ─── */}
      {scheduleMode === "date" && (
        <>
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <Calendar
              selectedDate={selectedDate}
              onSelectDate={(dk) => setSelectedDate(dk)}
              dateSchedules={dateSchedules}
            />
          </div>

          {selectedDate && (
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <DayEditor
                dateKey={selectedDate}
                schedule={currentDaySchedule}
                allMedia={allMedia}
                tags={tags}
                filterTag={filterTag}
                setFilterTag={setFilterTag}
                onUpdate={updateDaySchedule}
              />
              <CopyDayButton
                sourceDate={selectedDate}
                dateSchedules={dateSchedules}
                onCopy={copyToOtherDays}
              />
            </div>
          )}
        </>
      )}

      {/* ─── DAILY MODE: Timeline + flat list ─── */}
      {scheduleMode === "daily" && (
        <>
          {assignedMedia.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <h2 className="font-semibold mb-3 text-zinc-900">Denní rozvrh</h2>
              <DailyTimeline
                mediaIds={assignedMedia}
                showUntilMap={showUntilMap}
                allMedia={allMedia}
              />
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="font-semibold mb-3 text-zinc-900">
              Přiřazená média ({assignedMedia.length})
            </h2>
            {assignedMedia.length === 0 ? (
              <p className="text-zinc-500 text-sm">Žádná média. Vyberte z dostupných níže.</p>
            ) : (
              <SortableMediaList
                mediaIds={assignedMedia}
                allMedia={allMedia}
                showUntilMap={showUntilMap}
                showTimeInputs={true}
                onReorder={setAssignedMedia}
                onRemove={(id) => toggleMedia(id)}
                onShowUntilChange={(id, val) => setShowUntilMap((prev) => ({ ...prev, [id]: val }))}
              />
            )}
          </div>

          {/* Available media for daily mode */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="font-semibold mb-3 text-zinc-900">Dostupná média</h2>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  onClick={() => setFilterTag(null)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    filterTag === null ? "bg-blue-600 text-white border-blue-600" : "bg-white text-zinc-900 border-zinc-300 hover:border-zinc-400"
                  }`}
                >
                  Vše
                </button>
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => setFilterTag(filterTag === tag.id ? null : tag.id)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      filterTag === tag.id ? "bg-blue-600 text-white border-blue-600" : "bg-white text-zinc-900 border-zinc-300 hover:border-zinc-400"
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {allMedia.filter((m) => !filterTag || m.tags?.some((t) => t.tag.id === filterTag)).map((m) => {
                const isAssigned = assignedMedia.includes(m.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => toggleMedia(m.id)}
                    className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-colors ${
                      isAssigned ? "border-blue-500 ring-2 ring-blue-200" : "border-transparent hover:border-zinc-300"
                    }`}
                  >
                    {isVideo(m.mimeType) ? (
                      <div className="aspect-video bg-zinc-900 flex items-center justify-center text-white text-xs">Video</div>
                    ) : (
                      <img src={`/api/uploads/${m.path}`} alt={m.filename} className="aspect-video object-cover" />
                    )}
                    <p className="text-xs p-1 truncate text-zinc-900">{m.filename}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ─── NONE MODE: Original behavior ─── */}
      {scheduleMode === "none" && (
        <>
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="font-semibold mb-3 text-zinc-900">
              Přiřazená média ({assignedMedia.length})
            </h2>
            {assignedMedia.length === 0 ? (
              <p className="text-zinc-500 text-sm">Žádná média. Vyberte z dostupných níže.</p>
            ) : (
              <SortableMediaList
                mediaIds={assignedMedia}
                allMedia={allMedia}
                showTimeInputs={false}
                onReorder={setAssignedMedia}
                onRemove={(id) => toggleMedia(id)}
              />
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="font-semibold mb-3 text-zinc-900">Dostupná média</h2>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  onClick={() => setFilterTag(null)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    filterTag === null ? "bg-blue-600 text-white border-blue-600" : "bg-white text-zinc-900 border-zinc-300 hover:border-zinc-400"
                  }`}
                >
                  Vše
                </button>
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => setFilterTag(filterTag === tag.id ? null : tag.id)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      filterTag === tag.id ? "bg-blue-600 text-white border-blue-600" : "bg-white text-zinc-900 border-zinc-300 hover:border-zinc-400"
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {allMedia.filter((m) => !filterTag || m.tags?.some((t) => t.tag.id === filterTag)).map((m) => {
                const isAssigned = assignedMedia.includes(m.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => toggleMedia(m.id)}
                    className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-colors ${
                      isAssigned ? "border-blue-500 ring-2 ring-blue-200" : "border-transparent hover:border-zinc-300"
                    }`}
                  >
                    {isVideo(m.mimeType) ? (
                      <div className="aspect-video bg-zinc-900 flex items-center justify-center text-white text-xs">Video</div>
                    ) : (
                      <img src={`/api/uploads/${m.path}`} alt={m.filename} className="aspect-video object-cover" />
                    )}
                    <p className="text-xs p-1 truncate text-zinc-900">{m.filename}</p>
                  </div>
                );
              })}
            </div>
            {allMedia.length === 0 && (
              <p className="text-zinc-900 text-sm">
                Žádná média.{" "}
                <Link href="/admin/media" className="text-blue-600 underline">Nahrajte je</Link>.
              </p>
            )}
          </div>
        </>
      )}

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

      <DisplayPreview displayId={id} />
    </div>
  );
}
