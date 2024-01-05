const mongoose = require('mongoose');
const { omit } = require('lodash');

const CONST = require('../../constant');
const logger = require('../../logger');
const commonHelper = require('../helper/commonHelper');
const { sendDirectEvent, getPlayingUserInRound } = require('../helper/socketFunctions');
const { filterBeforeSendSPEvent } = require('../helper/signups/appStart');

const Users = mongoose.model('users');
const AviatorTables = mongoose.model('aviatorTables');
const MongoID = mongoose.Types.ObjectId;

module.exports.
    reconnect = async (requestData, client) => {
        try {
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

                    sendDirectEvent(client.id.toString(), CONST.RECONNECT, response);
                    return false;
                }


                //when player in table
                const wh = {
                    _id: MongoID(client.tbid),
                };

                const project = {};
                const tabInfo = await AviatorTables.findOne(wh, project).lean();

                if (tabInfo === null) {
                    const response = {
                        login: true,
                        userInfo: finaldata,
                        sceneName: CONST.DASHBOARD,
                    };

                    sendDirectEvent(client.id.toString(), CONST.RECONNECT, response);
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
                    sceneName: CONST.GAMEPLAY,
                    rendomNumber: tabInfo.rendomNumber,
                };

                console.log("response ",response)

                if (tabInfo.gameState === "StartEviator") {
                    let currentDateTime = new Date();
                    let time = currentDateTime.getSeconds();

                    let turnTime = new Date(tabInfo.aviatorDate);
                    let Gtime = turnTime.getSeconds();
                    let diff = Gtime - time;

                    const responseRS = {
                        ...response,
                        currentTurnUserSeatIndex: tabInfo.turnSeatIndex,
                        currentTurnTimer: GetTimeDifference(new Date(tabInfo.aviatorDate),currentDateTime),
                        aviatorDate:new Date(tabInfo.aviatorDate),
                        currentDateTime:currentDateTime
                    };

                    console.log("responseRS ",responseRS)
                    console.log("Diffr  ",GetTimeDifference(new Date(tabInfo.aviatorDate),currentDateTime))

                    console.log("currentDateTime - turnTime ",currentDateTime , turnTime)



                    sendDirectEvent(client.id.toString(), CONST.RECONNECT, responseRS);
                } else if (tabInfo.gameState === "GameStartTimer") {
                    let currentDateTime = new Date();
                    let time = currentDateTime.getSeconds();
                    let turnTime = new Date(tabInfo.gameTimer.GST);
                    let Gtime = turnTime.getSeconds();
                    let diff = Gtime - time;

                    const responseRST = {
                        ...response,
                        timer: diff,
                    };

                    sendDirectEvent(client.id.toString(), CONST.RECONNECT, responseRST);
                }  else {
                    sendDirectEvent(client.id.toString(), CONST.RECONNECT, response);
                }
                return;
            } else {
                const response = {
                    login: false,
                    sceneName: CONST.DASHBOARD,
                };
                sendDirectEvent(client.id, CONST.RECONNECT, response, {
                    flag: false,
                    msg: 'Player Id not found!',
                });
                return false;
            }
        } catch (e) {
            logger.error('Reconnect.js Exception Reconnect  => ', e);
        }
    };

    GetTimeDifference=  (startDate, endDate, type) => {
        var date1 = new Date(startDate);
        var date2 = new Date(endDate);
        
        var diffMs = (date2 - date1); 
        if (type == 'day') {
            var date1 = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0);
            var date2 = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 0, 0, 0);
            var timeDiff = Math.abs(date2.getTime() - date1.getTime());
            var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
            return diffDays;
        } else if (type == 'hour')
            return Math.round((diffMs % 86400000) / 3600000);
        else if (type == 'minute')
            return Math.round(((diffMs % 86400000) % 3600000) / 60000);
        else
            return Math.round((diffMs / 1000));
    }