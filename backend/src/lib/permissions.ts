import { AppError, ErrorCode } from './errors';

export type Resource =
  | 'pasteles'
  | 'pedidos'
  | 'recetas'
  | 'usuarios'
  | 'dashboard'
  | 'categorias'
  | 'reportes'
  | 'mcp';

export type Action = 'read' | 'create' | 'update' | 'delete' | 'manage';

export const PERMISSIONS: Record<string, { resources: Resource[]; actions: Action[] }> = {
  user: {
    resources: ['pasteles', 'pedidos', 'recetas'],
    actions: ['read', 'create'],
  },
  admin: {
    resources: ['pasteles', 'pedidos', 'recetas', 'dashboard', 'categorias', 'reportes'],
    actions: ['read', 'create', 'update', 'delete'],
  },
  superadmin: {
    resources: ['pasteles', 'pedidos', 'recetas', 'usuarios', 'dashboard', 'categorias', 'reportes', 'mcp'],
    actions: ['read', 'create', 'update', 'delete', 'manage'],
  },
};

export function hasPermission(role: string, resource: Resource, action: Action): boolean {
  const rolePerms = PERMISSIONS[role];
  if (!rolePerms) return false;
  return rolePerms.resources.includes(resource) && rolePerms.actions.includes(action);
}

export function requirePermission(resource: Resource, action: Action) {
  return async ({ request, set }: { request: Request; set: { status: number } }) => {
    const { verifyAdmin } = await import('../middleware/auth');
    const admin = await verifyAdmin(request.headers.get('Authorization'));

    if (!admin) {
      set.status = 401;
      throw new AppError(ErrorCode.UNAUTHORIZED, 'No autenticado');
    }

    if (!hasPermission(admin.role, resource, action)) {
      set.status = 403;
      throw new AppError(
        ErrorCode.FORBIDDEN,
        `Permiso denegado: ${action} ${resource}`
      );
    }

    return admin;
  };
}
