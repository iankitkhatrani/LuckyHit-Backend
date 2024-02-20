const mongoose = require('mongoose');
const GameUser = require('./users');
const Schema = mongoose.Schema;

const TransactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: GameUser },
    transactionId: { type: String, trim: true, default: 'N/A' },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String },
    amount: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ['successful', 'success', 'Pending', 'pending', 'failed', 'Successful', 'FAILED', 'approve', 'Cancelled', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    OrderID:{ type: String ,default: ''},
    orderInfo:{ type: String ,default: ''},
    webhook:{}
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('paymentin', TransactionSchema);
