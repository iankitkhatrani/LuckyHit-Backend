const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;

const PlayingTables = mongoose.model("blackNwhiteTables");
const GameUser = mongoose.model("users");
const MyBetTable = mongoose.model("myBetListBnW");


const CONST = require("../../constant");
const logger = require("../../logger");
const commandAcions = require("../helper/socketFunctions");
const walletActions = require("./updateWallet");
const { winnerViewResponseFilter } = require("./gameFinish");
/*
    bet : 10,
    actionplace:1 || 2
*/

module.exports.action = async (requestData, client) => {
    try {
        logger.info("Bnw action requestData : ", requestData);
        logger.info("Bnw action client.tbid: ", client.tbid);
        logger.info("Bnw action client.uid ", client.uid);
        logger.info("Bnw action client.seatIndex ", client.seatIndex);

        if (typeof client.tbid == "undefined" || typeof client.uid == "undefined" || typeof client.seatIndex == "undefined") {
            commandAcions.sendDirectEvent(client.sck, CONST.BNW_ACTION, requestData, false, "User session not set, please restart game!");
            return false;
        }

        client.action = true;

        let gwh = {
            _id: MongoID(client.uid)
        }
        let UserInfo = await GameUser.findOne(gwh, {}).lean();
        logger.info("action UserInfo : ", gwh, JSON.stringify(UserInfo));


        const wh = {
            _id: MongoID(client.tbid.toString()),
            // status: "StartBatting"
        }
        const project = {}
        let tabInfo = await PlayingTables.findOne(wh, project).lean();
        logger.info("action tabInfo : ", tabInfo);

        let totalWallet = Number(UserInfo.chips) + Number(UserInfo.winningChips)

        if (Number(requestData.betAmount) > Number(totalWallet)) {
            logger.info("action client.su ::", client.seatIndex);
            delete client.action;
            commandAcions.sendDirectEvent(client.sck, CONST.BNW_ACTION, requestData, false, "Please add wallet!!");
            return false;
        }
        requestData.betAmount = Number(Number(requestData.betAmount).toFixed(2))

        await walletActions.deductWallet(client.uid, -requestData.betAmount, 2, "blackNwhite", tabInfo, client.id, client.seatIndex);

        if (tabInfo == null) {
            logger.info("action user not turn ::", tabInfo);
            delete client.action;
            return false
        }

        let updateData = {
            $set: {},
            $inc: {},
        };

        if (requestData.type === 'Black') {
            let playerInfo = tabInfo.playerInfo[client.seatIndex];
            playerInfo.betLists.push(requestData);
            tabInfo.betLists.push(requestData);
            updateData.$set['playerInfo.$.betLists'] = playerInfo.betLists;
            updateData.$set['betLists'] = playerInfo.betLists;
            updateData.$inc['counters.totalBlackChips'] = requestData.betAmount;

            const upWh = {
                _id: MongoID(client.tbid.toString()),
                'playerInfo.seatIndex': Number(client.seatIndex),
            };

            tabInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, {
                new: true,
            });

            logger.info(" blackAmount table Info -->", tabInfo)
            commandAcions.sendEventInTable(tabInfo._id.toString(), CONST.BNW_BET_COUNTEING, { activePlayer: tabInfo.activePlayer, betAmount: requestData.betAmount, totalBlackChips: tabInfo.counters.totalBlackChips, playerId: client.uid, seatIndex: client.seatIndex, betType: requestData.type });

            await this.MybetInsertType(tabInfo.gameId, requestData.betAmount, requestData.type, client)

        } else if (requestData.type === 'White') {
            let playerInfo = tabInfo.playerInfo[client.seatIndex];
            playerInfo.betLists.push(requestData);
            tabInfo.betLists.push(requestData);
            updateData.$set['playerInfo.$.betLists'] = playerInfo.betLists;
            updateData.$set['betLists'] = playerInfo.betLists;
            updateData.$inc['counters.totalWhiteChips'] = requestData.betAmount;


            const upWh = {
                _id: MongoID(client.tbid.toString()),
                'playerInfo.seatIndex': Number(client.seatIndex),
            };

            tabInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, {
                new: true,
            });

            logger.info("whiteAmount table Info -->", tabInfo)

            commandAcions.sendEventInTable(tabInfo._id.toString(), CONST.BNW_BET_COUNTEING, { activePlayer: tabInfo.activePlayer, betAmount: requestData.betAmount, totalWhiteChips: tabInfo.counters.totalWhiteChips, playerId: client.uid, seatIndex: client.seatIndex, betType: requestData.type });
            await this.MybetInsertType(tabInfo.gameId, requestData.betAmount, requestData.type, client)

        } else if (requestData.type === 'LuckyHit') {
            let playerInfo = tabInfo.playerInfo[client.seatIndex];
            playerInfo.betLists.push(requestData);
            tabInfo.betLists.push(requestData);
            updateData.$set['playerInfo.$.betLists'] = playerInfo.betLists;
            updateData.$set['betLists'] = playerInfo.betLists;
            updateData.$inc['counters.totalHitChips'] = requestData.betAmount;

            const upWh = {
                _id: MongoID(client.tbid.toString()),
                'playerInfo.seatIndex': Number(client.seatIndex),
            };

            tabInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, {
                new: true,
            });

            logger.info(" luckyHitAmount table Info -->", tabInfo)
            commandAcions.sendEventInTable(tabInfo._id.toString(), CONST.BNW_BET_COUNTEING, { activePlayer: tabInfo.activePlayer, betAmount: requestData.betAmount, totalHitChips: tabInfo.counters.totalHitChips, playerId: client.uid, seatIndex: client.seatIndex, betType: requestData.type });

            await this.MybetInsertType(tabInfo.gameId, requestData.betAmount, requestData.type, client)
        }

        delete client.action;
        return true;
    } catch (e) {
        logger.info("Exception action : ", e);
    }
}

/*
    winamount : 10,
    actionplace:1 || 2
*/
module.exports.CHECKOUT = async (requestData, client) => {
    try {
        logger.info("check out requestData : ", requestData);
        if (typeof client.tbid == "undefined" || typeof client.uid == "undefined" || typeof client.seatIndex == "undefined" || typeof requestData.winamount == "undefined") {
            commandAcions.sendDirectEvent(client.sck, CONST.CHECKOUT, requestData, false, "User session not set, please restart game!");
            return false;
        }
        if (typeof client.action != "undefined" && client.action) return false;

        client.action = false;

        const wh = {
            _id: MongoID(client.tbid.toString()),
        }
        const project = {

        }
        const tabInfo = await PlayingTables.findOne(wh, project).lean();
        logger.info("check out tabInfo : ", tabInfo);

        if (tabInfo == null) {
            logger.info("check out user not turn ::", tabInfo);
            delete client.action;
            return false
        }
        if (tabInfo.turnDone) {
            logger.info("check out : client.su ::", client.seatIndex);
            delete client.action;
            commandAcions.sendDirectEvent(client.sck, CONST.CHECKOUT, requestData, false, "Turn is already taken!");
            return false;
        }


        let gwh = {
            _id: MongoID(client.uid)
        }
        let UserInfo = await GameUser.findOne(gwh, {}).lean();
        logger.info("check out UserInfo : ", gwh, JSON.stringify(UserInfo));

        let updateData = {
            $set: {

            }
        }
        updateData.$set["playerInfo.$.playStatus"] = "check out"

        winAmount = Number(Number(requestData.winamount).toFixed(2))

        await walletActions.deductWallet(client.uid, winAmount, 2, "aviator Win", tabInfo, client.id, client.seatIndex);

        if (requestData.actionplace == 1)
            updateData.$set["playerInfo.$.chalValue"] = 0;
        else
            updateData.$set["playerInfo.$.chalValue1"] = 0;


        updateData.$set["turnDone"] = true;
        commandAcions.clearJob(tabInfo.job_id);

        const upWh = {
            _id: MongoID(client.tbid.toString()),
            "playerInfo.seatIndex": Number(client.seatIndex)
        }
        logger.info("action upWh updateData :: ", upWh, updateData);

        const tb = await PlayingTables.findOneAndUpdate(upWh, updateData, { new: true });
        logger.info("action tb : ", tb);

        let response = {
            seatIndex: tb.turnSeatIndex,
            winamount: winAmount

        }
        commandAcions.sendEventInTable(tb._id.toString(), CONST.CHECKOUT, response);
        delete client.action;

        return true;
    } catch (e) {
        logger.info("Exception action : ", e);
    }
}

module.exports.winnerDeclareCall = async (tblInfo) => {
    const tabInfo = tblInfo;
    try {
        const tbid = tabInfo._id.toString();

        if (tabInfo.gameState === CONST.ROUND_END) return false;

        let updateData = {
            $set: {},
            $inc: {},
        };

        updateData.$set['isFinalWinner'] = true;
        updateData.$set['gameState'] = CONST.ROUND_END;
        updateData.$set['playerInfo.$.playerStatus'] = CONST.WON;

        const upWh = {
            _id: MongoID(tbid),
            'playerInfo.seatIndex': Number(tabInfo.playerInfo[tabInfo.currentPlayerTurnIndex].seatIndex),
        };

        const tbInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, {
            new: true,
        });
        logger.info('\n winnerDeclareCall tbInfo  ==>', tbInfo);

        const playerInGame = await getPlayingUserInRound(tbInfo.playerInfo);
        const table = await this.manageUserScore(playerInGame, tabInfo);
        logger.info('\n Final winnerDeclareCall tbInfo  ==>', tbInfo);

        let amount = (table.tableAmount * CONST.commission) / 100;
        table.tableAmount -= amount;

        updateData.$inc['playerInfo.$.gameChips'] = table.tableAmount;
        updateData.$set['tableAmount'] = table.tableAmount;

        const tableInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, {
            new: true,
        });

        for (let i = 0; i < playerInGame.length; i++) {
            tableInfo.gameTracks.push({
                _id: playerInGame[i]._id,
                username: playerInGame[i].username,
                seatIndex: playerInGame[i].seatIndex,
                cards: playerInGame[i].cards,
                gCard: playerInGame[i].gCard,
                gameChips: playerInGame[i].gameChips,
                point: playerInGame[i].point,
                gameBet: tableInfo.entryFee,
                result: playerInGame[i].playerStatus === CONST.WON ? CONST.WON : CONST.LOST,
            });
        }

        const winnerTrack = await gameTrackActions.gamePlayTracks(tableInfo.gameTracks, tableInfo);

        for (let i = 0; i < tableInfo.gameTracks.length; i++) {
            if (tableInfo.gameTracks[i].result === CONST.WON) {
                logger.info(' Add Win COunter');
                await walletActions.addWallet(tableInfo.gameTracks[i]._id, Number(winnerTrack.winningAmount), 'Credit', 'Win', tableInfo);
            }
        }

        const playersScoreBoard = await countPlayerScore(tableInfo);
        let winnerViewResponse = winnerViewResponseFilter(playersScoreBoard);

        const response = {
            playersScoreBoard: winnerViewResponse.userInfo,
            totalLostChips: tableInfo.tableAmount,
        };

        commandAcions.sendEventInTable(tableInfo._id.toString(), CONST.WIN, response);
        const gsbResponse = { ...response, wildCard: tableInfo.wildCard, gamePlayType: tableInfo.gamePlayType };

        const addLastScoreBoard = tableInfo.lastGameScoreBoard.push(gsbResponse);
        logger.info('addLastScoreBoard Score board ==>', addLastScoreBoard);

        const qu = {
            _id: MongoID(tbid),
        };

        let updatedata = {
            $set: {
                gameTracks: tableInfo.gameTracks,
                lastGameScoreBoard: tableInfo.lastGameScoreBoard,
            },
        };

        let tblInfo = await PlayingTables.findOneAndUpdate(qu, updatedata, { new: true });
        logger.info('set gamePlaytracks and pointPoolTable =>', tblInfo);

        let jobId = commandAcions.GetRandomString(10);
        let delay = commandAcions.AddTime(4);
        await commandAcions.setDelay(jobId, new Date(delay));

        commandAcions.sendEventInTable(tableInfo._id.toString(), CONST.GAME_SCORE_BOARD, gsbResponse);

        let gamePlayData = JSON.parse(JSON.stringify(tableInfo));
        const rest = omit(gamePlayData, ['_id']);
        let tableHistory = { ...rest, tableId: tableInfo._id };

        let tableHistoryData = await commonHelper.insert(TableHistory, tableHistory);
        logger.info('gameFinish.js tableHistory Data => ', tableHistoryData);

        await roundEndActions.roundFinish(tableInfo);
    } catch (err) {
        logger.error('gameFinish.js  WinnerDeclareCall => ', err);
    }
};

module.exports.playerLastScoreBoard = async (requestData, client) => {
    try {
        const wh = {
            _id: MongoID(client.tbid.toString()),
        };

        const project = {};
        const tabInfo = await PlayingTables.findOne(wh, project).lean();

        if (tabInfo === null) {
            logger.info('playerLastScoreBoard user not turn ::', tabInfo);
            return false;
        }

        let length = tabInfo.lastGameScoreBoard.length;

        let msg = {
            msg: 'Data is not available',
        };

        if (length !== 0) {
            commandAcions.sendDirectEvent(client.sck, CONST.LAST_GAME_SCORE_BOARD, tabInfo.lastGameScoreBoard[length - 1]);
        } else {
            commandAcions.sendDirectEvent(client.sck, CONST.LAST_GAME_SCORE_BOARD, msg);
        }

        return true;
    } catch (e) {
        logger.error('gamePlay.js playerDrop error => ', e);
    }
};

module.exports.lastGameScoreBoard = async (requestData, client) => {
    try {
        const wh = {
            _id: MongoID(client.tbid.toString()),
        };

        const project = {};
        const tabInfo = await PlayingTables.findOne(wh, project).lean();

        if (tabInfo === null) {
            logger.info('table not found', tabInfo);
            return false;
        }

        let msg = {
            msg: 'Data is not available',
        };

        if (tabInfo.lastGameResult) {
            const limitedLastGameResult = tabInfo.lastGameResult.slice(-50); // Get the last 50 results
            logger.info('BnW limitedLastGameResult', limitedLastGameResult);
            commandAcions.sendDirectEvent(client.sck, CONST.BNW_PREVIOUS_RESULT_HISTORY, { list: limitedLastGameResult });
        } else {
            commandAcions.sendDirectEvent(client.sck, CONST.BNW_PREVIOUS_RESULT_HISTORY, msg);
        }

        return true;
    } catch (e) {
        logger.error('lastGameScoreBoard playerDrop error => ', e);
    }
};

module.exports.mybetlist = async (requestData, client) => {
    try {
        logger.info("MYBET requestData : ", requestData);
        if (typeof client.tbid == "undefined" || typeof client.uid == "undefined" || typeof client.seatIndex == "undefined") {
            commandAcions.sendDirectEvent(client.sck, CONST.MYBET, requestData, false, "User session not set, please restart game!");
            return false;
        }

        const wh = {
            uid: client.uid.toString(),
        }
        const project = {}

        //console.log("wh ", wh)
        const mybetlist = await MyBetTable.find(wh, project).sort({ _id: -1 }).limit(50).lean();
        logger.info("BnW mybetlist mybetlist : ", mybetlist);

        if (mybetlist == null) {
            commandAcions.sendEvent(client, CONST.BNW_MYBET, { mybetlist: [] });
            logger.info("mybetlist bet data not found  ::", mybetlist);
            return false
        }

        mybetlist.forEach(doc => {
            // Convert the `dateTime` string to a Date object
            const dateTime = new Date(doc.dateTime);

            // Format the date as dd/mm/yyyy
            const dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
            doc.date = dateTime.toLocaleDateString('en-IN', dateOptions); // 'en-IN' for dd/mm/yyyy format

            // Format the time as HH:mm:ss
            const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
            doc.time = dateTime.toLocaleTimeString('en-IN', timeOptions); // 24-hour format HH:mm:ss

            // Optional: Remove the original `dateTime` key if no longer needed
            delete doc.dateTime;
        });




        commandAcions.sendEvent(client, CONST.BNW_MYBET, { mybetlist: mybetlist });

        return true;
    } catch (e) {
        logger.info("Exception CANCEL : ", e);
    }
}

module.exports.MybetInsert = async (gameId, amount, type, winAmount, client) => {
    try {
        logger.info("Bnw MybetInsert requestData gameId: ", gameId);
        logger.info("Bnw MybetInsert requestData amount: ", amount);
        logger.info("Bnw MybetInsert requestData type: ", type);
        logger.info("Bnw MybetInsert requestData winAmount: ", winAmount);
        logger.info("Bnw MybetInsert requestData client: ", client);

        if (typeof client.tbid == "undefined" || typeof client.uid == "undefined") {
            logger.info("Bnw MybetInsert If requestData : ");
            return false;
        }
        if (winAmount != 0) {
            let upWh = {
                gameId: gameId,
                uid: client.uid,
                type: type
            }
            let updateData = {
                type: type,
                winAmount: winAmount,
                dateTime: new Date()
            }

            const tb = await MyBetTable.findOneAndUpdate(upWh, updateData, { new: true });
            logger.info("Bnw MybetInsert tb : ", tb);
        }
        /*else {

            let insertobj = {
                gameId: gameId,
                betAmount: amount,
                type: type,
                uid: client.uid,
                dateTime: new Date()
            }

            let insertInfo = await MyBetTable.create(insertobj);
            logger.info("Bnw MybetInsert insertInfo : ", insertInfo);

        }*/
    } catch (e) {
        logger.info("Bnw Exception Mybetlist : ", e);
    }

}

module.exports.MybetInsertType = async (gameId, amount, type, client) => {
    try {
        logger.info("<== gameId, amount, type,  client ==>", gameId, amount, type)

        let count = await MyBetTable.countDocuments({ gameId: gameId, type: type });
        logger.info("Bnw MybetInsertType count : ", count);

        if (typeof client.tbid == "undefined" || typeof client.uid == "undefined") {
            logger.info("Bnw MybetInsertType If requestData : ");
            return false;
        }
        if (count > 0) {
            let upWh = {
                gameId: gameId,
                type: type
            }

            let updateData = {
                $set: {
                    type: type,
                    dateTime: new Date()

                }, $inc: {
                    betAmount: amount,
                }
            }

            const tb = await MyBetTable.findOneAndUpdate(upWh, updateData, { new: true });
            logger.info("Bnw MybetInsertType tb : =>", tb);
        } else {

            let insertobj = {
                gameId: gameId,
                betAmount: amount,
                type: type,
                uid: client.uid,
                dateTime: new Date()
            }

            let insertInfo = await MyBetTable.create(insertobj);
            logger.info("Bnw MybetInsertType insertInfo : ", insertInfo);

        }
    } catch (e) {
        logger.info("Bnw Exception Mybetlist : ", e);
    }

}