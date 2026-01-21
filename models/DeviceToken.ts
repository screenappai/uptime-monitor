import mongoose, { Schema, Model } from 'mongoose'
import { DeviceToken } from '@/types'

const DeviceTokenSchema = new Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    platform: {
      type: String,
      enum: ['ios', 'android'],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
)

DeviceTokenSchema.index({ isActive: 1 })
DeviceTokenSchema.index({ organizationId: 1, isActive: 1 })
DeviceTokenSchema.index({ userId: 1, isActive: 1 })

const DeviceTokenModel: Model<DeviceToken> =
  mongoose.models.DeviceToken || mongoose.model<DeviceToken>('DeviceToken', DeviceTokenSchema)

export default DeviceTokenModel
