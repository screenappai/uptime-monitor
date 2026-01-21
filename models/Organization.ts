import mongoose, { Schema, Model } from 'mongoose'
import { Organization } from '@/types'

const OrganizationSchema = new Schema<Organization>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[a-z0-9-]+$/,
    },
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },
    settings: {
      maxMonitors: {
        type: Number,
        default: 5,
      },
      maxContactLists: {
        type: Number,
        default: 3,
      },
      maxMembers: {
        type: Number,
        default: 1,
      },
      checkInterval: {
        type: Number,
        default: 60,
      },
    },
  },
  {
    timestamps: true,
  }
)

// Note: slug index is already created by unique: true

const OrganizationModel: Model<Organization> =
  mongoose.models.Organization || mongoose.model<Organization>('Organization', OrganizationSchema)

export default OrganizationModel
