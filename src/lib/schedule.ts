interface ScheduleItem {
  order: number;
  showUntil: string | null;
  scheduleDate?: string | null;
}

interface ScheduleResult {
  activeIndex: number;
  nextTransition: string | null;
}

function findActiveByTime(
  items: ScheduleItem[],
  now: Date
): ScheduleResult {
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  for (let i = 0; i < items.length; i++) {
    const until = items[i].showUntil;
    if (!until) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return { activeIndex: i, nextTransition: tomorrow.toISOString() };
    }
    if (currentTime < until) {
      const [h, m] = until.split(":").map(Number);
      const transition = new Date(now);
      transition.setHours(h, m, 0, 0);
      return { activeIndex: i, nextTransition: transition.toISOString() };
    }
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return { activeIndex: items.length - 1, nextTransition: tomorrow.toISOString() };
}

export function getActiveItem(
  items: ScheduleItem[],
  scheduleMode: "daily" | "date",
  now: Date
): ScheduleResult {
  if (items.length === 0) {
    return { activeIndex: -1, nextTransition: null };
  }

  const sorted = [...items].sort((a, b) => a.order - b.order);

  if (scheduleMode === "daily") {
    return findActiveByTime(sorted, now);
  }

  // Date mode: filter items for today's date, then use daily time logic
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const todayItems = sorted.filter((item) => item.scheduleDate === todayStr);

  if (todayItems.length === 0) {
    return { activeIndex: -1, nextTransition: null };
  }

  const result = findActiveByTime(todayItems, now);

  if (result.activeIndex >= 0) {
    // Map back to original index in sorted array
    const originalIndex = sorted.indexOf(todayItems[result.activeIndex]);
    return { activeIndex: originalIndex, nextTransition: result.nextTransition };
  }

  return result;
}
