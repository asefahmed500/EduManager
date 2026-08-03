import "server-only";

import { prisma } from "@/lib/prisma";

export type NotificationType =
  | "INFO"
  | "ASSIGNMENT"
  | "SUBMISSION"
  | "GRADE";

type Input = {
  userIds: number[];
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
};

export async function createNotifications({
  userIds,
  title,
  message,
  type = "INFO",
  link,
}: Input): Promise<void> {
  if (userIds.length === 0) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, title, message, type, link })),
  });
}
