import mongoose, { Schema, Model } from 'mongoose'
import { MonitorCheck } from '@/types'

const MonitorCheckSchema = new Schema<MonitorCheck>({
  monitorId: {
    type: String,
    required: true,
    ref: 'Monitor',
    index: true,
  },
  success: {
    type: Boolean,
    required: true,
  },
  responseTime: {
    type: Number,
    required: true,
  },
  statusCode: {
    type: Number,
  },
  error: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  attemptNumber: {
    type: Number,
    min: 1,
  },
})

// Compound index for efficient queries
MonitorCheckSchema.index({ monitorId: 1, timestamp: -1 })
MonitorCheckSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }) // Auto-delete after 90 days

const MonitorCheckModel: Model<MonitorCheck> =
  mongoose.models.MonitorCheck ||
  mongoose.model<MonitorCheck>('MonitorCheck', MonitorCheckSchema)

export default MonitorCheckModel
