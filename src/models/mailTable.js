const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'mailTable';

const MailTextSchema = new Schema(
    {
        title: { type: String },
        content: { type: String },
        createdAt: { type: Date, default: Date.now },
        modifiedAt: { type: Date, default: Date.now },
        userId:[]
    },
    { versionKey: false }
);

module.exports = mongoose.model(collectionName, MailTextSchema, collectionName);
