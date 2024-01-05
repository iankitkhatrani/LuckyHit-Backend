const mongoose = require('mongoose');
const MongoID = mongoose.Types.ObjectId;
const AviatorTables = mongoose.model("aviatorTables");
const BlackNwhiteTables = mongoose.model("blackNwhiteTables");

const logger = require('../../logger');
const CONST = require('../../constant');
const leaveTableActions = require('./leaveTable');
const BNWleaveTableActions = require('../blackNwhite/leaveTable');

//const { AddTime, setDelay } = require('./socketFunctions');

module.exports.disconnectTableHandle = async (client) => {
  try {
    logger.info('disconnectTableHandle client.uid =>: ', client.uid);
    logger.info('disconnectTableHandle client.tbid =>: ', client.tbid);

    if (typeof client.uid !== 'undefined') {
      const whe = {
        _id: MongoID(client.tbid),
      };

      let tabInfo = await AviatorTables.findOne(whe, {}).lean();
      logger.info('Find Table when user Disconnect =>', tabInfo);

      if (tabInfo === null) {
        tabInfo = await BlackNwhiteTables.findOne(whe, {}).lean();
        logger.info('BNW Find Table when user Disconnect =>', tabInfo);

        if (tabInfo === null) {
          return false;
        }
        let whB = {
          _id: MongoID(client.tbid.toString()),
          'playerInfo._id': MongoID(client.uid.toString()),
        };

        const projectB = {
          'playerInfo.$': 1,
        };

        const tblInfo = await BlackNwhiteTables.findOne(whB, projectB);
        logger.info('BNW check user rejoin status', tblInfo);

        if (tblInfo !== null && tblInfo.playerInfo[0].rejoin !== true) {
          await BNWleaveTableActions.leaveTable(
            {
              reason: 'userDisconnect',
            },
            {
              uid: tblInfo.playerInfo[0]._id.toString(),
              tbid: tblInfo._id.toString(),
              seatIndex: tblInfo.playerInfo[0].seatIndex,
              sck: tblInfo.playerInfo[0].sck,
            }
          );
        } else {
          let updateData = {
            ['playerInfo.$.rejoin']: false,
          };

          let tablInfo = await BlackNwhiteTables.findOneAndUpdate(wh, updateData, {
            new: true,
          });

          logger.info('BNW else  update table :: ', tablInfo);
          return tablInfo;
        }

      }

      let wh = {
        _id: MongoID(client.tbid.toString()),
        'playerInfo._id': MongoID(client.uid.toString()),
      };

      const project = {
        'playerInfo.$': 1,
      };

      const tbInfo = await AviatorTables.findOne(wh, project);
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

        let tabInfo = await AviatorTables.findOneAndUpdate(wh, updateData, {
          new: true,
        });

        logger.info('else  update table :: ', tabInfo);
        return tabInfo;
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
  try {
    if (userId) {
      const wh = {
        'playerInfo._id': MongoID(userId),
      };

      const project = {
        'playerInfo.$': 1,
      };

      const tbInfo = await Table.findOne(wh, project);

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