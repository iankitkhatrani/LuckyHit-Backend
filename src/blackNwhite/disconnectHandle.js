const mongoose = require('mongoose');
const MongoID = mongoose.Types.ObjectId;
const PlayingTables = mongoose.model("blackNwhiteTables");
const logger = require('../../logger');
const CONST = require('../../constant');
const leaveTableActions = require('./leaveTable');

//const { AddTime, setDelay } = require('./socketFunctions');

module.exports.disconnectTableHandle = async (client) => {
  try {
    logger.info('disconnectTableHandle client.uid =>: ', client.uid);
    logger.info('disconnectTableHandle client.tbid =>: ', client.tbid);

    if (typeof client.uid !== 'undefined') {
      const whe = {
        _id: MongoID(client.tbid),
      };

      const tabInfo = await PlayingTables.findOne(whe, {}).lean();
      logger.info('Find Table when user Disconnect =>', tabInfo);

      if (tabInfo === null) return false;

      if (tabInfo.gamePlayType === CONST.GAME_TYPE.POINT_RUMMY) {

        let wh = {
          _id: MongoID(client.tbid.toString()),
          'playerInfo._id': MongoID(client.uid.toString()),
        };

        const project = {
          'playerInfo.$': 1,
        };

        const tbInfo = await PlayingTables.findOne(wh, project);
        logger.info('check user rejoin status', tbInfo);

        if (tbInfo !== null && tabInfo.playerInfo[0].rejoin !== true) {
          await leaveTableActions.leaveTable(
            {
              reason: 'userDisconnect',
            },
            {
              uid: tbInfo.playerInfo[0]._id.toString(),
              tbid: tbInfo._id.toString(),
              seatIndex: tbInfo.playerInfo[0].seatIndex,
              sck: tbInfo.playerInfo[0].sck,
            }
          );
        } else {
          let updateData = {
            ['playerInfo.$.rejoin']: false,
          };

          let tabInfo = await PlayingTables.findOneAndUpdate(wh, updateData, {
            new: true,
          });

          logger.info('else  update table :: ', tabInfo);
          return tabInfo;
        }
      }
    } else {
      logger.info('Client Socket Id Not found : ', client.uid);
      return;
    }
  } catch (e) {
    logger.info('disconnectHandle.js disconnectTableHandle error => ', e);
  }
};

module.exports.findDisconnectTable = async (userId, Table) => {
  logger.info("userId , Table -->", Table, userId)
  try {
    if (userId) {
      const wh = {
        'playerInfo._id': MongoID(userId),
      };

      const project = {
        'playerInfo.$': 1,
      };

      const tbInfo = await Table.findOne(wh, project);
      logger.info('find Disconnect Table userId not found : ', tbInfo);

      return tbInfo;
    } else {
      logger.info('find Disconnect Table userId not found : ', userId);
      return;
    }
  } catch (e) {
    logger.error('disconnectHandle.js find Disconnect error => ', e, userId);
  }
};

//module.exports = { disconnectTableHandle, findDisconnectTable };