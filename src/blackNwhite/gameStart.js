const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;
const GameUser = mongoose.model('users');
const PlayingTables = mongoose.model("blackNwhiteTables");
const IdCounter = mongoose.model("idCounter")

const commandAcions = require("../helper/socketFunctions");
const cardDealActions = require("./cardDeal");

const CONST = require("../../constant");
const logger = require("../../logger");
const roundStartActions = require("./roundStart");
const walletActions = require("./updateWallet");
const { config } = require("dotenv");
const botLogic = require("./botLogic");

// const leaveTableActions = require("./leaveTable");

module.exports.gameTimerStart = async (tb) => {
    try {
        logger.info("gameTimerStart tb : ", tb);
        if (tb.gameState != "") return false;

        let wh = {
            _id: tb._id,
            "playerInfo.seatIndex": { $ne: -1 }
        }
        let update = {
            $set: {
                gameState: "GameStartTimer",
                "GameTimer.GST": new Date(),
                "totalbet": 0,
            }
        }
        logger.info("gameTimerStart UserInfo : ", wh, update);

        const tabInfo = await PlayingTables.findOneAndUpdate(wh, update, { new: true });
        logger.info("gameTimerStart tabInfo :: ", tabInfo);

        let roundTime = 3;
        commandAcions.sendEventInTable(tabInfo._id.toString(), CONST.BNW_GAME_START_TIMER, { timer: roundTime });

        let tbId = tabInfo._id;
        let jobId = CONST.BNW_GAME_START_TIMER + ":" + tbId;
        let delay = commandAcions.AddTime(roundTime);

        const delayRes = await commandAcions.setDelay(jobId, new Date(delay));

        await this.startBatting(tbId)
    } catch (error) {
        logger.error("gameTimerStart.js error ->", error)
    }
}

module.exports.startBatting = async (tbId) => {
    logger.info("table Id startBatting-- >", tbId);
    try {
        // let whr = { _id: tbId }
        // let tb = await PlayingTables.findOne({ whr }, {}).lean()

        // logger.info("start BNW tbId : ", tb);
        // if (tb === null || tb.gameState !== "GameStartTimer") return false;

        let wh = {
            _id: tbId
        }
        let update = {
            $set: {
                gameState: "StartBatting",
            }
        }
        logger.info("bnw UserInfo : ", wh, update);
        const tabInfo = await PlayingTables.findOneAndUpdate(wh, update, { new: true });
        logger.info("bnw tabInfo :: ", tabInfo);


        let roundTime = 10;
        commandAcions.sendEventInTable(tabInfo._id.toString(), CONST.BNW_START_BATTING_TIMER, { timer: roundTime });

        let tblId = tabInfo._id;
        let jobId = CONST.BNW_START_BATTING_TIMER + ":" + tblId;
        let delay = commandAcions.AddTime(roundTime);

        const delayRes = await commandAcions.setDelay(jobId, new Date(delay));

        // botLogic.PlayRobot(tabInfo, tabInfo.playerInfo, Number)
        await cardDealActions.cardDealStart(tblId)

    } catch (error) {
        logger.error("startBatting  error ->", error)
    }

}

module.exports.generateNumber = async (minRange, maxRange) => {
    // Generate a random decimal number between 0 (inclusive) and 1 (exclusive)
    const randomDecimal = Math.random().toFixed(2);
    console.log('Random Decimal:', randomDecimal);

    // Generate a random whole number between a specified range (min and max)
    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    const randomWholeNumber = getRandomInt(minRange, maxRange);
    console.log('Random Whole Number:randomWholeNumber ', randomWholeNumber);

    console.log('Random Whole Number:', randomWholeNumber + parseFloat(randomDecimal));

    return randomWholeNumber + parseFloat(randomDecimal)
}

module.exports.deduct = async (tabInfo, playerInfo) => {
    try {

        logger.info("\ndeduct playerInfo :: ", playerInfo);
        let seatIndexs = [];
        for (let i = 0; i < playerInfo.length; i++) {
            if (playerInfo[i] != {} && typeof playerInfo[i].seatIndex != "undefined" && playerInfo[i].status == "play") {
                seatIndexs.push(playerInfo[i].seatIndex);

                await walletActions.deductWallet(playerInfo[i]._id, -Number(tabInfo.boot), 1, "aviator Bet", tabInfo, playerInfo[i].sck, playerInfo[i].seatIndex);

                let update = {
                    $inc: {
                        "potValue": Number(tabInfo.boot),
                        "playerInfo.$.totalBet": Number(tabInfo.boot)
                    }
                }
                let uWh = { _id: MongoID(tabInfo._id.toString()), "playerInfo.seatIndex": Number(playerInfo[i].seatIndex) }
                logger.info("deduct uWh update ::", uWh, update)
                await PlayingTables.findOneAndUpdate(uWh, update, { new: true });
            }
        }
        return seatIndexs
    } catch (error) {
        logger.error("deduct error ->", error)
    }
}

module.exports.resetUserData = async (tbId, playerInfo) => {
    try {

        for (let i = 0; i < playerInfo.length; i++)
            if (typeof playerInfo[i].seatIndex != "undefined") {
                let update = {
                    $set: {
                        "playerInfo.$.status": "play",
                        "playerInfo.$.playStatus": "blind",
                        "playerInfo.$.chalValue": 0,
                        "playerInfo.$.cards": [],
                        "playerInfo.$.turnMissCounter": 0,
                        "playerInfo.$.turnDone": false,
                        "playerInfo.$.turnCount": 0,
                    }
                }
                playerInfo[i].status = "play";
                let uWh = { _id: MongoID(tbId.toString()), "playerInfo.seatIndex": Number(playerInfo[i].seatIndex) }
                logger.info("updateUserState uWh update ::", uWh, update)
                await PlayingTables.findOneAndUpdate(uWh, update, { new: true });
            }

        logger.info("updateUserState playerInfo::", playerInfo, playerInfo.length);
        let playerInfos = await roundStartActions.getPlayingUserInRound(playerInfo);
        logger.info("updateUserState playerInfos::", playerInfos)
        return playerInfos;
    } catch (error) {
        logger.error("resetUserData error ->", error)
    }
}

module.exports.checkUserInRound = async (playerInfo, tb) => {
    try {

        let userIds = [];
        let userSeatIndexs = {};
        for (let i = 0; i < playerInfo.length; i++) {
            userIds.push(playerInfo[i]._id);
            userSeatIndexs[playerInfo[i]._id.toString()] = playerInfo[i].seatIndex;
        }
        logger.info("checkUserState userIds ::", userIds, userSeatIndexs);
        let wh = {
            _id: {
                $in: userIds
            }
        }
        let project = {
            chips: 1,
            winningChips: 1,
            sck: 1,
        }
        let userInfos = await GameUser.find(wh, project);
        logger.info("checkUserState userInfos :: ", userInfos);

        let userInfo = {};

        for (let i = 0; i < userInfos.length; i++)
            if (typeof userInfos[i]._id != "undefined") {
                let totalWallet = Number(userInfos[i].chips) + Number(userInfos[i].winningChips)
                userInfo[userInfos[i]._id] = {
                    coins: totalWallet,
                }
            }

        for (let i = 0; i < userInfos.length; i++)
            if (typeof userInfos[i]._id != "undefined") {
                if (Number(userInfo[userInfos[i]._id.toString()].coins) < (Number(tb.boot))) {
                    await leaveTableActions.leaveTable({
                        reason: "wallet_low"
                    }, {
                        _id: userInfos[i]._id.toString(),
                        tbid: tb._id.toString(),
                        seatIndex: userSeatIndexs[userInfos[i]._id.toString()],
                        sck: userInfos[i].sck,
                    })
                    //delete index frm array
                    playerInfo.splice(userSeatIndexs[userInfos[i]._id.toString()], 1);
                    delete userSeatIndexs[userInfos[i]._id.toString()];
                }
            }

        return playerInfo;
    } catch (error) {
        logger.error("checkUserInRound error ->", error)
    }
}

module.exports.getCount = async (type) => {
    let wh = {
        type: type
    }
    let update = {
        $set: {
            type: type
        },
        $inc: {
            counter: 1
        }
    }
    logger.info("\ngetUserCount wh : ", wh, update);

    let resp2 = await IdCounter.findOneAndUpdate(wh, update, { upsert: true, new: true });
    return resp2.counter;
}