import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import type { SendReceiptRequest } from "@/lib/types";
import { generateReceiptHTML } from "@/lib/email-templates";

const resend = new Resend(process.env.RESEND_API_KEY);

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
  try {
    const body = await request.json();
    
    const validationResult = SendReceiptSchema.safeParse(body);
    
    if (!validationResult.success) {
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

    const { customerEmail, orderId, orderItems, total, customerName }: SendReceiptRequest = validationResult.data;

    const htmlContent = generateReceiptHTML({
      orderId,
      orderItems,
      total,
      customerName,
    });

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@dolceatelier.com",
      to: customerEmail,
      subject: `Dolce Atelier - Recibo de tu pedido #${orderId}`,
      html: htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resend error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Failed to send email";
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
