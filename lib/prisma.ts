import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Tipamos globalThis de forma segura
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 1. Controlamos de forma segura que exista la URL de la base de datos
const connectionString = process.env.DATABASE_URL;

// 2. Solo creamos el adaptador si la URL está definida (evita que rompa en compilación estática)
const adapter = connectionString ? new PrismaPg({ connectionString }) : null;

// 3. Inicializamos el cliente reutilizando la instancia existente
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: adapter || undefined,
    // Mantiene tus logs de queries en desarrollo para ver qué pasa en Supabase
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

// 4. Guardamos en el objeto global para evitar fugas de conexiones con el Hot Reload
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}