import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { media: true } } },
  });
  return NextResponse.json(tags);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const tag = await prisma.tag.upsert({
    where: { name },
    update: {},
    create: { name },
  });

  return NextResponse.json(tag, { status: 201 });
}
