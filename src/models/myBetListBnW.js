const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'myBetListBnW';

const BetTablesSchema = new Schema({
    gameId: { type: String, default: "" },
    betAmount: { type: Number, default: 0 },
    type: { type: String, default: "" },
    winAmount: { type: Number, default: 0 },
    uid: { type: String, default: "" },
    dateTime: { type: String, default: "" },
}, { versionKey: false });

module.exports = mongoose.model(collectionName, BetTablesSchema, collectionName);
