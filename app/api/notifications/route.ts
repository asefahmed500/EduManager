import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

export async function GET() {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ unreadCount: 0, items: [] });
  }

  const userId = session.userId;
  const [unreadCount, items] = await Promise.all([
    prisma.notification.count({ where: { userId, read: false } }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return NextResponse.json({ unreadCount, items });
}
