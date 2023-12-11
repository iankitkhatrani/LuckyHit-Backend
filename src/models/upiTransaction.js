const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transactionSchema = new Schema(
    {
        amount: { type: Number, required: true },
        upiId: { type: String, required: true },
        type: { type: String, enum: ["DEPOSIT", "WITHDRAW", ""], required: true },
        status: { type: String, required: [true, "Payment status is required"], default: "Pending", enum: ["Pending", "Approved", "Reversed", "Processing", "Queued", "Rejected"] },
        txnRef: { type: String }, // Used in payment link as transactionRef and transactionId  [tr,tid]
    },
    {
        timestamps: { createdAt: "createdOn", updatedAt: "modifiedOn" },
    }
);

const collectionName = "upiTransaction";

const collectionSchema = {
    user: { type: Schema.Types.ObjectId, required: true, ref: "users" },
    upi: { type: Schema.Types.ObjectId, required: true, ref: "upi" },
    transactions: [transactionSchema],
};

module.exports = mongoose.model(collectionName, collectionSchema, collectionName);
