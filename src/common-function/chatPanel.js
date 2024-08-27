const mongoose = require('mongoose');
const MongoID = mongoose.Types.ObjectId;
const PlayingTables = mongoose.model('playingTables');

const commandAcions = require('../helper/socketFunctions');
const CONST = require('../../constant');
const logger = require('../../logger');
const { ifSocketDefine } = require('../helper/helperFunction');

module.exports.chatPanel = async (requestData, client) => {
  try {
    if (!ifSocketDefine(requestData, client, CONST.SEND_MESSAGE_TO_TABLE)) {
      return false;
    }

    const wh = {
      _id: MongoID(client.tbid.toString()),
    };

    const project = {};
    const tabInfo = await PlayingTables.findOne(wh, project).lean();

    if (tabInfo === null) {
      logger.info('chatPanel user not turn ::', tabInfo);
      return false;
    }

    let playerInfo = tabInfo.playerInfo[client.seatIndex];
    let playerName = tabInfo.playerInfo[client.seatIndex].name;
    let message = requestData.msg;

    const allmsg = {
      PN: playerName,
      PI: playerInfo._id,
      PM: message,
    };

    tabInfo.chatPanel.push(allmsg);

    const upWh = {
      _id: MongoID(client.tbid.toString()),
    };

    const updateData = {
      $set: {
        chatPanel: tabInfo.chatPanel,
      },
    };

    const tb = await PlayingTables.findOneAndUpdate(upWh, updateData, {
      new: true,
    });

    if (!tb) {
      logger.info('Player InValid tb : ', tb);
    }

    let response = {
      tableId: tabInfo._id,
      message: message,
      playerId: playerInfo._id,
    };
    commandAcions.sendEventInTable(tabInfo._id.toString(), CONST.SEND_MESSAGE_TO_TABLE, response);

    return true;
  } catch (e) {
    logger.info('Chatpanel.js  ChatPanel error=> : ', e);
  }
};

module.exports.openChatPanel = async (requestData, client) => {
  try {
    if (!ifSocketDefine(requestData, client, CONST.SEND_MESSAGE_TO_TABLE)) {
      return false;
    }

    const wh = {
      _id: MongoID(client.tbid.toString()),
    };

    const project = {};
    const tabInfo = await PlayingTables.findOne(wh, project).lean();

    if (tabInfo === null) {
      logger.info('openChatPanel user not turn ::', tabInfo);
      return false;
    }

    let playerInfo = tabInfo.playerInfo[client.seatIndex];
    if (!playerInfo) {
      logger.info('openChatPanel Info ::', playerInfo);
    }

    let response = {
      allmsg: tabInfo.chatPanel,
    };
    commandAcions.sendDirectEvent(client.sck, CONST.OPEN_CHAT_PANEL, response);

    return true;
  } catch (e) {
    logger.info('Chatpanel.js openChatPanel error=> : ', e);
  }
};
