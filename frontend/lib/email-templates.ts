import type { OrderItem } from "./types";

interface ReceiptData {
  orderId: string;
  orderItems: OrderItem[];
  total: number;
  customerName?: string;
}

export function generateReceiptHTML(data: ReceiptData): string {
  const { orderId, orderItems, total, customerName } = data;

  const itemsHTML = orderItems
    .map((item) => {
      const subtotal = item.quantity * item.price;
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$${subtotal.toFixed(2)}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #f0c0d0; }
          .header h1 { color: #d4728e; margin: 0; }
          .order-info { margin: 20px 0; }
          .order-info strong { color: #d4728e; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background-color: #f9f9f9; padding: 12px; text-align: left; border-bottom: 2px solid #ddd; }
          .total-row { font-weight: bold; font-size: 1.1em; }
          .total-row td { border-top: 2px solid #d4728e; padding-top: 15px; }
          .footer { text-align: center; margin-top: 30px; padding: 20px; color: #888; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Dolce Atelier</h1>
            <p>Tu pedido está listo</p>
          </div>
          
          <div class="order-info">
            ${customerName ? `<p>Hola <strong>${customerName}</strong>,</p>` : "<p>Hola,</p>"}
            <p>Gracias por tu compra. Aquí están los detalles de tu pedido:</p>
            <p><strong>Número de orden:</strong> ${orderId}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th style="text-align: center;">Cantidad</th>
                <th style="text-align: right;">Precio</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="3" style="padding: 15px 12px; text-align: right;">Total:</td>
                <td style="padding: 15px 12px; text-align: right;">$${total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <div class="footer">
            <p>¡Gracias por elegir Dolce Atelier!</p>
            <p>Esperamos verte pronto.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
