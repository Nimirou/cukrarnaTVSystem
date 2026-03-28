import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const existing = await prisma.display.count();
if (existing > 0) {
  console.log(`Already have ${existing} displays, skipping seed.`);
} else {
  await prisma.display.createMany({
    data: [
      { name: "TV1 - Vitrina" },
      { name: "TV2 - Vchod" },
      { name: "TV3 - Pokladna" },
    ],
  });
  console.log("Created 3 default displays.");
}

await prisma.$disconnect();
