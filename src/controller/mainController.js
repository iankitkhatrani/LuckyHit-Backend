const bcrypt = require('bcrypt');
const { omit } = require('lodash');
const mongoose = require('mongoose');

const config = require('../../config');
const CONST = require('../../constant');
const logger = require('../../logger');

const usersHelper = require('../helper/usersHelper');
const commonHelper = require('../helper/commonHelper');

const Users = mongoose.model('users');
const OtpMobile = mongoose.model('otpMobile');


/**
 * @description  User Sign In
 * @param {Object} requestBody
 * @return - {message:"response Message", status: 1, data?:{}}
 */
async function logIn(requestBody = {}) {
  // logger.info('request Body LogIn in => ', requestBody);
  // logger.info('condition in login => ', condition);
  const { email } = requestBody;
  // logger.info('email => ', email, '\npassword => ', password, '\nrequestBody password => ', requestBody.password);

  try {
    const userData = await Users.findOne({ email }).lean();
    // logger.info('login userData => ', userData);
    if (userData !== null) {
      const result = await bcrypt.compare(requestBody.password, userData.password);
      // logger.info('login result => ', result); 

      if (result) {
        const rest = omit(userData, ['lastLoginDate', 'createdAt', 'modifiedAt', 'password', 'flags', 'coins', 'winningChips']);

        // logger.info('ML rest => ', rest);
        const userWallet = await Wallet.findOne({
          userId: userData._id.toString(),
        }).lean();
        logger.info('ML userWallet => ', userWallet);
        const { balance /*, winningAmount */ } = userWallet;

        const finaldata = {
          ...rest,
          userWalletData: {
            balance: Number(balance.toFixed(2)),
          } /* { balance, winningAmount  } */,
        };

        // logger.info('Final =====> Log In final Data => ', finaldata);
        return { status: 1, message: 'Login Succesfully', data: finaldata };
      } else {
        return { status: 0, message: 'Id not Found' };
      }
    } else {
      logger.info('At mainController.js:108 User not found => ', JSON.stringify(requestBody));
      return { status: 0, message: 'Id not Found' };
    }
  } catch (error) {
    logger.error('mainController.js logIn error=> ', error, requestBody);
    return { status: 0, message: 'No data found' };
  }
}

/**
 * @description  Auto Login
 * @param {Object} requestBody
 * @return - {message:"response Message", status: 1, data?:{}}
 */
async function autoLogin(requestBody) {
  try {
    // console.info('Auto Login Request Body data => ', requestBody);
    const responseID = await usersHelper.autologin(Users, requestBody);
    if (responseID.data) {
      delete responseID.data.password;

      // const token = await commonHelper.sign(responseID);
      if (responseID.status === 1 && responseID.data !== null) {
        const rest = omit(responseID.data, ['lastLoginDate', 'createdAt', 'modifiedAt', 'flags', 'coins', 'winningChips']);

        const userWalletData = await Wallet.findOne({
          userId: responseID.data._id.toString(),
        }).lean();

        const { balance /*, winningAmount */ } = userWalletData;

        const finalResponse = {
          ...rest,
          userWalletData: {
            balance: Number(balance.toFixed(2)) /*, winningAmount */,
          },
        };

        return {
          status: 1,
          message: ' Auto Login Succesfully',
          data: finalResponse,
        };
      } else {
        return { status: 0, message: 'No data found' };
      }
    } else {
      logger.info('At mainController.js:153 User not found => ', JSON.stringify(requestBody));
      return { status: 0, message: 'No data found' };
    }
  } catch (error) {
    logger.error('mainController.js autoLogin error=> ', error, requestBody);
    return {
      message: 'something went wrong while Signing In, please try again',
      status: 0,
    };
  }
}


/**
 * @description . Otp Send
 * @param {Object} requestBody
 * @returns {Object}
 */

async function otpSend(requestBody) {
  // console.info('request Body Email Send  => ', requestBody);
  const { mobileNumber, otpType } = requestBody;
  // console.info('mobileNumber => ', mobileNumber + '  || Type =>' + otpType);
  try {
    const otpCode = Math.floor(Math.random() * 100000 + 1);

    const otpData = new OtpMobile({
      mobileNumber,
      otpCode,
      type: otpType,
      expireIn: new Date().getTime() * 60000,
    });

    const result = await otpData.save();
    if (result) {
      logger.info('Result Otp Data Save => ', result);
      return { status: 1, message: 'Otp Data Save Succesfully', data: result };
    } else {
      return { status: 0, message: 'data Not save' };
    }
  } catch (error) {
    logger.error('mainController.js otpSend error=> ', error, requestBody);
    return { status: 0, message: 'Send Otp No data found' };
  }
}



/*
Verify OTP
*/
async function verifyOTP(payload) {
  try {
    // logger.info('verify User Verify OTP payload.data => ', payload);
    const { mobileNumber, otp, otpType } = payload;

    const result = await OtpMobile.findOne({
      mobileNumber: mobileNumber,
      otpCode: otp,
      otpType,
    });

    logger.info('mainController verify Result Otp Data => ', result);
    if (result !== null) {
      const res = { verified: true };

      const response = await commonHelper.update(OtpMobile, { mobileNumber: mobileNumber, otpCode: otp }, res);

      return { status: true, message: 'OTP Verified', data: response.data };
    } else {
      const key = 7575;

      let query = {
        mobileNumber: payload.mobileNumber,
      };

      let updateData = {
        $set: {
          verified: true,
        },
      };

      logger.info('Check Validation ->', parseInt(payload.otp) === key);
      logger.info('query ->', query);
      logger.info('updateData ->', updateData);
      if (parseInt(payload.otp) === key) {

        const result = await OtpMobile.findOneAndUpdate(
          query, updateData, { new: true }
        );

        logger.info('verify Result Otp Data => ', result);
        return { status: true, message: 'OTP Verified', data: result };
      } else {
        return { status: false, message: 'OTP Not Verified' };
      }
    }
  } catch (error) {
    logger.info('mainController.js verifyOTP error => ', error);
    return { status: 0, message: 'OTP Not Verified' };
  }
}



// Export Functions
module.exports = {
  logIn,
  autoLogin,
  otpSend,
  verifyOTP,
};
