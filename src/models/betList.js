const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'betList';

const BetListSchema = new Schema(
    {
        gameName: { type: String },
        gameType: { type: String, required: true },
        entryFee: { type: Number },//boot Amount
        chalLimit: { type: Number },
        potLimit: { type: Number },//Max Pot
        maxPlayer: { type: Number, default: 2 },
        activePlayer: { type: Number },
        createdAt: { type: Date, default: Date.now },
        modifiedAt: { type: Date, default: Date.now },
    },
    {
        versionKey: false,
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(collectionName, BetListSchema, collectionName);

