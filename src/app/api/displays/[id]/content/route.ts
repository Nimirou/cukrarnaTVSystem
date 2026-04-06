import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveItem } from "@/lib/schedule";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const display = await prisma.display.findUnique({
    where: { id },
    include: {
      items: {
        include: { media: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!display) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const allItems = display.items.map((item) => ({
    path: `/api/uploads/${item.media.path}`,
    mimeType: item.media.mimeType,
    filename: item.media.filename,
  }));

  if (display.scheduleMode === "none" || display.items.length === 0) {
    return NextResponse.json({
      mode: display.mode,
      interval: display.interval,
      scheduleMode: display.scheduleMode,
      updatedAt: display.updatedAt.toISOString(),
      nextTransition: null,
      items: allItems,
    }, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  const scheduleItems = display.items.map((item) => ({
    order: item.order,
    showUntil: item.showUntil,
    scheduleDate: item.scheduleDate,
  }));

  const { activeIndex, nextTransition } = getActiveItem(
    scheduleItems,
    display.scheduleMode as "daily" | "date",
    new Date()
  );

  const activeItems = activeIndex >= 0 && activeIndex < allItems.length
    ? [allItems[activeIndex]]
    : [];

  return NextResponse.json({
    mode: display.mode,
    interval: display.interval,
    scheduleMode: display.scheduleMode,
    updatedAt: display.updatedAt.toISOString(),
    nextTransition,
    items: activeItems,
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
