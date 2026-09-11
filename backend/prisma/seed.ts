import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const DEMO_PASSWORD = "Password123!";

async function upsertUser(name: string, email: string, phone: string, role: "CUSTOMER" | "AGENT" | "ADMIN") {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name, email, phone, role, passwordHash,
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
    },
  });
}

async function main() {
  console.log("Seeding demo data...");

  const james = await upsertUser("James Mwangi", "james.mwangi@example.com", "+254712345678", "CUSTOMER");
  await upsertUser("Aisha Hassan", "aisha.hassan@example.com", "+254733221908", "CUSTOMER");
  await upsertUser("Brian Otieno", "brian.otieno@primeretail.co.ke", "+254700556213", "CUSTOMER");

  const collins = await upsertUser("Collins", "collins@yourplug.co.ke", "+254711000001", "AGENT");
  await upsertUser("Mary", "mary@yourplug.co.ke", "+254711000002", "AGENT");
  await upsertUser("Brian (Agent)", "brian.agent@yourplug.co.ke", "+254711000003", "AGENT");

  await upsertUser("Admin", "admin@yourplug.co.ke", "+254711000000", "ADMIN");

  const supplierData = [
    { name: "ABC Electronics", category: "Electronics", location: "Nairobi, Nashua Centre", verified: true, reliability: 94, priceScore: 88, delivery: 90, warranty: 92 },
    { name: "Nairobi Office Solutions", category: "Office Equipment", location: "Nairobi, Westlands", verified: true, reliability: 86, priceScore: 91, delivery: 78, warranty: 80 },
    { name: "Industrial Supplies Kenya", category: "Industrial Equipment", location: "Nairobi, Industrial Area", verified: true, reliability: 92, priceScore: 83, delivery: 95, warranty: 89 },
  ];
  const suppliers = [];
  for (const s of supplierData) {
    const existing = await prisma.supplier.findFirst({ where: { name: s.name } });
    suppliers.push(existing ?? (await prisma.supplier.create({ data: s })));
  }

  const existingRequest = await prisma.procurementRequest.findFirst({ where: { ref: "YPM-202609-00127" } });
  if (!existingRequest) {
    const request = await prisma.procurementRequest.create({
      data: {
        ref: "YPM-202609-00127",
        item: "HP EliteBook 840 G9",
        description: "Laptop for field sales team",
        quantity: 1,
        budget: 150000,
        currency: "KES",
        urgency: "NORMAL",
        scope: "LOCAL",
        status: "IN_TRANSIT",
        deliveryAddress: "Nairobi CBD",
        customerId: james.id,
        agentId: collins.id,
      },
    });

    await prisma.supplierQuote.create({
      data: {
        requestId: request.id, supplierId: suppliers[0].id, price: 145000,
        deliveryEstimate: "1-day delivery", warrantyTerms: "2-year warranty", score: 91, recommended: true,
      },
    });
    await prisma.supplierQuote.create({
      data: {
        requestId: request.id, supplierId: suppliers[1].id, price: 138500,
        deliveryEstimate: "3-day delivery", warrantyTerms: "1-year warranty", score: 79, recommended: false,
      },
    });

    const events = [
      "Customer submitted request", "AI generated procurement specification", "YourPlug reviewed request",
      "Agent Collins assigned", "Supplier A quotation received", "Supplier B quotation received",
      "Customer approved quotation", "Invoice generated", "Payment received", "Purchase order created",
      "Courier collected package", "Order in transit",
    ];
    for (const label of events) {
      await prisma.requestEvent.create({ data: { requestId: request.id, label } });
    }

    const invoice = await prisma.invoice.create({
      data: {
        number: "INV-001829", requestId: request.id, subtotal: 145000, serviceFee: 8700,
        deliveryFee: 800, total: 154500, currency: "KES", status: "PAID", paymentReference: "YPM-001829",
      },
    });
    await prisma.payment.create({
      data: { invoiceId: invoice.id, amount: 154500, status: "confirmed", idempotencyKey: "seed-payment-1" },
    });
  }

  console.log("Seed complete.");
  console.log(`Demo login password for all seeded users: ${DEMO_PASSWORD}`);
  console.log("Customer: james.mwangi@example.com | Admin: admin@yourplug.co.ke");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
