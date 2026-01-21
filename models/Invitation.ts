import mongoose, { Schema, Model } from 'mongoose'
import { Invitation } from '@/types'

const InvitationSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    acceptedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
)

// Note: token index is already created by unique: true
InvitationSchema.index({ email: 1, organizationId: 1 })
InvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

const InvitationModel: Model<Invitation> =
  mongoose.models.Invitation || mongoose.model<Invitation>('Invitation', InvitationSchema)

export default InvitationModel
