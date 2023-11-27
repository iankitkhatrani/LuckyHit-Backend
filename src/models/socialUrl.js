const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'social';

const SocialurlSchema = new Schema(
    {
        id:{type:Number},
        platform: { type: String },
        url: { type: String },
        createdAt: { type: Date, default: Date.now },
        modifiedAt: { type: Date, default: Date.now },
    },
    { versionKey: false }
);

module.exports = mongoose.model(collectionName, SocialurlSchema, collectionName);
