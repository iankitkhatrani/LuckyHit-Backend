const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;

const CONST = require("../../constant");
const commandAcions = require('../helper/socketFunctions');
const gamePlayActions = require("./gamePlay");
const logger = require("../../logger");
const botLogic = require("./botLogic");

const AviatorTables = mongoose.model("aviatorTables");


module.exports.roundStarted = async (tbid) => {
    try {
        logger.info("roundStarted call tbid : ", tbid);
        const wh = {
            _id: MongoID(tbid)
        }
        const project = {
            gameState: 1,
            playerInfo: 1,
            activePlayer: 1
        }
        let tabInfo = await AviatorTables.findOne(wh, project).lean();
        logger.info("roundStarted tabInfo : ", tabInfo);

        if (tabInfo == null) {
            logger.info("roundStarted table in 1:", tabInfo);
            return false;
        }

        if (tabInfo.gameState != "CardDealing" || tabInfo.activePlayer < 2) {
            logger.info("roundStarted table in 2:", tabInfo.gameState, tabInfo.activePlayer);
            return false;
        }

        const update = {
            $set: {
                gameState: "RoundStated"
            }
        }
        logger.info("roundStarted update : ", wh, update);

        const tb = await AviatorTables.findOneAndUpdate(wh, update, { new: true });
        logger.info("roundStarted tb : ", tb);

        await this.setFirstTurn(tb);

    } catch (error) {
        logger.error('roundStart.js roundStarted error : ', error);
    }

}

module.exports.setFirstTurn = async (tb) => {
    logger.info("setFirstTurn tb :", tb);
    await this.startUserTurn(tb.dealerSeatIndex, tb, true);
}

module.exports.nextUserTurnstart = async (tb) => {
    try {

        logger.info("nextUserTurnstart tb :: ", tb);
        let nextTurnIndex = await this.getUserTurnSeatIndex(tb, tb.turnSeatIndex, 0);
        logger.info("nextUserTurnstart nextTurnIndex :: ", nextTurnIndex);
        await this.startUserTurn(nextTurnIndex, tb, false);
    } catch (error) {
        logger.error('roundStart.js nextUserTurnstart error : ', error);
    }

}

module.exports.startUserTurn = async (seatIndex, objData, firstTurnStart) => {
    try {

        logger.info("startUserTurn turnIndex :", seatIndex);
        let jobid = CONST.TURN_START + ":" + objData._id.toString();

        let wh = {
            _id: objData._id.toString()
        }
        let project = {
            jobId: 1,
        }
        let tabInfo = await AviatorTables.findOne(wh, project).lean();
        logger.info("initGameState tabInfo : ", tabInfo);

        if (typeof tabInfo.jobId != "undefined" && tabInfo.jobId != "") {
            let clearRes = await commandAcions.clearJob(tabInfo.jobId);
            logger.info("startUserTurn jobid :", clearRes);
        }

        let jobId = commandAcions.GetRandomString(10);
        let update = {
            $set: {
                turnSeatIndex: seatIndex,
                turnDone: false,
                "gameTimer.ttimer": new Date(),
                jobId: jobId
            }
        }
        logger.info("startUserTurn wh update ::", wh, update);

        const tb = await AviatorTables.findOneAndUpdate(wh, update, { new: true });
        logger.info("startUserTurn tb : ", tb);

        const playerInGame = await this.getPlayingUserInRound(tb.playerInfo);
        logger.info("startUserTurn playerInGame ::", playerInGame);

        if (playerInGame.length == 1) {
            logger.info("startUserTurn single user in game so game goes on winner state..!");
            return false
        }
        // let update = {

        // }
        // if(objData.turnSeatIndex != -1 && typeof tb.playerInfo[objData.turnSeatIndex].seatIndex != "undefined"){

        // }
        // if(typeof tb.playerInfo[tb.turnSeatIndex].seatIndex != "undefined"){

        // }
        let isShow = await this.checShowButton(tb.playerInfo, tb.turnSeatIndex);

        let response = {
            previousTurn: objData.turnSeatIndex,
            nextTurn: tb.turnSeatIndex,
            chalValue: tb.chalValue,
            isShow: isShow
        }
        commandAcions.sendEventInTable(tb._id.toString(), CONST.TURN_START, response);

        if (tb.playerInfo != undefined && tb.playerInfo[tb.turnSeatIndex] != undefined && tb.playerInfo[tb.turnSeatIndex].Iscom == 1) {
            // Rboot Logic Start Playing 
            botLogic.PlayRobot(tb, tb.playerInfo[tb.turnSeatIndex], playerInGame)
        }


        let tbid = tb._id.toString();

        let time = 30;
        let turnChangeDelayTimer = commandAcions.AddTime(time);
        logger.info("startUserTurn jobId time ::", jobId, time, new Date(turnChangeDelayTimer), new Date());

        const delayRes = await commandAcions.setDelay(jobId, new Date(turnChangeDelayTimer));
        logger.info("startUserTurn delayRes : ", delayRes);

        await this.userTurnExpaire(tbid);
    } catch (error) {
        logger.error('roundStart.js startUserTurn error : ', error);

    }

}

module.exports.userTurnExpaire = async (tbid) => {
    try {

        logger.info("\nuserTurnExpaire tbid : ", tbid);
        const wh = {
            _id: MongoID(tbid)
        }
        let project = {
            gameState: 1,
            playerInfo: 1,
            activePlayer: 1,
            turnSeatIndex: 1,
            turnDone: 1
        }
        let tabInfo = await AviatorTables.findOne(wh, project).lean();
        logger.info("userTurnExpaire tabInfo : ", tabInfo);

        if (tabInfo == null || tabInfo.gameState != "RoundStated") return false;

        let activePlayerInRound = await this.getPlayingUserInRound(tabInfo.playerInfo);
        if (activePlayerInRound.length == 0 || tabInfo.turnDone) {
            logger.info("userTurnExpaire : user not activate found!!", activePlayerInRound, tabInfo.turnDone)
            return false;
        }
        // logger.info("\nmanagePlayerOnLeave activePlayerInRound :",activePlayerInRound, activePlayerInRound.length,tabInfo.gameState);

        let playerInfo = tabInfo.playerInfo[tabInfo.turnSeatIndex];
        logger.info("userTurnExpaire playerInfo :: ", playerInfo);

        const whPlayer = {
            _id: MongoID(tbid),
            "playerInfo.seatIndex": Number(tabInfo.turnSeatIndex)
        }
        let update = {
            $inc: {
                "playerInfo.$.turnMissCounter": 1
            }
        }
        logger.info("userTurnExpaire whPlayer update :: ", whPlayer, update);

        const upRes = await AviatorTables.findOneAndUpdate(whPlayer, update, { new: true });
        logger.info("userTurnExpaire upRes : ", upRes);

        const userDrop = await this.handleTimeOut(tabInfo.turnSeatIndex, tabInfo);
        logger.info("userTurnExpaire userDrop : ", userDrop);
        if (userDrop) {
            const wh1 = {
                _id: MongoID(tabInfo._id.toString())
            }
            const project1 = {
                gameState: 1,
                playerInfo: 1
            }
            let taabInfo = await AviatorTables.findOne(wh1, project1).lean();
            logger.info("userTurnExpaire taabInfo : ", taabInfo);

            const playerInGame = await this.getPlayingUserInRound(taabInfo.playerInfo);
            logger.info("userTurnExpaire playerInGame ::", playerInGame);

            /*
                After winner then can't call next turn start function
            */

            if (playerInGame.length > 1 && taabInfo.gameState == "RoundStarted") {
                return await this.nextUserTurnstart(taabInfo);
            } else {
                logger.info("startUserTurn single user in game so game goes on winner state..!", taabInfo.gameState, playerInGame);
                return false;
            }
        } else {
            return await this.nextUserTurnstart(tabInfo);
        }
    } catch (error) {
        logger.error('roundStart.js getUserTurnSeatIndex error : ', error);
    }
}

module.exports.handleTimeOut = async (turnIndex, tb) => {
    try {

        let playerInfo = tb.playerInfo[turnIndex];
        logger.info("handleTimeOut tb.pi[turnIndex] :: ", playerInfo)

        let requestData = {
            cards: playerInfo.cards,
            timeOut: true,
            reason: "timeOutPack"
        }
        logger.info("handleTimeOut requestData ::", requestData);

        await gamePlayActions.cardPack(requestData, { tbid: tb._id, uid: playerInfo._id, seatIndex: playerInfo.seatIndex, sck: playerInfo.sck });
        return true
    } catch (error) {

    }
}

module.exports.getPlayingUserInRound = async (p) => {
    try {

        let pl = [];
        if (typeof p == 'undefined' || p == null)
            return pl;

        for (let x = 0; x < p.length; x++) {
            if (typeof p[x] == 'object' && p[x] != null && typeof p[x].seatIndex != 'undefined' /*&& p[x].status == "play"*/)
                pl.push(p[x]);
        }
        return pl;
    } catch (error) {
        logger.error('roundStart.js getPlayingUserInRound error : ', error);
    }
}

module.exports.getUserTurnSeatIndex = async (tbInfo, prevTurn, cnt) => {
    try {
        let counter = cnt;
        let p = tbInfo.playerInfo;
        let plen = p.length;

        if (prevTurn === plen - 1) x = 0;
        else x = Number(prevTurn) + 1;

        if (counter === plen + 1) {
            return prevTurn;
        }

        counter++;

        if (x < plen && (p[x] == null || typeof p[x].seatIndex == 'undefined' || p[x].status != 'play')) {
            let index = await this.getUserTurnSeatIndex(tbInfo, x, counter);
            return index;
        }
        else {
            return (x);
        }
    } catch (error) {
        logger.error('roundStart.js getUserTurnSeatIndex error : ', error);
    }
}

module.exports.checkShileShow = (tb) => {

}

module.exports.checkShileShowSeatIndex = (seatIndex, p) => {
    let pl = [];
    let pr_seatIndex = ((seatIndex - 1) == -1) ? 4 : seatIndex - 1;
    if (typeof p[pr_seatIndex].pla)
        return pl;
}

module.exports.checShowButton = async (p, playerIndex) => {
    try {
        //&&  (p[i].playerStatus == "action" || (p[i].playerStatus == "blind" &&
        let counter = 0;
        logger.info("checShowButton  :playerIndex  ", playerIndex);



        for (let i = 0; i < p.length; i++) {
            logger.info("checShowButton  :seatIndex  ", p[i].seatIndex);
            logger.info("checShowButton  :p[i].isSee  ", p[i].isSee);
            if (p[i].seatIndex != "undefined" && playerIndex == p[i].seatIndex && p[i].isSee == true) {
                counter++;
            }
        }

        if (counter >= 1) {
            return true;
        } else {
            return false
        }
    } catch (error) {
        logger.error('roundStart.js checShowButton error : ', error);
    }
}