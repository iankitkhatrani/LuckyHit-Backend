const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'usercards';
const GameUser = require("./users");


const userDepositSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: GameUser },
    bankAc:{ type: String, default: "" },
    IFSCcode:{ type: String, default: "" },
    acname:{ type: String, default: "" },
    upi_id:{ type: String, default: "" },
    status:{ type: Number, default: "" },
    type:{type: String, default: ""}
}, { versionKey: false });

module.exports = mongoose.model(collectionName, userDepositSchema, collectionName);
