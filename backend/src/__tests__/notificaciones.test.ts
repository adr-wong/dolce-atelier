import { describe, it, expect, mock, beforeEach } from 'bun:test';

const mockEnviarMensaje = mock(() => Promise.resolve(true));

mock.module('../services/whatsapp', () => ({
  enviarMensaje: mockEnviarMensaje,
}));

import { notificarCambioEstado, notificarCotizacionReceta } from '../services/notificaciones';

describe('formatTelefono (tested via notificarCambioEstado)', () => {
  beforeEach(() => {
    mockEnviarMensaje.mockClear();
  });

  it('returns false for undefined phone', async () => {
    const result = await notificarCambioEstado(undefined, 'abc123', 'PAGADO');
    expect(result).toBe(false);
    expect(mockEnviarMensaje).not.toHaveBeenCalled();
  });

  it('returns false for empty string phone', async () => {
    const result = await notificarCambioEstado('', 'abc123', 'PAGADO');
    expect(result).toBe(false);
    expect(mockEnviarMensaje).not.toHaveBeenCalled();
  });

  it('returns false for short phone (<8 chars after cleaning)', async () => {
    const result = await notificarCambioEstado('12345', 'abc123', 'PAGADO');
    expect(result).toBe(false);
    expect(mockEnviarMensaje).not.toHaveBeenCalled();
  });

  it('strips + prefix from phone', async () => {
    mockEnviarMensaje.mockResolvedValueOnce(true);
    const result = await notificarCambioEstado('+5212345678', 'abc123', 'PAGADO');
    expect(result).toBe(true);
    expect(mockEnviarMensaje).toHaveBeenCalledWith('5212345678', expect.any(String));
  });

  it('returns cleaned phone without + prefix', async () => {
    mockEnviarMensaje.mockResolvedValueOnce(true);
    const result = await notificarCambioEstado('5212345678', 'abc123', 'PAGADO');
    expect(result).toBe(true);
    expect(mockEnviarMensaje).toHaveBeenCalledWith('5212345678', expect.any(String));
  });

  it('strips non-numeric chars except +', async () => {
    mockEnviarMensaje.mockResolvedValueOnce(true);
    const result = await notificarCambioEstado('+52 (123) 456-7890', 'abc123', 'PAGADO');
    expect(result).toBe(true);
    expect(mockEnviarMensaje).toHaveBeenCalledWith('521234567890', expect.any(String));
  });
});

describe('notificarCambioEstado', () => {
  beforeEach(() => {
    mockEnviarMensaje.mockClear();
  });

  const phone = '521234567890';

  it('PAGADO sends confirmation message', async () => {
    mockEnviarMensaje.mockResolvedValueOnce(true);
    const result = await notificarCambioEstado(phone, 'order123', 'PAGADO', { total: 250 });
    expect(result).toBe(true);
    const msg = mockEnviarMensaje.mock.calls[0][1];
    expect(msg).toContain('confirmado');
    expect(msg).toContain('$250.00');
  });

  it('PAGADO handles missing total', async () => {
    mockEnviarMensaje.mockResolvedValueOnce(true);
    await notificarCambioEstado(phone, 'order123', 'PAGADO');
    const msg = mockEnviarMensaje.mock.calls[0][1];
    expect(msg).toContain('$—');
  });

  it('PREPARANDO sends preparation message', async () => {
    mockEnviarMensaje.mockResolvedValueOnce(true);
    const result = await notificarCambioEstado(phone, 'order123', 'PREPARANDO');
    expect(result).toBe(true);
    const msg = mockEnviarMensaje.mock.calls[0][1];
    expect(msg).toContain('preparado');
  });

  it('LISTO with TIENDA sends pickup message', async () => {
    mockEnviarMensaje.mockResolvedValueOnce(true);
    const result = await notificarCambioEstado(phone, 'order123', 'LISTO', { metodo: 'TIENDA' });
    expect(result).toBe(true);
    const msg = mockEnviarMensaje.mock.calls[0][1];
    expect(msg).toContain('recoger');
  });

  it('LISTO with DOMICILIO sends shipping message', async () => {
    mockEnviarMensaje.mockResolvedValueOnce(true);
    const result = await notificarCambioEstado(phone, 'order123', 'LISTO', { metodo: 'DOMICILIO' });
    expect(result).toBe(true);
    const msg = mockEnviarMensaje.mock.calls[0][1];
    expect(msg).toContain('saldrá');
  });

  it('LISTO without metodo sends shipping message', async () => {
    mockEnviarMensaje.mockResolvedValueOnce(true);
    const result = await notificarCambioEstado(phone, 'order123', 'LISTO');
    expect(result).toBe(true);
    const msg = mockEnviarMensaje.mock.calls[0][1];
    expect(msg).toContain('saldrá');
  });

  it('EN_CAMINO sends on-the-way message', async () => {
    mockEnviarMensaje.mockResolvedValueOnce(true);
    const result = await notificarCambioEstado(phone, 'order123', 'EN_CAMINO', { direccion: 'Calle 123' });
    expect(result).toBe(true);
    const msg = mockEnviarMensaje.mock.calls[0][1];
    expect(msg).toContain('en camino');
    expect(msg).toContain('Calle 123');
  });

  it('EN_CAMINO without direccion uses default', async () => {
    mockEnviarMensaje.mockResolvedValueOnce(true);
    await notificarCambioEstado(phone, 'order123', 'EN_CAMINO');
    const msg = mockEnviarMensaje.mock.calls[0][1];
    expect(msg).toContain('tu dirección');
  });

  it('ENTREGADO sends delivery message', async () => {
    mockEnviarMensaje.mockResolvedValueOnce(true);
    const result = await notificarCambioEstado(phone, 'order123', 'ENTREGADO');
    expect(result).toBe(true);
    const msg = mockEnviarMensaje.mock.calls[0][1];
    expect(msg).toContain('entregado');
  });

  it('CANCELADO sends cancellation message', async () => {
    mockEnviarMensaje.mockResolvedValueOnce(true);
    const result = await notificarCambioEstado(phone, 'order123', 'CANCELADO');
    expect(result).toBe(true);
    const msg = mockEnviarMensaje.mock.calls[0][1];
    expect(msg).toContain('cancelado');
  });

  it('default case returns false', async () => {
    const result = await notificarCambioEstado(phone, 'order123', 'INVALID_STATE');
    expect(result).toBe(false);
    expect(mockEnviarMensaje).not.toHaveBeenCalled();
  });

  it('invalid phone returns false', async () => {
    const result = await notificarCambioEstado('123', 'order123', 'PAGADO');
    expect(result).toBe(false);
    expect(mockEnviarMensaje).not.toHaveBeenCalled();
  });

  it('shortens pedidoId to last 6 chars uppercase', async () => {
    mockEnviarMensaje.mockResolvedValueOnce(true);
    await notificarCambioEstado(phone, 'abcdefghijklmnop', 'PAGADO');
    const msg = mockEnviarMensaje.mock.calls[0][1];
    expect(msg).toContain('#KLMNOP');
  });
});

describe('notificarCotizacionReceta', () => {
  beforeEach(() => {
    mockEnviarMensaje.mockClear();
  });

  it('sends cotizacion message with valid phone', async () => {
    mockEnviarMensaje.mockResolvedValueOnce(true);
    const result = await notificarCotizacionReceta('521234567890', 'receta123', 500);
    expect(result).toBe(true);
    const msg = mockEnviarMensaje.mock.calls[0][1];
    expect(msg).toContain('$500.00');
    expect(msg).toContain('cotizada');
  });

  it('returns false for invalid phone', async () => {
    const result = await notificarCotizacionReceta('123', 'receta123', 500);
    expect(result).toBe(false);
    expect(mockEnviarMensaje).not.toHaveBeenCalled();
  });

  it('returns false for undefined phone', async () => {
    const result = await notificarCotizacionReceta(undefined, 'receta123', 500);
    expect(result).toBe(false);
    expect(mockEnviarMensaje).not.toHaveBeenCalled();
  });

  it('shortens recetaId to last 6 chars uppercase', async () => {
    mockEnviarMensaje.mockResolvedValueOnce(true);
    await notificarCotizacionReceta('521234567890', 'abcdefghijkl', 100);
    const msg = mockEnviarMensaje.mock.calls[0][1];
    expect(msg).toContain('#GHIJKL');
  });
});
