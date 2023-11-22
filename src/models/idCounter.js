const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'idCounter';

const IdCounterSchema = new Schema(
  {
    type: { type: String },
    counter: { type: Number },
  },
  {
    versionKey: false,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(collectionName, IdCounterSchema, collectionName);
