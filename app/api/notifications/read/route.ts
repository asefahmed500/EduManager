import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

export async function POST(req: Request) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.userId;
  const body = await req.json().catch(() => ({}));
  const ids: number[] | undefined = body?.ids;

  await prisma.notification.updateMany({
    where: {
      userId,
      ...(Array.isArray(ids) && ids.length > 0 ? { id: { in: ids } } : {}),
    },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
