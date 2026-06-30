import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  userId?: string;
  action: string;
  resource: string;
  method: string;
  ip?: string;
  statusCode?: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: String, index: true },
    action: { type: String, required: true, index: true },
    resource: { type: String, required: true },
    method: { type: String, required: true },
    ip: { type: String },
    statusCode: { type: Number },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: false }
);

AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
