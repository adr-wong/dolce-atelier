import { AuditLog } from '../models';

class AuditLogService {
  async log(data: {
    userId?: string;
    action: string;
    resource: string;
    method: string;
    ip?: string;
    statusCode?: number;
    metadata?: Record<string, unknown>;
  }) {
    AuditLog.create(data).catch(err =>
      console.error('[AUDIT] Failed to write log:', err.message)
    );
  }
}

export const auditLogService = new AuditLogService();
