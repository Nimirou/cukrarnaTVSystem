interface ScheduleItem {
  order: number;
  showUntil: string | null;
  scheduleDate?: string | null;
}

interface ScheduleResult {
  activeIndex: number;
  nextTransition: string | null;
}

const TIMEZONE = process.env.TIMEZONE || "Europe/Prague";

function getLocalTime(now: Date): string {
  return now.toLocaleTimeString("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getLocalDate(now: Date): string {
  // en-CA locale gives YYYY-MM-DD format
  return now.toLocaleDateString("en-CA", { timeZone: TIMEZONE });
}

function getLocalNextMidnight(now: Date): Date {
  // Get tomorrow's date in local timezone, then create a Date at midnight
  const todayLocal = getLocalDate(now);
  const [y, m, d] = todayLocal.split("-").map(Number);
  // Create date string for tomorrow midnight in the timezone
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowLocal = getLocalDate(tomorrow);
  // Parse as UTC then adjust — simpler: just add remaining ms until midnight
  const currentLocal = getLocalTime(now);
  const [ch, cm] = currentLocal.split(":").map(Number);
  const minutesLeft = (24 * 60) - (ch * 60 + cm);
  return new Date(now.getTime() + minutesLeft * 60 * 1000);
}

function findActiveByTime(
  items: ScheduleItem[],
  now: Date
): ScheduleResult {
  const currentTime = getLocalTime(now);

  for (let i = 0; i < items.length; i++) {
    const until = items[i].showUntil;
    if (!until) {
      const nextMidnight = getLocalNextMidnight(now);
      return { activeIndex: i, nextTransition: nextMidnight.toISOString() };
    }
    if (currentTime < until) {
      // Compute transition time: how many minutes until `until`
      const [ch, cm] = currentTime.split(":").map(Number);
      const [uh, um] = until.split(":").map(Number);
      const diffMinutes = (uh * 60 + um) - (ch * 60 + cm);
      const transition = new Date(now.getTime() + diffMinutes * 60 * 1000);
      return { activeIndex: i, nextTransition: transition.toISOString() };
    }
  }

  const nextMidnight = getLocalNextMidnight(now);
  return { activeIndex: items.length - 1, nextTransition: nextMidnight.toISOString() };
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

  // Date mode: filter items for today's date in local timezone
  const todayStr = getLocalDate(now);
  const todayItems = sorted.filter((item) => item.scheduleDate === todayStr);

  if (todayItems.length === 0) {
    return { activeIndex: -1, nextTransition: null };
  }

  const result = findActiveByTime(todayItems, now);

  if (result.activeIndex >= 0) {
    const originalIndex = sorted.indexOf(todayItems[result.activeIndex]);
    return { activeIndex: originalIndex, nextTransition: result.nextTransition };
  }

  return result;
}
