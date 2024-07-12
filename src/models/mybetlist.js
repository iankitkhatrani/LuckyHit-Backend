const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'mybetlist';

const BetTablesSchema = new Schema({
    gameId: { type: String, default: "" },
    betamount:{ type: Number, default: 0},
    x:{ type: Number, default: 0},
    winamount:{ type: Number, default: 0},
    uid: { type: String, default: "" },
    dateTime: { type: String, default: ""},
}, { versionKey: false });

module.exports = mongoose.model(collectionName, BetTablesSchema, collectionName);
