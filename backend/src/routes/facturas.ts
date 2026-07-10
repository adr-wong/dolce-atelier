import { Elysia, t } from 'elysia';
import { Pedido } from '../models';
import { authMiddleware } from '../middleware/auth';

export const facturaRoutes = new Elysia({ prefix: '/api/facturas' })
  // HU-022: Descargar factura PDF
  .get('/:pedidoId', async ({ params, headers, set }) => {
    const userId = await authMiddleware(headers);
    if (!userId) {
      set.status = 401;
      return { error: 'No autenticado' };
    }

    const pedido = await Pedido.findById(params.pedidoId);
    if (!pedido) {
      set.status = 404;
      return { error: 'Pedido no encontrado' };
    }

    if (pedido.clerkUserId !== userId) {
      set.status = 403;
      return { error: 'Acceso denegado' };
    }

    if (pedido.estado !== 'PAGADO' && pedido.estado !== 'ENTREGADO' && pedido.estado !== 'PREPARANDO' && pedido.estado !== 'LISTO' && pedido.estado !== 'EN_CAMINO') {
      set.status = 400;
      return { error: 'La factura solo está disponible para pedidos pagados' };
    }

    // Generar factura simple en texto estructurado (HTML)
    const itemsHtml = pedido.items.map((item: any) =>
      `<tr><td>${item.nombre}</td><td style="text-align:center">${item.cantidad}</td><td style="text-align:right">$${item.precioSnapshot.toFixed(2)}</td><td style="text-align:right">$${(item.precioSnapshot * item.cantidad).toFixed(2)}</td></tr>`
    ).join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Factura #${pedido._id}</title>
<style>body{font-family:Arial;max-width:700px;margin:40px auto;padding:20px;color:#333}
h1{color:#c41e3a} table{width:100%;border-collapse:collapse;margin:20px 0}
th{background:#f5f5f5;padding:10px;text-align:left} td{padding:10px;border-bottom:1px solid #eee}
.total{text-align:right;font-size:1.2em;margin-top:20px}
.footer{text-align:center;margin-top:40px;color:#999;font-size:12px}</style></head>
<body><h1>DOLCE ATELIER</h1><p>Factura de compra</p>
<p><strong>Pedido #:</strong> ${pedido._id}</p>
<p><strong>Fecha:</strong> ${pedido.createdAt ? new Date(pedido.createdAt).toLocaleDateString('es-PE') : '-'}</p>
<p><strong>Email:</strong> ${pedido.email}</p>
<p><strong>Entrega:</strong> ${pedido.metodoEntrega === 'DOMICILIO' ? 'Domicilio' : 'Tienda'}</p>
${pedido.direccionEnvio ? `<p><strong>Dirección:</strong> ${pedido.direccionEnvio}</p>` : ''}
<table><thead><tr><th>Producto</th><th style="text-align:center">Cant</th><th style="text-align:right">Precio</th><th style="text-align:right">Subtotal</th></tr></thead>
<tbody>${itemsHtml}</tbody></table>
<p class="total"><strong>Total: $${pedido.total.toFixed(2)}</strong></p>
<div class="footer">Dolce Atelier © ${new Date().getFullYear()} - factura generada digitalmente</div>
</body></html>`;

    set.headers = {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="factura-${pedido._id}.html"`,
    };
    return html;
  }, {
    params: t.Object({ pedidoId: t.String() }),
  });
