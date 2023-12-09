const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'upi';

const UPISchema = new Schema(
    {
        user: { type: Schema.Types.ObjectId, required: true, ref: "users" },
        upiId: { type: String, required: true, unique: true },
        isVerified: { type: Boolean, default: false },
        status: { type: String, required: [true, "Payment status is required"], default: "Pending", enum: ["Pending", "Completed", "Rejected", "InvalidUpi", "UnableToProceed", "Expired"] },
        rejectionReason: { type: String, default: null },
    },
    { versionKey: false }
);

module.exports = mongoose.model(collectionName, UPISchema, collectionName);
