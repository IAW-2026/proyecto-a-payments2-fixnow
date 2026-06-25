import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma'

// Helper strongly typed to handle Prisma Decimal or nulls
function toNumber(value: unknown): number {
  if (!value) return 0;
  return Number(value);
}

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication (Simplified check)
    const authHeader = request.headers.get('Authorization');
    const secretKey = process.env.ANALYTICS_SECRET_KEY;

    if (!secretKey) {
      console.error('Analytics auth secret is not configured.');
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${secretKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Database Fetch (Optimized with 'select')
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        jobId: true,
        professionalId: true,
        amount: true,
        commission: true, // Renamed in mapping later
        paidAt: true,
        status: true,
      },
    });

    // 3. Calculation: ingresosNetos
    const ingresosNetos = payments.reduce((total, payment) => {
      // RECOMMENDED: Only sum payments that are actually successful/paid
      if (payment.status !== 'paid') return total; 
      
      // Note: Keeping your original logic of summing `amount`, 
      // but usually "Net Income" = amount - commission.
      return total + toNumber(payment.amount) - toNumber(payment.commission); 
    }, 0);

    // 4. Mapping: paymentsFormatted
    const paymentsFormatted = payments.map((payment) => ({
      jobId: payment.jobId,
      professionalId: payment.professionalId,
      amount: toNumber(payment.amount),
      comissionAmount: toNumber(payment.commission),
      paidAt: payment.paidAt ? payment.paidAt.toISOString() : null,
      status: payment.status,
    }));

    return NextResponse.json({
      ingresosNetos,
      volumenTransacciones: payments.length,
      payments: paymentsFormatted,
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}