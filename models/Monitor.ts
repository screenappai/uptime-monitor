import mongoose, { Schema, Model } from 'mongoose'
import { Monitor } from '@/types'

const MonitorSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['http', 'https'],
      default: 'https',
    },
    interval: {
      type: Number,
      default: 60, // 60 seconds
      min: 30,
    },
    timeout: {
      type: Number,
      default: 30, // 30 seconds
      min: 5,
      max: 60,
    },
    status: {
      type: String,
      enum: ['up', 'down', 'paused'],
      default: 'paused',
    },
    lastCheck: {
      type: Date,
    },
    contactLists: {
      type: [String],
      default: [],
    },
    alerts: {
      email: [String],
      webhook: [String],
      phone: [String],
    },
  },
  {
    timestamps: true,
  }
)

// Create indexes for better query performance
MonitorSchema.index({ status: 1 })
MonitorSchema.index({ createdAt: -1 })
MonitorSchema.index({ organizationId: 1, createdAt: -1 })

const MonitorModel: Model<Monitor> =
  mongoose.models.Monitor || mongoose.model<Monitor>('Monitor', MonitorSchema)

export default MonitorModel
