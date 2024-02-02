const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const GameUser = mongoose.model("users");
const collectionName = 'userReferTracks';

const userReferTracksSchema = new Schema(
    {

        user_id: { type: mongoose.Schema.Types.ObjectId, ref: GameUser },
        country: { type: String },
        createdAt:{ type: Date, default: Date.now },
        rId: { type: mongoose.Schema.Types.ObjectId, ref: GameUser },
        
    },
    { versionKey: false }
);

module.exports = mongoose.model(collectionName, userReferTracksSchema, collectionName);
