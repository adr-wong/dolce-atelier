import mongoose, { Schema, Document } from 'mongoose';

export interface IWebhookEvent extends Document {
  stripeEventId: string;
  type: string;
  processed: boolean;
  createdAt: Date;
}

const WebhookEventSchema = new Schema<IWebhookEvent>(
  {
    stripeEventId: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true },
    processed: { type: Boolean, default: true },
  },
  { timestamps: true }
);

WebhookEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 72 * 3600 });

export const WebhookEvent = mongoose.model<IWebhookEvent>('WebhookEvent', WebhookEventSchema);
