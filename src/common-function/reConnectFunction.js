const { findDisconnectTable } = require('../helper/disconnectHandle');
const CONST = require('../../constant');
const logger = require('../../logger');
const { reconnect } = require('./reconnect');
const { GetRandomString, socketUserRedis } = require('../helper/socketFunctions');
const schedule = require('node-schedule');
const mongoose = require('mongoose');
const MongoID = mongoose.Types.ObjectId;
const PlayingTables = mongoose.model("rummyPlayingTables");

const userReconnect = async (payload, socket) => {
  try {
    //logger.info('User Reconnect Payload ', payload, '\n<==== New Connected Socket id ===>', socket.id, '\n Table Id =>', socket.tbid, '\n Socket Id', socket);

    const disconnTable = await findDisconnectTable(payload.playerId, PlayingTables);
    logger.info('\n finded disconnected  -->', disconnTable);

    // set in redis
    if (disconnTable) {
      try {
        let updateStatus = await updateRejoinStatus(payload, disconnTable);
        logger.info('update reJoin status', updateStatus);

        const plInfo = disconnTable.playerInfo[0];
        logger.info('\n plInfo  -->', plInfo, '\n disconnTable._id  -->', disconnTable._id + '\n plInfo._id  -->', plInfo._id);

        const jobId = GetRandomString(6);
        await rClient.hmset(jobId.toString(), 'tableId', disconnTable._id.toString(), 'playerId', plInfo._id.toString(), 'plseat', plInfo.seatIndex);

        socketUserRedis({
          userId: plInfo._id,
          sckId: socket.id,
        });

        await rClient.hmset(`socket-${plInfo._id.toString()}`, 'socketId', socket.id.toString(), 'userId', plInfo._id.toString());

        let jobsId = CONST.DISCONNECT + plInfo._id;

        //await clearJob(jobsId);
        logger.info('RECONNECT USER JOB CANCELLED once user RECONNECT successfully typeof : ', jobsId, typeof jobsId);

        const cancelJobStatus = schedule.cancelJob(jobsId);
        logger.info('schedule USER Cancel JOB :--> ', cancelJobStatus, jobsId);

        await rClient.hmget(jobId.toString(), ['tableId', 'playerId', 'plseat'], async (err, res) => {
          if (err) {
            logger.error('hmget err  -->', err);
          }
          logger.info('res[1]  -->', res[1], ' \n res[0]  -->', res[0], '\n | socket Id ==>', socket.id);
          if (payload.playerId === res[1]) {
            socket.uid = `${payload.playerId}`;
            socket.sck = socket.id;
            socket.tbid = res[0];
            socket.seatIndex = parseInt(res[2]);
            socket.join(socket.tbid.toString());
            await updateScoketId({ playerId: socket.uid, sck: socket.id }, disconnTable);
            await reconnect(payload, socket);
          } else {
            logger.info('player id not matched');
          }
        });
        await rClient.hdel(jobId.toString(), ['tableId', 'playerId', 'plseat']);
        return;
      } catch (err) {
        logger.info('disconnTable Error ', err);
      }
    } else {
      logger.info('table not found ===--==-==-- >');
    }
    await reconnect(payload, socket);
  } catch (error) {
    logger.error('socketServer.js SEND_MESSAGE_TO_TABLE => ', error);
  }
};


const updateRejoinStatus = async (payload, table) => {
  try {
    let { playerId } = payload;
    if (table) {
      const wh = {
        'playerInfo._id': MongoID(playerId.toString()),
      };

      const project = {
        'playerInfo.$': 1,
      };

      let tabInfo = await PlayingTables.findOne(wh, project);
      logger.info('updateRejoinStatus tabInfo :: ', tabInfo);

      let upWh = {
        _id: MongoID(tabInfo._id.toString()),
        'playerInfo._id': MongoID(playerId.toString()),
      };

      let updateData = {
        ['playerInfo.$.rejoin']: true,
      };
      //['playerInfo.$.rejoin'] = true;
      //updateData.$set['playerInfo.$.sck'] = socket.id;
      //updateData.$set['playerInfo.$.playerSocketId'] = socket.id;

      tabInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, {
        new: true,
      });
      logger.info('update rejoin user update table :: ', tabInfo);
      return tabInfo;
    } else {
      logger.info(' Table not found');
      return;
    }
  } catch (error) {
    logger.info('socket-server updateRejoinStatus error=>', error);
  }
};

const updateSocketStatus = async (payload, table, socket) => {
  try {
    let { playerId } = payload;
    if (table) {
      const wh = {
        'playerInfo._id': MongoID(playerId.toString()),
      };

      const project = {
        'playerInfo.$': 1,
      };

      let tabInfo = await PlayingTables.findOne(wh, project);
      logger.info('updateRejoinStatus tabInfo :: ', tabInfo);

      let upWh = {
        _id: MongoID(tabInfo._id.toString()),
        'playerInfo._id': MongoID(playerId.toString()),
      };

      let updateData = {
        ['playerInfo.$.rejoin']: true,
        ['playerInfo.$.sck']: socket.id,
        ['playerInfo.$.playerSocketId']: socket.id,
      };

      tabInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, {
        new: true,
      });
      logger.info('update updateSocketStatus :: ', tabInfo);
      return tabInfo;
    } else {
      logger.info(' Table not found');
      return;
    }
  } catch (error) {
    logger.info('socket-server updateSocketStatus error=>', error);
  }
};

const updateScoketId = async (payload, table) => {
  try {
    logger.info('\n Update SocketId Payload =>', payload);
    let { playerId, sck } = payload;
    if (table) {
      const wh = {
        'playerInfo._id': MongoID(playerId.toString()),
      };

      const project = {
        'playerInfo.$': 1,
      };

      let tabInfo = await PlayingTables.findOne(wh, project);
      logger.info('updateRejoinStatus tabInfo :: ', tabInfo);

      let upWh = {
        _id: MongoID(tabInfo._id.toString()),
        'playerInfo._id': MongoID(playerId.toString()),
      };

      let updateData = {
        ['playerInfo.$.sck']: sck,
        ['playerInfo.$.playerSocketId']: sck,
      };

      tabInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, {
        new: true,
      });
      logger.info('updateScoketId table :: ', tabInfo);
      return tabInfo;
    } else {
      logger.info(' Table not found');
      return;
    }
  } catch (error) {
    logger.info('socket-server updateRejoinStatus error=>', error);
  }
};

const takeSeat = async (payload, socket) => {
  try {
    logger.info('User takeSeat Payload ', payload, '\n<==== takeSeat Connected Socket id ===>', socket.id, '\n Table Id =>', socket.tbid, '\n Socket Id');


    const disconnTable = await findDisconnectTable(payload.playerId, PlayingTables);
    logger.info('\n takeSeat finded disconnected  -->', disconnTable);

    // set in redis
    if (disconnTable) {
      try {
        const updateStatus = await updateSocketStatus(payload, disconnTable, socket);
        logger.info('takeSeat update reJoin status', updateStatus);

        const plInfo = disconnTable.playerInfo[0];
        logger.info('\ntakeSeat plInfo  -->', plInfo, '\n disconnTable._id  -->', disconnTable._id + '\n plInfo._id  -->', plInfo._id);

        const jobId = GetRandomString(6);
        await rClient.hmset(jobId.toString(), 'tableId', disconnTable._id.toString(), 'playerId', plInfo._id.toString(), 'plseat', plInfo.seatIndex);

        socketUserRedis({
          userId: plInfo._id,
          sckId: socket.id,
        });

        await rClient.hmset(`socket-${plInfo._id.toString()}`, 'socketId', socket.id.toString(), 'userId', plInfo._id.toString());

        const jobsId = CONST.DISCONNECT + plInfo._id;

        //await clearJob(jobsId);
        logger.info('takeSeat USER JOB CANCELLED once user takeSeat successfully typeof : ', jobsId, typeof jobsId);

        const cancelJobStatus = schedule.cancelJob(jobsId);
        logger.info('takeSeat schedule USER Cancel JOB :--> ', cancelJobStatus, jobsId);

        await rClient.hmget(jobId.toString(), ['tableId', 'playerId', 'plseat'], async (err, res) => {
          if (err) {
            logger.error('hmget err  -->', err);
          }
          logger.info('res[1]  -->', res[1], ' \n res[0]  -->', res[0], '\n | socket Id ==>', socket.id);
          if (payload.playerId === res[1]) {
            socket.uid = `${payload.playerId}`;
            socket.sck = socket.id;
            socket.tbid = res[0];
            socket.seatIndex = parseInt(res[2]);
            socket.join(socket.tbid.toString());
            await updateScoketId({ playerId: socket.uid, sck: socket.id }, disconnTable);
            await userTakeSeat(payload, socket);
          } else {
            logger.info('player id not matched');
          }
        });
        await rClient.hdel(jobId.toString(), ['tableId', 'playerId', 'plseat']);
        return;
      } catch (err) {
        logger.info('takeSeat disconnTable Error ', err);
      }
    } else {
      logger.info('takeSeat table not found ===--==-==-- >');
    }
    await userTakeSeat(payload, socket);
  } catch (error) {
    logger.error('socketServer.js SEND_MESSAGE_TO_TABLE => ', error);
  }
};

module.exports = { userReconnect, takeSeat };
