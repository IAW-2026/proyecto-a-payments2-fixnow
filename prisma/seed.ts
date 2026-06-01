import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({
  adapter,
})

async function main() {
  // Opcional: Si quieren limpiar la tabla antes de meter el seed para no duplicar basura
  // await prisma.payment.deleteMany({});

  await prisma.payment.createMany({
    data: [
      {
        jobId: "trabajo-prueba-error", // 👈 El de la Prueba 5
        clientId: "user_cliente_99",
        professionalId: "user_3DhHBm8iZb6sjai56pXNZjMWNTE", // 👈 TU ID REAL
        amount: 5000,
        commission: 500,
        status: "paid", // Lo dejamos ya pagado
        paymentMethod: "wallet",
        settlementStatus: "pending", // Listo para que pruebes tu botón de retirar saldo
        paidAt: new Date("2026-05-18T19:45:52.250Z"),
      },
      {
        jobId: "trabajo-real-uns-001", // 👈 El de la Prueba 1
        clientId: "user_cliente_simulado_99",
        professionalId: "user_3DhHBm8iZb6sjai56pXNZjMWNTE", // 👈 TU ID REAL
        amount: 15000,
        commission: 1500,
        status: "processing", // Sigue en proceso, simulando el flujo feliz sin terminar
        paymentMethod: "wallet",
        settlementStatus: "pending",
      },
      {
        jobId: "trabajo-viejo-marzo",
        clientId: "client-003",
        professionalId: "user_3DhHBm8iZb6sjai56pXNZjMWNTE", // 👈 TU ID REAL para que sume a tus reportes anteriores
        amount: 6000,
        commission: 600,
        status: "failed",
        paymentMethod: "wallet",
        settlementStatus: "pending",
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
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })