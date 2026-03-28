import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const displays = await prisma.display.findMany({
    include: {
      items: {
        include: { media: true },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(displays);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const display = await prisma.display.create({
    data: {
      name: body.name,
    },
  });
  return NextResponse.json(display, { status: 201 });
}
