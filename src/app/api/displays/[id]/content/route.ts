import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

  return NextResponse.json({
    mode: display.mode,
    interval: display.interval,
    updatedAt: display.updatedAt.toISOString(),
    items: display.items.map((item) => ({
      path: `/api/uploads/${item.media.path}`,
      mimeType: item.media.mimeType,
      filename: item.media.filename,
    })),
  });
}
