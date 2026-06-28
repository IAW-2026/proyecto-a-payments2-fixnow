import "dotenv/config";
import { PrismaClient, PaymentStatus, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Misma lógica que Rider App para saber el estado del trabajo
function getJobStatus(index: number) {
  if (index < 15) {
    return index % 2 === 0 ? "PAID" : "CANCELLED";
  }

  const activeStatuses = [
    "PENDING",
    "ACCEPTED",
    "IN_PROGRESS",
    "COMPLETED",
    "PAID",
    "CANCELLED",
  ];

  return activeStatuses[(index - 15) % activeStatuses.length];
}

async function main() {
  console.log("🌱 Iniciando seed de Payments sincronizado con Rider...");

  const professionals = [
    "prof-julio",
    "prof-camila",
    "prof-diego",
    "prof-sofia",
    "prof-nicolas",
    "prof-valeria",
    "prof-martin",
    "user_3EYemLF8a3fUCHbCIE70ayra8nT",
    "user_3DxYRYVCndXOSf04E0kum8vfk5O",
    "user_3EYqDmV4wSgR0Tjk0glP0k3C5a8",
    "prof-ana",
    "prof-luis",
    "prof-maria",
  ];

  const payments = Array.from({ length: 30 })
    .map((_, i) => {
      const jobStatus = getJobStatus(i);

      // Si el trabajo está pendiente, todavía no tiene profesional ni pago generado
      if (jobStatus === "PENDING") return null;

      const jobId = `job-new-${(i + 1).toString().padStart(3, "0")}`;
      const clientId = `client-${((i % 15) + 4).toString().padStart(3, "0")}`;
      const professionalId = professionals[i % professionals.length];

    let status: PaymentStatus = PaymentStatus.pending
      let paidAt: Date | null = null
      if (jobStatus === "PAID") {
        status = PaymentStatus.paid;
        paidAt = new Date();
      } else if (jobStatus === "IN_PROGRESS" || jobStatus === "COMPLETED") {
        status = PaymentStatus.processing;
      } else if (jobStatus === "CANCELLED") {
        status = PaymentStatus.failed;
      }

      const amountValue = Math.floor(Math.random() * 50000) + 10000;
      const commissionValue = amountValue * 0.1;

      return {
        jobId,
        clientId,
        professionalId,
        amount: new Prisma.Decimal(amountValue),
        commission: new Prisma.Decimal(commissionValue),
        status,
        paidAt,
      };
    })
    .filter((payment) => payment !== null);

  for (const payment of payments) {
    await prisma.payment.upsert({
      where: {
        jobId: payment.jobId,
      },
      update: {
        clientId: payment.clientId,
        professionalId: payment.professionalId,
        amount: payment.amount,
        commission: payment.commission,
        status: payment.status,
        paidAt: payment.paidAt,
      },
      create: payment,
    });
  }

  console.log(`✅ ${payments.length} pagos creados o actualizados correctamente.`);
  console.log("🌱 Seed de Payments finalizado.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Error ejecutando el seed de Payments:", error);
    await prisma.$disconnect();
    process.exit(1);
  });