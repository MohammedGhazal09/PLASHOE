import mongoose from 'mongoose';
import crypto from 'crypto';

export const NEWSLETTER_STATUSES = ['active', 'unsubscribed', 'suppressed'];

export const createUnsubscribeToken = () => crypto.randomBytes(32).toString('hex');

const newsletterSubscriptionSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    consent: {
      type: Boolean,
      required: true,
      validate: {
        validator: (value) => value === true,
        message: 'Newsletter consent is required',
      },
    },
    source: {
      type: String,
      trim: true,
      maxlength: 80,
      default: 'home_newsletter',
    },
    status: {
      type: String,
      enum: NEWSLETTER_STATUSES,
      default: 'active',
    },
    unsubscribeToken: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
    lastConsentAt: {
      type: Date,
      default: Date.now,
    },
    unsubscribedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

newsletterSubscriptionSchema.index({ status: 1, createdAt: -1 });
newsletterSubscriptionSchema.index({ source: 1, createdAt: -1 });

export default mongoose.model('NewsletterSubscription', newsletterSubscriptionSchema);
