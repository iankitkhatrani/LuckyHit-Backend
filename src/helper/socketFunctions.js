const randomString = require('randomstring');
const schedule = require('node-schedule');
const logger = require('../../logger');
const commonHelper = require('./commonHelper');
const { createClient } = require('redis');

module.exports.sendEvent = (socket, eventName, data = {}, flag, msg, rest = {}) => {
  try {
    // eslint-disable-next-line no-param-reassign
    flag = typeof flag === 'undefined' ? true : false;
    // eslint-disable-next-line no-param-reassign
    msg = msg || '';
    const response = { eventName, data, flag, msg, ...rest };
    const encryptedData = commonHelper.encrypt(response);
    logger.info('\nResponse Time :' + new Date() + ' : Data : ' + JSON.stringify(response));
    socket.emit('req', { payload: encryptedData });
  } catch (error) {
    logger.error('socketFunction.js sendEvent error :--> ' + error);
  }
};

module.exports.sendDirectEvent = (socketId, eventName, data = {}, flag, msg, rest = {}) => {
  try {
    // eslint-disable-next-line no-param-reassign
    flag = typeof flag === 'undefined' ? true : false;
    // eslint-disable-next-line no-param-reassign
    msg = msg || '';
    const response = { eventName, data, flag, msg, ...rest };
    logger.info('\nResponse Time :' + new Date() + ' : Data : ' + JSON.stringify(response));
    const encryptedData = commonHelper.encrypt(response);
    // eslint-disable-next-line no-undef
    io.to(socketId).emit('req', { payload: encryptedData });
  } catch (error) {
    logger.error('sendDirectEvent error :--> ' + error);
  }
};

module.exports.sendEventInTable = (tableId, eventName, data = {}, flag, msg, rest = {}) => {
  try {
    // eslint-disable-next-line no-param-reassign
    flag = typeof flag === 'undefined' ? true : false;
    // eslint-disable-next-line no-param-reassign
    msg = msg || '';
    const response = { eventName, data, flag, msg, ...rest };
    logger.info('\nResponse Time :' + new Date() + ' : Data : ' + JSON.stringify(response));
    const encryptedData = commonHelper.encrypt(response);
    // eslint-disable-next-line no-undef
    io.to(tableId).emit('req', { payload: encryptedData });
  } catch (error) {
    logger.error('socketFunction.js sendEventInTable error :--> ' + error);
  }
};

module.exports.setDelay = async (jid, timer) => {
  try {
    return new Promise((resolve) => {
      schedule.scheduleJob(jid, new Date(timer), function () {
        schedule.cancelJob(jid);
        resolve(true);
      });
    });
  } catch (error) {
    logger.error('socketFunction.js setDelay error :--> ' + error);
  }
};

module.exports.clearJob = async (jid) => {
  try {
    return new Promise((resolve) => {
      schedule.cancelJob(jid);
      resolve(true);
    });
  } catch (error) {
    logger.error('socketFunction.js clearJob error :--> ' + error);
  }
};

module.exports.AddTime = (t) => {
  try {
    const ut = new Date();
    ut.setSeconds(ut.getSeconds() + Number(t));
    return ut;
  } catch (error) {
    logger.error('socketFunction.js AddTime error :--> ' + error);
  }
};

module.exports.GetRandomString = (len) => {
  try {
    if (typeof len !== 'undefined') {
      if (len === 10) {
        // csl("GetRandomString 111");
        return randomString.generate(len + 5);
      } else {
        // csl("GetRandomString 222");
        return randomString.generate(len);
      }
    } else {
      // csl("GetRandomString 333");
      return randomString.generate(32);
    }
  } catch (error) {
    logger.error('socketFunction.js GetRandomString error :--> ' + error);
  }
};

module.exports.socketUserRedis = (obj) => {
  try {
    const { userId, sckId } = obj;
    let rdlClient = createClient();
    rdlClient.hmset(`socket-${userId.toString()}`, 'socketId', sckId.toString(), 'userId', userId.toString());
  } catch (error) {
    logger.error('socketFunction.js socketUserRedis error :--> ' + error);
  }
};


module.exports.getPlayingUserInRound = async (p) => {
  try {

    let pl = [];
    if (typeof p == 'undefined' || p == null)
      return pl;

    for (let x = 0; x < p.length; x++) {
      if (typeof p[x] == 'object' && p[x] != null && typeof p[x].seatIndex != 'undefined' && p[x].status == "play")
        pl.push(p[x]);
    }
    return pl;
  } catch (error) {
    logger.error('roundStart.js getPlayingUserInRound error : ', error);
  }
}
