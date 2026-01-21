import mongoose, { Schema, Model } from 'mongoose'
import { OTPToken } from '@/types'

const OTPTokenSchema = new Schema<OTPToken>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    code: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

// Auto-expire documents after expiration time
OTPTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
OTPTokenSchema.index({ email: 1, createdAt: -1 })

const OTPTokenModel: Model<OTPToken> =
  mongoose.models.OTPToken || mongoose.model<OTPToken>('OTPToken', OTPTokenSchema)

export default OTPTokenModel
