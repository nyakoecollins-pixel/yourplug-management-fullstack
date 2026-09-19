import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const prisma = new PrismaClient();

// This script runs on every container boot (see docker-entrypoint.sh) — it
// must NEVER delete or overwrite real data. It only ensures the one real
// admin account exists; if it's already there, this does nothing at all.
function generatePassword(): string {
  return crypto.randomBytes(9).toString("base64").replace(/[+/=]/g, "").slice(0, 12);
}

async function main() {
  const existingAdmin = await prisma.user.findUnique({ where: { email: "admin@yourplug.co.ke" } });

  if (existingAdmin) {
    console.log("Admin account already exists — nothing to seed.");
    return;
  }

  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name: "Admin", email: "admin@yourplug.co.ke", phone: "+254700000000",
      passwordHash, role: "ADMIN",
      emailVerifiedAt: new Date(), phoneVerifiedAt: new Date(),
    },
  });

  console.log("=".repeat(60));
  console.log("Created real admin account — save this password now:");
  console.log("  Email:    admin@yourplug.co.ke");
  console.log(`  Password: ${password}`);
  console.log("This will not be shown again. Change it after first login.");
  console.log("=".repeat(60));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
