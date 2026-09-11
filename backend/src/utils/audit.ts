import { prisma } from "../db.js";

export async function audit(
  actorId: string | null,
  action: string,
  objectType: string,
  objectId: string
) {
  await prisma.auditLog.create({
    data: { actorId: actorId ?? undefined, action, objectType, objectId },
  });
}
