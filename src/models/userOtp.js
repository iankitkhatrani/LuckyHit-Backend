const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'userOtp';

const OtpSchema = new Schema(
  {
    mobileNumber: { type: String },
    otp: { type: Number },
    newUser: { type: Boolean, default: false },
    referralCode: { type: String, default: '' },
    codeVerify: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(collectionName, OtpSchema, collectionName);
