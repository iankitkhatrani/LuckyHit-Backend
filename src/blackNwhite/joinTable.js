const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;
const GameUser = mongoose.model('users');
const PlayingTables = mongoose.model("blackNwhiteTables");
const BetLists = mongoose.model("betList")

const { sendEvent, sendDirectEvent, AddTime, setDelay, clearJob } = require('../helper/socketFunctions');

const gameStartActions = require("./gameStart");
const CONST = require("../../constant");
const logger = require("../../logger");
const botLogic = require("./botLogic");
const leaveTableActions = require('./leaveTable');

module.exports.joinTable = async (requestData, client) => {
    try {
        if (typeof client.uid == "undefined") {
            sendEvent(client, CONST.BNW_JOIN_TABLE, requestData, false, "Please restart game!!");
            return false;
        }
        if (typeof client.JT != "undefined" && client.JT) return false;

        client.JT = true;

        let gwh = {
            _id: MongoID(client.uid)
        }
        let UserInfo = await GameUser.findOne(gwh, {}).lean();
        logger.info("JoinTable UserInfo : ", gwh, JSON.stringify(UserInfo));

        let totalWallet = Number(UserInfo.chips) + Number(UserInfo.winningChips)
        if (Number(totalWallet) < 1) {
            sendEvent(client, CONST.BNW_JOIN_TABLE, requestData, false, "Please add Wallet!!");
            delete client.JT
            return false;
        }

        let gwh1 = {
            "playerInfo._id": MongoID(client.uid)
        }
        let tableInfo = await PlayingTables.findOne(gwh1, { "playerInfo.$": 1 }).lean();
        logger.info("JoinTable tableInfo : ", gwh, JSON.stringify(tableInfo));

        if (tableInfo != null) {

            await leaveTableActions.leaveTable(
                {
                    reason: 'autoLeave',
                },
                {
                    uid: tableInfo.playerInfo[0]._id?.toString(),
                    tbid: tableInfo._id?.toString(),
                    seatIndex: tableInfo.playerInfo[0].seatIndex,
                    sck: tableInfo.playerInfo[0].sck,
                }
            );
            await this.findTable(client, requestData)

            // sendEvent(client, CONST.BNW_JOIN_TABLE, requestData, false, "Already In playing table!!");
            // delete client.JT

            // let updateData = {
            //     $set: {
            //         'playerInfo.$': {},
            //     },
            // };

            // tableInfo = await PlayingTables.findOneAndUpdate(gwh1, updateData, {
            //     new: true,
            // });

            // logger.info("BNW Remove User table -->", tableInfo)

            return false;


        }
        await this.findTable(client)
    } catch (error) {
        logger.error("BNW_JOIN_TABLE", error);
    }
}

module.exports.findTable = async (client) => {

    let tableInfo = await this.getBetTable();
    logger.info("findTable tableInfo : ", JSON.stringify(tableInfo));

    await this.findEmptySeatAndUserSeat(tableInfo, client);
}

module.exports.getBetTable = async () => {
    let wh = {
        activePlayer: { $gte: 0, }
    }
    logger.info("getBetTable wh : ", JSON.stringify(wh));
    let tableInfo = await PlayingTables.find(wh, {}).sort({ activePlayer: 1 }).lean();
    // tableInfo.push({})
    logger.info("getBetTable tabinfo ", JSON.stringify(tableInfo));

    if (tableInfo.length > 0) {
        return tableInfo[0];
    }
    let table = await this.createTable({});
    return table;
}

module.exports.createTable = async () => {
    try {
        let insertobj = {
            gameId: "",
            activePlayer: 0,
            playerInfo: this.makeObjects(50),
            gameState: "",
            history: [],
            BNWCards: { black: [], white: [] },
        };
        logger.info("createTable insertobj : ", insertobj);

        let insertInfo = await PlayingTables.create(insertobj);
        logger.info("createTable insertInfo : ", insertInfo);

        return insertInfo;

    } catch (error) {
        logger.error('joinTable.js createTable error=> ', error);

    }
}

module.exports.findEmptySeatAndUserSeat = async (table, client) => {
    try {
        // logger.info("findEmptySeatAndUserSeat table :=> ", table + " betInfo :=> ", betInfo + " client :=> ", client);
        let seatIndex = this.findEmptySeat(table.playerInfo); //finding empty seat
        logger.info("findEmptySeatAndUserSeat seatIndex ::", seatIndex);

        if (seatIndex == "-1") {
            await this.findTable(client)
            return false;
        }

        let user_wh = {
            _id: client.uid
        }

        let userInfo = await GameUser.findOne(user_wh, {}).lean();
        logger.info("findEmptySeatAndUserSeat userInfo : ", userInfo)

        let totalWallet = Number(userInfo.chips) + Number(userInfo.winningChips)
        let playerDetails = {
            seatIndex: seatIndex,
            _id: userInfo._id,
            playerId: userInfo._id,
            username: userInfo.username,
            profile: userInfo.profileUrl,
            coins: Number(totalWallet),
            status: "",
            playerStatus: "",
            betLists: [],
            sck: client.id,
            playerSocketId: client.id,
            playerLostChips: 0,
            Iscom: userInfo.Iscom != undefined ? userInfo.Iscom : 0,
        }

        logger.info("findEmptySeatAndUserSeat playerDetails : ", playerDetails);

        let whereCond = {
            _id: MongoID(table._id.toString())
        };
        whereCond['playerInfo.' + seatIndex + '.seatIndex'] = { $exists: false };


        let setPlayerInfo = {
            $set: {
            },
            $inc: {
                activePlayer: 1
            },

        };
        setPlayerInfo["$set"]["playerInfo." + seatIndex] = playerDetails;
        // setPlayerInfo.$set['playerInfo'] = table.playerInfo

        logger.info(" **  findEmptySeatAndUserSeat whereCond : ", whereCond, setPlayerInfo);

        let tableInfo = await PlayingTables.findOneAndUpdate(whereCond, setPlayerInfo, { new: true });
        logger.info("\nfindEmptySeatAndUserSeat tbInfo : ", tableInfo);

        let playerInfo = tableInfo.playerInfo[seatIndex];

        if (!(playerInfo._id.toString() == userInfo._id.toString())) {
            await this.findTable(betInfo, client);
            return false;
        }
        client.seatIndex = seatIndex;
        client.tbid = tableInfo._id;

        logger.info('\n Assign table id and seat index socket event ->', client.seatIndex, client.tbid);
        let diff = -1;

        if (tableInfo.activePlayer >= 2 && tableInfo.gameState === CONST.ROUND_START_TIMER) {
            let currentDateTime = new Date();
            let time = currentDateTime.getSeconds();
            let turnTime = new Date(tableInfo.gameTimer?.GST ?? 0)
            let Gtime = turnTime.getSeconds();

            diff = Number(Gtime) - time;
            diff += CONST.gameStartTime;
        }

        sendEvent(client, CONST.BNW_JOIN_SIGN_UP, {});

        //GTI event
        sendEvent(client, CONST.BNW_GAME_TABLE_INFO, {
            ssi: tableInfo.playerInfo[seatIndex].seatIndex,
            gst: diff,
            pi: tableInfo.playerInfo,
            utt: CONST.userTurnTimer,
            fns: CONST.finishTimer,
            tableid: tableInfo._id,
            gamePlayType: tableInfo.gamePlayType,
            type: tableInfo.gamePlayType,
            tableAmount: tableInfo.tableAmount,
        });

        if (userInfo.Iscom == undefined || userInfo.Iscom == 0)
            client.join(tableInfo._id.toString());

        sendDirectEvent(client.tbid.toString(), CONST.BNW_JOIN_TABLE, {
            ap: tableInfo.activePlayer,
            playerDetail: tableInfo.playerInfo[seatIndex],
        });

        delete client.JT;

        for (let i = 0; i < 10; i++) {
            let res = await botLogic.JoinRobot(tableInfo);
            logger.info("Result ->", res);
        }

        if (tableInfo.gameState == "" /*&& tableInfo.activePlayer > 1*/) {

            let jobId = "LEAVE_SINGLE_USER:" + tableInfo._id;
            clearJob(jobId)
            await gameStartActions.gameTimerStart(tableInfo);
        }

    } catch (error) {
        logger.error("findEmptySeatAndUserSeat", error);
    }
}

module.exports.findEmptySeat = (playerInfo) => {
    for (x in playerInfo) {
        if (typeof playerInfo[x] == 'object' && playerInfo[x] != null && typeof playerInfo[x].seatIndex == 'undefined') {
            logger.info("parseInt(x)", parseInt(x))
            return parseInt(x);
            break;
        }
    }
    return '-1';
}

module.exports.makeObjects = (no) => {
    logger.info("makeObjects no : ", no)
    const arr = new Array();
    for (i = 0; i < no; i++)
        arr.push({});
    return arr;
}