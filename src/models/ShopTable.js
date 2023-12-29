const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'ShopTable';

const BannerSchema = new Schema(
    {
        "inapp":{ type: String },
        "price":{ type: Number, default: 0 },
        "chips":{ type: Number, default: 0 },
        "bonus":{ type: Number, default: 0 },
        
    },
    { versionKey: false }
);

module.exports = mongoose.model(collectionName, BannerSchema, collectionName);
