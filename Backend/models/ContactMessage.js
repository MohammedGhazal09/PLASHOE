import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required']
  },
  subject: String,
  message: {
    type: String,
    required: [true, 'Message is required']
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

contactMessageSchema.index({ isRead: 1, createdAt: -1 });
contactMessageSchema.index({ email: 1, createdAt: -1 });

export default mongoose.model('ContactMessage', contactMessageSchema);
