import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tvId: string }> }
) {
  const { tvId } = await params;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let lastUpdated = "";

      const poll = async () => {
        try {
          const display = await prisma.display.findUnique({
            where: { id: tvId },
            select: { updatedAt: true },
          });

          if (display) {
            const updated = display.updatedAt.toISOString();
            if (updated !== lastUpdated) {
              lastUpdated = updated;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ updatedAt: lastUpdated })}\n\n`)
              );
            }
          }
        } catch {
          // DB query failed, skip this cycle
        }
      };

      await poll();
      const interval = setInterval(poll, 2000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
