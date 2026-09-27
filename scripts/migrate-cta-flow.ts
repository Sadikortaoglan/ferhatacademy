import { prisma } from "@/lib/prisma";

async function main() {
  const freeCount = await prisma.product.updateMany({
    where: { price: 0 },
    data: { pricePresentation: "FREE", ctaFlow: "FREE_ENROLLMENT", purchaseMode: "DIRECT_PURCHASE" }
  });
  const atpCount = await prisma.product.updateMany({
    where: { purchaseMode: "APPLICATION_REQUIRED_BEFORE_PURCHASE", price: { gt: 0 } },
    data: { ctaFlow: "APPLICATION_THEN_PURCHASE", pricePresentation: "FIXED" }
  });
  const appCount = await prisma.product.updateMany({
    where: { purchaseMode: { in: ["APPLICATION_REQUIRED", "APPLICATION_OPTIONAL"] }, price: { gt: 0 } },
    data: { ctaFlow: "APPLICATION", pricePresentation: "FIXED" }
  });
  const inviteCount = await prisma.product.updateMany({
    where: { purchaseMode: "INVITE_ONLY" },
    data: { ctaFlow: "INFO_ONLY" }
  });
  console.log("FREE:", freeCount.count, "ATP:", atpCount.count, "APP:", appCount.count, "INVITE:", inviteCount.count);
  await prisma.$disconnect();
}

main().catch(console.error);
