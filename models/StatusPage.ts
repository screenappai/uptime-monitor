import mongoose, { Schema, Model } from 'mongoose'
import { StatusPage } from '@/types'

const StatusPageSchema = new Schema(
  {
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    monitors: [
      {
        type: String,
        ref: 'Monitor',
      },
    ],
    customDomain: {
      type: String,
      trim: true,
    },
    branding: {
      logo: String,
      primaryColor: {
        type: String,
        default: '#3b82f6',
      },
    },
  },
  {
    timestamps: true,
  }
)

// Unique slug per organization
StatusPageSchema.index({ organizationId: 1, slug: 1 }, { unique: true })

const StatusPageModel: Model<StatusPage> =
  mongoose.models.StatusPage ||
  mongoose.model<StatusPage>('StatusPage', StatusPageSchema)

export default StatusPageModel
