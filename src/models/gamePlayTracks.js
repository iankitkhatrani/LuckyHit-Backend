const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AviatorTables = require("./aviatorTables");
const GameUser = require("./users");

const collectionName = "gamePlayTracks";

const gamePlayTracksSchema = new Schema({
    gameId: { type: String, default: "" },
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: AviatorTables },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: GameUser },
    deductAmount: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    rake: { type: Number, default: 0 },
    winningAmount: { type: Number, default: 0 },
    winningStatus: { type: String, default: "" },
    winningCardStatus: { type: String, default: "" },
    hukum: { type: String, default: "" },
    cards: { type: Array, default: [] },
    betValue: { type: Number, default: 0 },

}, { versionKey: false });

//module.exports = require("./index")(gamePlayTracksSchema, collectionName);

module.exports = mongoose.model(collectionName, gamePlayTracksSchema, collectionName);
