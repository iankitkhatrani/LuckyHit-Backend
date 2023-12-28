const mongoose = require('mongoose');
const { omit } = require('lodash');

const CONST = require('../../constant');
const logger = require('../../logger');
const commonHelper = require('../helper/commonHelper');
const { sendDirectEvent, getPlayingUserInRound } = require('../helper/socketFunctions');
const { filterBeforeSendSPEvent } = require('../helper/signups/appStart');

const Users = mongoose.model('users');
const PlayingTables = mongoose.model('blackNwhiteTables');
const MongoID = mongoose.Types.ObjectId;

module.exports.reconnect = async (requestData, client) => {
    try {
        logger.info('BNW reconnect User Info : ', JSON.stringify(requestData));

        if (requestData.playerId !== '' && requestData.playerId !== null && requestData.playerId !== undefined) {
            let gwh = {
                _id: commonHelper.strToMongoDb(requestData.playerId),
            };

            let userInfo = await Users.findOne(gwh, {}).lean();
            logger.info('reconnect User Info : ', JSON.stringify(userInfo));

            const newData = omit(userInfo, ['lastLoginDate', 'createdAt', 'modifiedAt', 'password', 'flags']);
            //logger.info('newData ->', newData);

            const finaldata = {
                ...newData,
            };
            logger.info('Reconnect Final Data => ', finaldata);
            let responseResult = await filterBeforeSendSPEvent(finaldata);

            if (requestData.tableId == '') {
                const response = {
                    login: true,
                    ...responseResult,
                    sceneName: CONST.DASHBOARD,

                };

                sendDirectEvent(client.id.toString(), CONST.BNW_RECONNECT, response);
                return false;
            }


            //when player in table
            const wh = {
                _id: MongoID(client.tbid),
            };

            const project = {};
            const tabInfo = await PlayingTables.findOne(wh, project).lean();

            if (tabInfo === null) {
                const response = {
                    login: true,
                    userInfo: finaldata,
                    sceneName: CONST.DASHBOARD,
                };

                sendDirectEvent(client.id.toString(), CONST.BNW_RECONNECT, response);
                return false;
            }

            const playerInGame = await getPlayingUserInRound(tabInfo.playerInfo);

            const response = {
                pi: tabInfo.playerInfo,
                spi: client.uid,
                gameState: tabInfo.gameState,
                ap: playerInGame.length,
                tableid: tabInfo._id,
                gamePlayType: tabInfo.gamePlayType,
                sceneName: CONST.BNW_GAMEPLAY,
            };

            if (tabInfo.gameState === "GameStartTimer") {
                let currentDateTime = new Date();
                let time = currentDateTime.getSeconds();
                let turnTime = new Date(tabInfo.gameTimer.GST);
                let Gtime = turnTime.getSeconds();
                let diff = Gtime - time;

                const responseRST = {
                    ...response,
                    timer: diff,
                };

                sendDirectEvent(client.id.toString(), CONST.BNW_RECONNECT, responseRST);
            } else {
                sendDirectEvent(client.id.toString(), CONST.BNW_RECONNECT, response);
            }
            return;
        } else {
            const response = {
                login: false,
                sceneName: CONST.DASHBOARD,
            };
            sendDirectEvent(client.id, CONST.BNW_RECONNECT, response, {
                flag: false,
                msg: 'Player Id not found!',
            });
            return false;
        }
    } catch (e) {
        logger.error('Reconnect.js Exception Reconnect  => ', e);
    }
};
