const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'userpayout';
const GameUser = require("./users");

const userPayoutSchema = new Schema({
    name:{ type: String, default: "" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: GameUser },
    email:{ type: String, default: "" },
    mobileno: { type: String, default: "" },
    screenshort:{ type: String, default: "" },
    payoutAmount:{ type: Number, default: 0 },
    bankAcNum:{ type: String, default: "" },
    bankName:{ type: String, default: "" },
    IFSCcode:{ type: String, default: "" },
    acname:{ type: String, default: "" },
    upi_id:{ type: String, default: "" },
    dateOfpayout:{ type: Date },
    paymentmode:{ type: String, default: "" },
    status:{ type: Number, default: -1 },
    approve:{ type: String, default: "" },
    reject:{ type: String, default: "" },
}, { versionKey: false });

module.exports = mongoose.model(collectionName, userPayoutSchema, collectionName);
