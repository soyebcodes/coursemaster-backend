const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded'], 
    default: 'pending',
    index: true
  },
  paymentMethod: { type: String, enum: ['stripe', 'paypal'], required: true },
  paymentIntentId: { type: String, sparse: true }, // Stripe payment intent ID
  transactionId: { type: String, sparse: true }, // PayPal transaction ID
  createdAt: { type: Date, default: Date.now },
  completedAt: Date
});

// Ensure user can only have one pending order per course
orderSchema.index({ user: 1, course: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'pending' } });

module.exports = mongoose.model('Order', orderSchema);
