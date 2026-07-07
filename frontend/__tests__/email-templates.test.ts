import { generateReceiptHTML } from '@/lib/email-templates';

describe('generateReceiptHTML', () => {
  it('should include order id', () => {
    const html = generateReceiptHTML({
      orderId: 'ORD-123',
      orderItems: [],
      total: 0,
    });

    expect(html).toContain('ORD-123');
  });

  it('should include customer name when provided', () => {
    const html = generateReceiptHTML({
      orderId: 'ORD-1',
      orderItems: [],
      total: 0,
      customerName: 'Maria',
    });

    expect(html).toContain('Maria');
    expect(html).toContain('Hola <strong>Maria</strong>');
  });

  it('should use generic greeting when customer name is missing', () => {
    const html = generateReceiptHTML({
      orderId: 'ORD-1',
      orderItems: [],
      total: 0,
    });

    expect(html).toContain('<p>Hola,</p>');
    expect(html).not.toContain('Hola <strong>');
  });

  it('should render item rows with correct subtotals', () => {
    const html = generateReceiptHTML({
      orderId: 'ORD-1',
      orderItems: [
        { name: 'Chocolate', quantity: 2, price: 150 },
        { name: 'Vainilla', quantity: 1, price: 200 },
      ],
      total: 500,
    });

    expect(html).toContain('Chocolate');
    expect(html).toContain('Vainilla');
    expect(html).toContain('$300.00');
    expect(html).toContain('$200.00');
    expect(html).toContain('$500.00');
  });

  it('should render total', () => {
    const html = generateReceiptHTML({
      orderId: 'ORD-1',
      orderItems: [{ name: 'Red Velvet', quantity: 1, price: 180 }],
      total: 180,
    });

    expect(html).toContain('$180.00');
  });

  it('should handle empty items list', () => {
    const html = generateReceiptHTML({
      orderId: 'ORD-1',
      orderItems: [],
      total: 0,
    });

    expect(html).toContain('$0.00');
    expect(html).toContain('Dolce Atelier');
  });
});
