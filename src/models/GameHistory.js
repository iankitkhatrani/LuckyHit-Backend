const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'GameHistory';
const GameUser = require("./users");


const userDepositSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: GameUser },
    DateTime:{ type: String, default: "" },
    Name: { type: String, default: "" },
    PhoneNumber:{ type: Number, default: "" },
    RoomId:{ type: String, default: "" },
    Amount:{ type: Number, default: "" },
    Type:{ type: String, default: "" },
    game:{ type: String, default: "" }
}, { versionKey: false });

module.exports = mongoose.model(collectionName, userDepositSchema, collectionName);

