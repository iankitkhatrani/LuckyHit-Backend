const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'avatarTable';

const BannerSchema = new Schema(
    {
        imageUrl: { type: String }
    },
    { versionKey: false }
);

module.exports = mongoose.model(collectionName, BannerSchema, collectionName);
