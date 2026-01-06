import mongoose, { Schema, Model, Document } from 'mongoose'

export interface IDeviceToken extends Document {
  token: string
  platform: 'ios' | 'android'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const DeviceTokenSchema = new Schema<IDeviceToken>(
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
  },
  {
    timestamps: true,
  }
)

DeviceTokenSchema.index({ isActive: 1 })

const DeviceTokenModel: Model<IDeviceToken> =
  mongoose.models.DeviceToken || mongoose.model<IDeviceToken>('DeviceToken', DeviceTokenSchema)

export default DeviceTokenModel
