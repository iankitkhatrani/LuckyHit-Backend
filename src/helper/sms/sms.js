const mongoose = require('mongoose');
const logger = require('../../../logger');
const UserOtp = mongoose.model('userOtp');

module.exports.sendOTP = async (data, client) => {
  try {
    logger.info(client);
    let otp = '75757';

    let tempMobile = data.mobile_number;

    const up = {
      $set: {
        mobile_number: tempMobile,
        otp: otp,
        code_verify: false,
      },
    };

    if (typeof data.new_user !== 'undefined' && data.new_user) {
      up['$set']['refer_code'] = data.refer_code || '';
      up['$set']['new_user'] = typeof data.new_user !== 'undefined' && data.new_user ? true : false;
    }
    //csl('sendOTP up :: ', up);

    let wh = {
      mobile_number: tempMobile.toString(),
    };

    let otpDetails = await UserOtp.findOneAndUpdate(wh, up, {
      upsert: true,
      new: true,
    }).lean();
    //csl('sendOTP otpDetails :', otpDetails);

    otpDetails['SampleOTP'] = otpDetails.otp;
    return otpDetails;
  } catch (e) {
    //csl('sendOTP Exception : 1 ::', e);
    return false;
  }
};
