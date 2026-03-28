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

  return NextResponse.json(display);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const display = await prisma.$transaction(async (tx) => {
    // Update display settings
    await tx.display.update({
      where: { id },
      data: {
        name: body.name,
        mode: body.mode,
        interval: body.interval,
      },
    });

    // Replace all items if provided
    if (body.items) {
      await tx.displayItem.deleteMany({ where: { displayId: id } });

      for (const item of body.items) {
        await tx.displayItem.create({
          data: {
            displayId: id,
            mediaId: item.mediaId,
            order: item.order,
          },
        });
      }
    }

    return tx.display.findUnique({
      where: { id },
      include: {
        items: {
          include: { media: true },
          orderBy: { order: "asc" },
        },
      },
    });
  });

  return NextResponse.json(display);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.display.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
