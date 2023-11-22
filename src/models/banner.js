const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'banner';

const BannerSchema = new Schema(
    {
        title: { type: String },
        imageUrl: { type: String },
        createdAt: { type: Date, default: Date.now },
        modifiedAt: { type: Date, default: Date.now },

    },
    { versionKey: false }
);

module.exports = mongoose.model(collectionName, BannerSchema, collectionName);
