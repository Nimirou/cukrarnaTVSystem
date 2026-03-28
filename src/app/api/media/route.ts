import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

export async function GET() {
  const media = await prisma.media.findMany({
    orderBy: { createdAt: "desc" },
    include: { tags: { include: { tag: true } } },
  });
  return NextResponse.json(media);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = path.extname(file.name);
  const uniqueName = `${randomUUID()}${ext}`;

  await mkdir(UPLOADS_DIR, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOADS_DIR, uniqueName), buffer);

  const media = await prisma.media.create({
    data: {
      filename: file.name,
      path: uniqueName,
      mimeType: file.type,
      size: file.size,
    },
  });

  return NextResponse.json(media, { status: 201 });
}
