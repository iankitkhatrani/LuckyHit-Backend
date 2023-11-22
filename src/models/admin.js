const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'admin';

const AdminSchema = new Schema(
  {
    email: { type: String, required: true },
    name: { type: String },
    password: { type: String },
    createdAt: { type: Date, default: Date.now },
    modifiedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

module.exports = mongoose.model(collectionName, AdminSchema, collectionName);
