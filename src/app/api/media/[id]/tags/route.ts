import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const tagIds: string[] = body.tagIds || [];

  await prisma.$transaction(async (tx) => {
    await tx.mediaTag.deleteMany({ where: { mediaId: id } });
    for (const tagId of tagIds) {
      await tx.mediaTag.create({
        data: { mediaId: id, tagId },
      });
    }
  });

  const media = await prisma.media.findUnique({
    where: { id },
    include: { tags: { include: { tag: true } } },
  });

  return NextResponse.json(media);
}
