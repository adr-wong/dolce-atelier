import { describe, it, expect } from 'bun:test';
import { hasPermission, PERMISSIONS, Resource, Action } from '../lib/permissions';

describe('PERMISSIONS constant', () => {
  it('has user, admin, superadmin roles', () => {
    expect(PERMISSIONS).toHaveProperty('user');
    expect(PERMISSIONS).toHaveProperty('admin');
    expect(PERMISSIONS).toHaveProperty('superadmin');
  });

  it('user has pasteles, pedidos, recetas resources', () => {
    expect(PERMISSIONS.user.resources).toEqual(['pasteles', 'pedidos', 'recetas']);
  });

  it('user has read, create actions', () => {
    expect(PERMISSIONS.user.actions).toEqual(['read', 'create']);
  });

  it('admin has additional resources', () => {
    expect(PERMISSIONS.admin.resources).toContain('dashboard');
    expect(PERMISSIONS.admin.resources).toContain('categorias');
    expect(PERMISSIONS.admin.resources).toContain('reportes');
  });

  it('admin has update, delete actions', () => {
    expect(PERMISSIONS.admin.actions).toContain('update');
    expect(PERMISSIONS.admin.actions).toContain('delete');
  });

  it('superadmin has all resources including usuarios and mcp', () => {
    expect(PERMISSIONS.superadmin.resources).toContain('usuarios');
    expect(PERMISSIONS.superadmin.resources).toContain('mcp');
  });

  it('superadmin has manage action', () => {
    expect(PERMISSIONS.superadmin.actions).toContain('manage');
  });
});

describe('hasPermission', () => {
  it('user can read pasteles', () => {
    expect(hasPermission('user', 'pasteles', 'read')).toBe(true);
  });

  it('user can create pedidos', () => {
    expect(hasPermission('user', 'pedidos', 'create')).toBe(true);
  });

  it('user cannot delete pasteles', () => {
    expect(hasPermission('user', 'pasteles', 'delete')).toBe(false);
  });

  it('user cannot access dashboard', () => {
    expect(hasPermission('user', 'dashboard', 'read')).toBe(false);
  });

  it('admin can update pasteles', () => {
    expect(hasPermission('admin', 'pasteles', 'update')).toBe(true);
  });

  it('admin can delete pedidos', () => {
    expect(hasPermission('admin', 'pedidos', 'delete')).toBe(true);
  });

  it('admin can read dashboard', () => {
    expect(hasPermission('admin', 'dashboard', 'read')).toBe(true);
  });

  it('admin cannot manage (superadmin action)', () => {
    expect(hasPermission('admin', 'pasteles', 'manage')).toBe(false);
  });

  it('admin cannot access usuarios', () => {
    expect(hasPermission('admin', 'usuarios', 'read')).toBe(false);
  });

  it('superadmin can manage mcp', () => {
    expect(hasPermission('superadmin', 'mcp', 'manage')).toBe(true);
  });

  it('superadmin can delete usuarios', () => {
    expect(hasPermission('superadmin', 'usuarios', 'delete')).toBe(true);
  });

  it('superadmin can read all resources', () => {
    for (const resource of PERMISSIONS.superadmin.resources) {
      expect(hasPermission('superadmin', resource, 'read')).toBe(true);
    }
  });

  it('unknown role returns false', () => {
    expect(hasPermission('guest', 'pasteles', 'read')).toBe(false);
  });

  it('empty string role returns false', () => {
    expect(hasPermission('', 'pasteles', 'read')).toBe(false);
  });
});
