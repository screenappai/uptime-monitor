import mongoose, { Schema, Model } from 'mongoose'
import { ContactList } from '@/types'

const ContactListSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    emails: {
      type: [String],
      default: [],
    },
    phones: {
      type: [String],
      default: [],
    },
    webhooks: {
      type: [String],
      default: [],
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

ContactListSchema.index({ organizationId: 1, createdAt: -1 })

const ContactListModel: Model<ContactList> =
  mongoose.models.ContactList || mongoose.model<ContactList>('ContactList', ContactListSchema)

export default ContactListModel
