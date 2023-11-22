const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'noticeText';

const NoticeTextSchema = new Schema(
    {
        title: { type: String },
        content: { type: String },
        createdAt: { type: Date, default: Date.now },
        modifiedAt: { type: Date, default: Date.now },
    },
    { versionKey: false }
);

module.exports = mongoose.model(collectionName, NoticeTextSchema, collectionName);
