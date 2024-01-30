const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const MongoID = mongoose.Types.ObjectId;
const GameUser = mongoose.model('users');
const IdCounter = mongoose.model('idCounter');
//const bcrypt = require('bcrypt');
const CONST = require('../../../constant');
const logger = require('../../../logger');

const commandAcions = require('../socketFunctions');

module.exports.appLunchDetails = async (requestData, client) => {
  let { playerId, mobileNumber } = requestData;
  let query = { _id: playerId.toString() };
  let result = await GameUser.findOne(query, {});
  if (result) {
    await this.userSesssionSet(result, client);

    let response = await this.filterBeforeSendSPEvent(result);
    //logger.info('Guest Final response Dashboard', response);
    commandAcions.sendEvent(client, CONST.DASHBOARD, response);
  } else {
    commandAcions.sendEvent(client, CONST.DASHBOARD, {}, false, 'Please register the user first');
    return false;
  }

  return true;
};

module.exports.referralReward = async (referal_code) => {
  let wh = {
    referal_code: referal_code,
  };

  let res = await GameUser.findOne(wh, {});
  logger.info('referralReward res : ', res);

  if (res !== null) {
    // await UserReferTracks.create({
    //   // eslint-disable-next-line no-undef
    //   user_id: MongoID(userData._id.toString()),
    //   rId: MongoID(res._id.toString()),
    // });
    // let reward = await bonusActions.getReferalBonus({
    //     referCounter : urc
    // })

    // if(reward.otc > 0){
         await walletActions.addWalletBonus(res._id.toString(), Number(reward.otc),2, "friend signup otc", res);
    // }else{
    //     return false;
    // }
    return true;
  } else {
    return false;
  }
};

module.exports.getUserDefaultFields = async (data, client) => {
  logger.info('getUserDefaultFields get User Default Fields -->', data);

  console.log("data password  1-->", data.password);
  const hashedPassword = await bcrypt.hash(data.password, 10)
  data.password = hashedPassword;
  console.log("data password  2-->", data.password);

  const setUserDetail = {
    id: 0,
    deviceId: data.deviceId,
    username: data.username ? data.username : '',
    name: data.name ? data.name : '',
    status: data.status ? data.status : '',
    mobileNumber: data.mobileNumber ? data.mobileNumber : '',
    email: data.email ? data.email : '',
    password: data.password ? data.password : '',
    isVIP: data.isVIP ? 1 : 0,
    Iscom: data.Iscom ? 1 : 0,
    uniqueId: '',
    loginType: data.loginType,
    avatar: data.avatar,
    chips: 20000,
    winningChips: 0,
    flags: {
      isOnline: 1, //is Online
    },
    counters: {
      gameWin: 0,
      gameLoss: 0,
      totalMatch: 0,
    },
    referralCode: '',
    tableId: '',
    sckId: client && client.id ? client.id : '',
  };

  return setUserDetail;
};

module.exports.getReferralCode = async (length) => {
  let result = '';
  let characters = 'qwertyuipasdfghkjlzxcvbnmQWERTYUIPASDFGHJKLZXCVBNM';
  for (let i = 0; i < length - 1; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  let digit = '123456789';
  for (let i = result.length; i < length; i++) {
    result += digit.charAt(Math.floor(Math.random() * digit.length));
  }
  let parts = result.split('');
  for (let i = parts.length; i > 0;) {
    let random = parseInt(Math.random() * i);
    let temp = parts[--i];
    parts[i] = parts[random];
    parts[random] = temp;
  }
  let newRfc = parts.join('');
  //logger.info('getReferralCode :newRfc ------->', newRfc.toLowerCase());
  return newRfc.toLowerCase();
};

module.exports.saveGameUser = async (userInfoDetails, client) => {
  let userInfo = userInfoDetails;
  try {
    const uCounter = await this.getCountDetails('gameusers');
    logger.info('saveGameUser uCounter :: ', uCounter);

    let number = '000000000000' + Number(uCounter);
    logger.info('saveGameUser number : ', number);

    number = number.slice(-10);

    let uniqueId = 'USER_' + number;

    userInfo.id = uCounter;
    userInfo.username = 'USER_' + uCounter;
    userInfo.uniqueId = uniqueId;
    userInfo.referralCode= "R"+this.GetRandomInt(0,9)+"S"+uCounter;

    logger.info('saveGameUser uniqueId ::', userInfo.uniqueId, userInfo.id);
    logger.info('\nsaveGameUser userInfo :: ', userInfo);

    let insertRes = await GameUser.create(userInfo);

    if (Object.keys(insertRes).length > 0) {
      return insertRes;
    } else {
      logger.info('\nsaveGameUser Error :: ', insertRes);
      return this.saveGameUser(userInfo, client);
    }
  } catch (e) {
    logger.info('saveGameUser : 1 : Exception :', e);
  }
};

module.exports.getCountDetails = async (type) => {
  logger.info(' getCountDetails Type ==>', type);
  try {
    let wh = {
      type: type,
    };

    let update = {
      $set: {
        type: type,
      },
      $inc: {
        counter: 1,
      },
    };
    logger.info('\ngetUserCount wh : ', wh, update);

    let resp2 = await IdCounter.findOneAndUpdate(wh, update, { upsert: true, new: true });
    return resp2.counter;
  } catch (error) {
    logger.error(' get Count Error =>', error);
  }
};

module.exports.userSesssionSet = async (userData, client) => {
  //logger.info('Redis User Session ', userData);
  try {
    client.uid = userData._id.toString();
    client.uniqueId = userData.uniqueId;

    // eslint-disable-next-line no-unused-vars
    let redisSet = {
      _id: userData._id.toString(),
      uid: userData.id,
      mobileNumber: userData.mobileNumber,
      uniqueId: userData.uniqueId,
    };

    const { _id, uniqueId, mobileNumber, email } = userData;

    rclient.hmset(`socket-${_id.toString()}`, 'socketId', client.id.toString(), 'userId', _id.toString(), 'mobileNumber', mobileNumber, 'uniqueId', uniqueId, 'email', email);

    let wh = {
      _id: userData._id,
    };

    let update = {
      $set: {
        sckId: client.id,
      },

    };
    logger.info('\nuserSesssionSet wh : ', wh, update);

    let res = await GameUser.findOneAndUpdate(wh, update, { upsert: true, new: true });
    logger.info('\n userSesssionSet result  : ', res);
    return true;
  } catch (e) {
    logger.info('user Session -->', e);
  }
};

module.exports.filterBeforeSendSPEvent = async (userData) => {
  //logger.info('filter Before Send SP Event filterBeforeSendSPEvent -->', userData);

  let res = {
    _id: userData._id,
    name: userData.name,
    username: userData.username,
    mobileNumber: userData.mobileNumber,
    avatar: userData.avatar,
    loginType: userData.loginType,
    uniqueId: userData.uniqueId,
    deviceId: userData.deviceId,
    chips: userData.chips,
    winningChips: userData.winningChips,
    tableId: userData.tableId || 0,
    createdAt: userData.createdAt,
    profileUrl: userData.profileUrl,
    referralCode:userData.referralCode
  };

  //logger.info('filter Before Send SP Event -->', res);
  return res;
};


module.exports.GetRandomInt=(min,max)=>{
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
