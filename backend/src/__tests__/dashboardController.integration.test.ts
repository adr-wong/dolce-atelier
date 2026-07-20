import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { getDashboardStats } from '../controllers/admin/dashboardController';
import { Pastel, Pedido, Receta } from '../models';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('getDashboardStats integration (real in-memory MongoDB)', () => {
  it('returns the new fields with correct values', async () => {
    await Pastel.deleteMany({});
    await Pedido.deleteMany({});
    await Receta.deleteMany({});

    // Seed Pasteles
    const pasteles = await Pastel.insertMany([
      { nombre: 'Tres Leches', precio: 25, categoria: 'vainilla', imagen: 'img1', disponible: true },
      { nombre: 'Chocolate', precio: 30, categoria: 'chocolate', imagen: 'img2', disponible: true },
      { nombre: 'Fresa', precio: 28, categoria: 'frutas', imagen: 'img3', disponible: false },
    ]);

    // Seed Recetas
    await Receta.insertMany([
      { clerkUserId: 'u1', nota: 'receta 1', personas: 10, estado: 'PENDIENTE' },
      { clerkUserId: 'u2', nota: 'receta 2', personas: 20, estado: 'COTIZADA' },
    ]);

    const now = Date.now();
    const itemFor = (p: (typeof pasteles)[number]) => ({
      pastelId: p._id,
      nombre: p.nombre,
      precioSnapshot: p.precio,
      cantidad: 2,
    });

    // Seed Pedidos with varied estado, totals, and createdAt
    const pedidoSeed = [
      { clerkUserId: 'u1', email: 'a@x.com', estado: 'PENDIENTE' as const, total: 50, metodoEntrega: 'TIENDA' as const, items: [itemFor(pasteles[0])], createdAt: new Date(now - 1000) },
      { clerkUserId: 'u1', email: 'b@x.com', estado: 'PAGADO' as const, total: 60, metodoEntrega: 'DOMICILIO' as const, items: [itemFor(pasteles[1])], createdAt: new Date(now - 2000) },
      { clerkUserId: 'u1', email: 'c@x.com', estado: 'PREPARANDO' as const, total: 70, metodoEntrega: 'TIENDA' as const, items: [itemFor(pasteles[2])], createdAt: new Date(now - 3000) },
      { clerkUserId: 'u2', email: 'd@x.com', estado: 'CANCELADO' as const, total: 80, metodoEntrega: 'DOMICILIO' as const, items: [itemFor(pasteles[0])], createdAt: new Date(now - 4000) },
      { clerkUserId: 'u2', email: 'e@x.com', estado: 'ENTREGADO' as const, total: 90, metodoEntrega: 'TIENDA' as const, items: [itemFor(pasteles[1])], createdAt: new Date(now - 5000) },
      { clerkUserId: 'u3', email: 'f@x.com', estado: 'PENDIENTE' as const, total: 100, metodoEntrega: 'DOMICILIO' as const, items: [itemFor(pasteles[2])], createdAt: new Date(now - 6000) },
      { clerkUserId: 'u3', email: 'g@x.com', estado: 'LISTO' as const, total: 110, metodoEntrega: 'TIENDA' as const, items: [itemFor(pasteles[0])], createdAt: new Date(now - 7000) },
    ];
    await Pedido.insertMany(pedidoSeed);

    const context = { set: {} as { status: number }, query: {}, params: {}, body: {} } as any;
    const result = await getDashboardStats(context);

    // status code
    expect(context.set.status).toBe(200);

    // counts
    expect(result.totalPasteles).toBe(3);
    expect(result.totalPedidos).toBe(7);
    expect(result.totalRecetas).toBe(2);

    // pedidosPendientes = count of PENDIENTE (2)
    expect(result.pedidosPendientes).toBe(2);

    // totalIngresos = sum of total for non-CANCELADO pedidos
    // 50+60+70+90+100+110 = 480 (80 CANCELADO excluded)
    expect(result.totalIngresos).toBe(480);

    // statusBreakdown maps each estado to its count
    expect(result.statusBreakdown).toBeTypeOf('object');
    expect(result.statusBreakdown['PENDIENTE']).toBe(2);
    expect(result.statusBreakdown['PAGADO']).toBe(1);
    expect(result.statusBreakdown['PREPARANDO']).toBe(1);
    expect(result.statusBreakdown['CANCELADO']).toBe(1);
    expect(result.statusBreakdown['ENTREGADO']).toBe(1);
    expect(result.statusBreakdown['LISTO']).toBe(1);

    // recentPedidos limited to 5, sorted by createdAt desc
    expect(Array.isArray(result.recentPedidos)).toBe(true);
    expect(result.recentPedidos.length).toBe(5);

    const createdAts = result.recentPedidos.map((p: any) => new Date(p.createdAt).getTime());
    const sortedDesc = [...createdAts].sort((a, b) => b - a);
    expect(createdAts).toEqual(sortedDesc);

    // each recentPedidos entry has _id, estado, total, createdAt (string), items (array)
    for (const p of result.recentPedidos) {
      expect(p._id).toBeDefined();
      expect(typeof p._id).toBe('string');
      expect(typeof p.estado).toBe('string');
      expect(typeof p.total).toBe('number');
      expect(typeof p.createdAt).toBe('string');
      expect(Array.isArray(p.items)).toBe(true);
      expect(p.items.length).toBeGreaterThan(0);
    }
  });
});
