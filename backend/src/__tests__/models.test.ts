import { describe, it, expect } from 'bun:test';
import { Pastel } from '../models/Pastel';
import { Pedido, type EstadoPedido } from '../models/Pedido';
import { Receta, type EstadoReceta } from '../models/Receta';
import { Categoria } from '../models/Categoria';
import { CodigoDescuento } from '../models/CodigoDescuento';
import { AuditLog } from '../models/AuditLog';
import { WebhookEvent } from '../models/WebhookEvent';
import mongoose from 'mongoose';

describe('model registration', () => {
  it('registers all models with the expected names', () => {
    expect(Pastel.modelName).toBe('Pastel');
    expect(Pedido.modelName).toBe('Pedido');
    expect(Receta.modelName).toBe('Receta');
    expect(Categoria.modelName).toBe('Categoria');
    expect(CodigoDescuento.modelName).toBe('CodigoDescuento');
    expect(AuditLog.modelName).toBe('AuditLog');
    expect(WebhookEvent.modelName).toBe('WebhookEvent');
  });

  it('exposes schema paths on each model', () => {
    expect(Pastel.schema.paths).toHaveProperty('nombre');
    expect(Pastel.schema.paths).toHaveProperty('precio');
    expect(Pedido.schema.paths).toHaveProperty('estado');
    expect(Receta.schema.paths).toHaveProperty('nota');
  });
});

describe('Pastel model', () => {
  it('applies default disponible=true', () => {
    const p = new Pastel({
      nombre: 'Tres leches',
      precio: 300,
      categoria: 'Clásicos',
      imagen: 'https://example.com/a.jpg',
    });
    expect(p.disponible).toBe(true);
  });

  it('validates a well-formed document', async () => {
    const p = new Pastel({
      nombre: 'Tres leches',
      precio: 300,
      categoria: 'Clásicos',
      imagen: 'https://example.com/a.jpg',
    });
    await expect(p.validate()).resolves.toBeUndefined();
  });

  it('rejects a document missing required fields', async () => {
    const p = new Pastel({ nombre: 'Incompleto' } as any);
    await expect(p.validate()).rejects.toBeTruthy();
  });
});

describe('Pedido model', () => {
  const validEstados: EstadoPedido[] = [
    'PENDIENTE', 'PAGADO', 'PREPARANDO', 'LISTO', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO',
  ];

  it('defaults estado to PENDIENTE', () => {
    const pedido = new Pedido({
      clerkUserId: 'user_1',
      email: 'a@b.com',
      total: 100,
      items: [{ pastelId: new mongoose.Types.ObjectId(), nombre: 'x', precioSnapshot: 50, cantidad: 2 }],
      metodoEntrega: 'TIENDA',
    });
    expect(pedido.estado).toBe('PENDIENTE');
  });

  it('accepts every valid estado enum value', async () => {
    for (const estado of validEstados) {
      const pedido = new Pedido({
        clerkUserId: 'user_1',
        email: 'a@b.com',
        total: 100,
        estado,
        items: [{ pastelId: new mongoose.Types.ObjectId(), nombre: 'x', precioSnapshot: 50, cantidad: 2 }],
        metodoEntrega: 'TIENDA',
      });
      await expect(pedido.validate()).resolves.toBeUndefined();
    }
  });

  it('rejects an invalid estado enum value', async () => {
    const pedido = new Pedido({
      clerkUserId: 'user_1',
      email: 'a@b.com',
      total: 100,
      estado: 'DESCONOCIDO' as EstadoPedido,
      items: [{ pastelId: new mongoose.Types.ObjectId(), nombre: 'x', precioSnapshot: 50, cantidad: 2 }],
      metodoEntrega: 'TIENDA',
    });
    await expect(pedido.validate()).rejects.toBeTruthy();
  });

  it('rejects items with cantidad below 1', async () => {
    const pedido = new Pedido({
      clerkUserId: 'user_1',
      email: 'a@b.com',
      total: 100,
      items: [{ pastelId: new mongoose.Types.ObjectId(), nombre: 'x', precioSnapshot: 50, cantidad: 0 }],
      metodoEntrega: 'TIENDA',
    });
    await expect(pedido.validate()).rejects.toBeTruthy();
  });
});

describe('Receta model', () => {
  const validEstados: EstadoReceta[] = [
    'PENDIENTE', 'REVISANDO', 'COTIZADA', 'ACEPTADA', 'RECHAZADA',
  ];

  it('defaults estado to PENDIENTE and cotizacion to null', () => {
    const receta = new Receta({ clerkUserId: 'u', nota: 'Quiero un pastel' });
    expect(receta.estado).toBe('PENDIENTE');
    expect(receta.cotizacion).toBeNull();
  });

  it('accepts every valid estado enum value', async () => {
    for (const estado of validEstados) {
      const receta = new Receta({ clerkUserId: 'u', nota: 'n', estado });
      await expect(receta.validate()).resolves.toBeUndefined();
    }
  });

  it('rejects an invalid estado enum value', async () => {
    const receta = new Receta({
      clerkUserId: 'u',
      nota: 'n',
      estado: 'DESCONOCIDO' as EstadoReceta,
    });
    await expect(receta.validate()).rejects.toBeTruthy();
  });
});

describe('Categoria model', () => {
  it('applies defaults (activa=true, orden=0)', () => {
    const c = new Categoria({ nombre: 'Frutas', slug: 'frutas' });
    expect(c.activa).toBe(true);
    expect(c.orden).toBe(0);
    expect(c.slug).toBe('frutas');
  });

  it('validates a well-formed categoria', async () => {
    const c = new Categoria({ nombre: 'Frutas', slug: 'frutas' });
    await expect(c.validate()).resolves.toBeUndefined();
  });

  it('rejects a categoria missing required fields', async () => {
    const c = new Categoria({ nombre: 'Sin slug' } as any);
    await expect(c.validate()).rejects.toBeTruthy();
  });
});

describe('CodigoDescuento model', () => {
  it('applies defaults (activo=true, usosActuales=0)', () => {
    const c = new CodigoDescuento({
      codigo: 'VERANO',
      tipo: 'porcentaje',
      valor: 10,
      fechaExpiracion: new Date('2099-01-01'),
    });
    expect(c.activo).toBe(true);
    expect(c.usosActuales).toBe(0);
  });

  it('validates a well-formed codigo', async () => {
    const c = new CodigoDescuento({
      codigo: 'VERANO',
      tipo: 'fijo',
      valor: 50,
      fechaExpiracion: new Date('2099-01-01'),
    });
    await expect(c.validate()).resolves.toBeUndefined();
  });

  it('rejects an invalid tipo enum value', async () => {
    const c = new CodigoDescuento({
      codigo: 'X',
      tipo: 'raro' as any,
      valor: 1,
      fechaExpiracion: new Date('2099-01-01'),
    });
    await expect(c.validate()).rejects.toBeTruthy();
  });
});

describe('AuditLog model', () => {
  it('validates a minimal audit log', async () => {
    const log = new AuditLog({ action: 'LOGIN', resource: '/auth', method: 'POST' });
    await expect(log.validate()).resolves.toBeUndefined();
  });

  it('rejects a log missing required fields', async () => {
    const log = new AuditLog({ action: 'LOGIN' } as any);
    await expect(log.validate()).rejects.toBeTruthy();
  });
});

describe('WebhookEvent model', () => {
  it('defaults processed to true', () => {
    const e = new WebhookEvent({ stripeEventId: 'evt_1', type: 'payment' });
    expect(e.processed).toBe(true);
  });

  it('validates a well-formed webhook event', async () => {
    const e = new WebhookEvent({ stripeEventId: 'evt_1', type: 'payment' });
    await expect(e.validate()).resolves.toBeUndefined();
  });
});
