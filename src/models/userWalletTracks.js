
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const GameUser = mongoose.model("users");

const collectionName = 'userWalletTracks';

const userWalletTracksSchema = new Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: GameUser },
        id: { type: Number },
        uniqueId: { type: String },
        trnxType: { type: String },
        trnxTypeTxt: { type: String },
        trnxAmount: { type: Number },
        oppChips: { type: Number },
        oppWinningChips: { type: Number },
        chips: { type: Number },
        gameWinning: { type: Number },
        totalBucket: { type: Number },
        depositId: { type: String },
        withdrawId: { type: String },
        gameId: { type: String },
        isRobot: { type: Number },
        gameType: { type: String },
        maxSeat: { type: Number },
        betValue: { type: Number },
        tableId: { type: String },
        tournamentId: { type: Number },
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(collectionName, userWalletTracksSchema, collectionName);
