const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const BetLists = mongoose.model('betList');

const collectionName = 'blackNwhiteTables';

const PlayingTablesSchema = new Schema({
    gameId: { type: String, default: "" },
    gameType: { type: String, default: "BlackNWhite" },
    activePlayer: { type: Number, default: 0 },
    maxSeat: { type: Number, default: 7 },
    betId: { type: mongoose.Schema.Types.ObjectId, ref: BetLists },
    playerInfo: [],
    potLimit: { type: Number, default: 0 },
    gameState: { type: String, default: "" },
    turnStartTimer: { type: Date },
    jobId: { type: String, default: "" },
    turnDone: { type: Boolean, default: false },
    gameTimer: {},
    gameTracks: [],
    BNWCards: { black: [], white: [] },
    counters: {
        totalBlackChips: { type: Number, default: 0 },
        totalWhiteChips: { type: Number, default: 0 },
        totalHitChips: { type: Number, default: 0 },
    },
    callFinalWinner: { type: Boolean, default: false },
    isLastUserFinish: { type: Boolean, default: false },
    isFinalWinner: { type: Boolean, default: false },
    history: [],
    betamount: [],
    totalbet: { type: Number, default: 0 },
}, { versionKey: false });

module.exports = mongoose.model(collectionName, PlayingTablesSchema, collectionName);
