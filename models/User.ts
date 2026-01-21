import mongoose, { Schema, Model } from 'mongoose'
import { User } from '@/types'

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      trim: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
)

// Note: email index is already created by unique: true
UserSchema.index({ organizationId: 1, role: 1 })

const UserModel: Model<User> =
  mongoose.models.User || mongoose.model<User>('User', UserSchema)

export default UserModel
