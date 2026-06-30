import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { SendReceiptRequest } from "@/lib/types";
import { generateReceiptHTML } from "@/lib/email-templates";

async function sendViaBrevo(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; status?: number; body?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_FROM_EMAIL || 'Dolce Atelier <noreply@dolceatelier.com>';

  const fromMatch = fromEmail.match(/<(.+)>/);
  const senderEmail = fromMatch ? fromMatch[1] : fromEmail;
  const fromName = fromEmail.replace(/<.>/, '').trim() || 'Dolce Atelier';

  console.log('[RECEIPT] Enviando a Brevo →', { to: params.to, from: senderEmail, subject: params.subject });

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey || '',
    },
    body: JSON.stringify({
      sender: { name: fromName, email: senderEmail },
      to: [{ email: params.to }],
      subject: params.subject,
      htmlContent: params.html,
    }),
  });

  console.log('[RECEIPT] Brevo status:', response.status);

  const responseBody = await response.text();
  console.log('[RECEIPT] Brevo response:', responseBody);

  if (!response.ok) {
    console.error('[RECEIPT] Brevo ERROR:', responseBody);
    return { success: false, status: response.status, body: responseBody };
  }

  console.log('[RECEIPT] Brevo OK');
  return { success: true, status: response.status, body: responseBody };
}

const SendReceiptSchema = z.object({
  customerEmail: z.string().email("Invalid email format"),
  orderId: z.string().min(1, "Order ID is required"),
  orderItems: z.array(
    z.object({
      name: z.string().min(1, "Item name is required"),
      quantity: z.number().min(1, "Quantity must be at least 1"),
      price: z.number().min(0, "Price must be non-negative"),
    })
  ).min(1, "At least one item is required"),
  total: z.number().min(0, "Total must be non-negative"),
  customerName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  console.log('[RECEIPT] === Inicio envío recibo ===');
  try {
    const body = await request.json();
    console.log('[RECEIPT] Body recibido:', { customerEmail: body.customerEmail, orderId: body.orderId, itemsCount: body.orderItems?.length, total: body.total });

    const validationResult = SendReceiptSchema.safeParse(body);

    if (!validationResult.success) {
      console.error('[RECEIPT] Validación FALLÓ:', validationResult.error.issues);
      return NextResponse.json(
        {
          success: false,
          errors: validationResult.error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          }))
        },
        { status: 400 }
      );
    }
    console.log('[RECEIPT] Validación OK');

    const { customerEmail, orderId, orderItems, total, customerName }: SendReceiptRequest = validationResult.data;

    console.log('[RECEIPT] Generando HTML...');
    const htmlContent = generateReceiptHTML({
      orderId,
      orderItems,
      total,
      customerName,
    });
    console.log('[RECEIPT] HTML generado,', htmlContent.length, 'chars');

    const result = await sendViaBrevo({
      to: customerEmail,
      subject: `Dolce Atelier - Recibo de tu pedido #${orderId}`,
      html: htmlContent,
    });

    if (!result.success) {
      console.error('[RECEIPT] === Fin, success: false, status:', result.status, '===');
      return NextResponse.json(
        { success: false, error: `Brevo error ${result.status}: ${result.body}` },
        { status: 500 }
      );
    }

    console.log('[RECEIPT] === Fin, success: true ===');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[RECEIPT] Error inesperado:", error);

    const errorMessage = error instanceof Error ? error.message : "Failed to send email";

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
