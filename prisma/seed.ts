import "dotenv/config"
import { PrismaClient, PaymentStatus } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

// Configuracion del pool de conexiones para el adaptador nativo de PostgreSQL
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // Limpieza controlada de registros previos para asegurar la idempotencia del script de pruebas
  // await prisma.payment.deleteMany({});

  // @ts-ignore
  await prisma.payment.createMany({
    data: [
      {
        jobId: "trabajo-prueba-error", 
        clientId: "user_cliente_99",
        professionalId: "user_3DhHBm8iZb6sjai56pXNZjMWNTE", 
        amount: 5000,
        commission: 500,
        status: PaymentStatus.paid, 
        paidAt: new Date("2026-05-18T19:45:52.250Z"),
      },
      {
        jobId: "trabajo-real-uns-001", 
        clientId: "user_cliente_simulado_99",
        professionalId: "user_3DhHBm8iZb6sjai56pXNZjMWNTE", 
        amount: 15000,
        commission: 1500,
        status: PaymentStatus.processing, 
      },
      {
        jobId: "trabajo-viejo-marzo",
        clientId: "client-003",
        professionalId: "user_3DhHBm8iZb6sjai56pXNZjMWNTE", 
        amount: 6000,
        commission: 600,
        status: PaymentStatus.failed,
      }
    ],
    skipDuplicates: true,
  })
}

main()
  .then(async () => {
    console.log("Seed completed successfully with real IDs!")
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error("Error ejecutando el script de seed:", error)
    await prisma.$disconnect()
    process.exit(1)
  })