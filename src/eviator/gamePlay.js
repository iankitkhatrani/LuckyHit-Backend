const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;

const AviatorTables = mongoose.model("aviatorTables");
const GameUser = mongoose.model("users");

const CONST = require("../../constant");
const logger = require("../../logger");
const commandAcions = require("../helper/socketFunctions");
const roundStartActions = require("./roundStart");
const gameFinishActions = require("./gameFinish");
const checkWinnerActions = require("./checkWinner");
const checkUserCardActions = require("./checkUserCard");

const walletActions = require("./updateWallet");
/*
    bet : 10,
    actionplace:1 || 2

*/
module.exports.action = async (requestData, client) => {
    try {
        logger.info("action requestData : ", requestData);
        if (typeof client.tbid == "undefined" || typeof client.uid == "undefined" || typeof client.seatIndex == "undefined" || typeof requestData.bet == "undefined") {
            commandAcions.sendDirectEvent(client.sck, CONST.ACTION, requestData, false, "User session not set, please restart game!");
            return false;
        }
        if (typeof client.action != "undefined" && client.action) return false;

        client.action = true;

        const wh = {
            _id: MongoID(client.tbid.toString()),
            status:"openforbet"
        }
        const project = {

        }
        const tabInfo = await AviatorTables.findOne(wh, project).lean();
        logger.info("action tabInfo : ", tabInfo);

        if (tabInfo == null) {
            logger.info("action user not turn ::", tabInfo);
            delete client.action;
            return false
        }
        if (tabInfo.turnDone) {
            logger.info("action : client.su ::", client.seatIndex);
            delete client.action;
            commandAcions.sendDirectEvent(client.sck, CONST.ACTION, requestData, false, "Turn is already taken!");
            return false;
        }
        
        let playerInfo = tabInfo.playerInfo[client.seatIndex];
        let currentBet = Number(requestData.bet);
       
        logger.info("action currentBet ::", currentBet);

        let gwh = {
            _id: MongoID(client.uid)
        }
        let UserInfo = await GameUser.findOne(gwh, {}).lean();
        logger.info("action UserInfo : ", gwh, JSON.stringify(UserInfo));

        let updateData = {
            $set: {

            }
        }
        let chalvalue = tabInfo.currentBet;
        updateData.$set["playerInfo.$.playStatus"] = "action"
    
        let totalWallet = Number(UserInfo.chips) + Number(UserInfo.winningChips)

        if (Number(chalvalue) > Number(totalWallet)) {
            logger.info("action client.su ::", client.seatIndex);
            delete client.action;
            commandAcions.sendDirectEvent(client.sck, CONST.ACTION, requestData, false, "Please add wallet!!");
            return false;
        }
        chalvalue = Number(Number(chalvalue).toFixed(2))

        await walletActions.deductWallet(client.uid, -chalvalue, 2, "eviator action", tabInfo, client.id, client.seatIndex);

        if(requestData.actionplace == 1)
        updateData.$set["chalValue"] = chalvalue;
        else
        updateData.$set["chalValue1"] = chalvalue;


        updateData.$set["turnDone"] = true;
        commandAcions.clearJob(tabInfo.job_id);

        const upWh = {
            _id: MongoID(client.tbid.toString()),
            "playerInfo.seatIndex": Number(client.seatIndex)
        }
        logger.info("action upWh updateData :: ", upWh, updateData);

        const tb = await AviatorTables.findOneAndUpdate(upWh, updateData, { new: true });
        logger.info("action tb : ", tb);

        let response = {
            seatIndex: tb.turnSeatIndex,
            chalValue: chalvalue
        }
        commandAcions.sendEventInTable(tb._id.toString(), CONST.ACTION, response);
        delete client.action;
        
        // let activePlayerInRound = await roundStartActions.getPlayingUserInRound(tb.playerInfo);
        // logger.info("action activePlayerInRound :", activePlayerInRound, activePlayerInRound.length);
        // if (activePlayerInRound.length == 1) {
        //     await gameFinishActions.lastUserWinnerDeclareCall(tb);
        // } else {
        //     await roundStartActions.nextUserTurnstart(tb);
        // }
        
        return true;
    } catch (e) {
        logger.info("Exception action : ", e);
    }
}

module.exports.show = async (requestData, client) => {
    try {
        logger.info("show requestData : ", requestData);
        if (typeof client.tbid == "undefined" || typeof client.uid == "undefined" || typeof client.seatIndex == "undefined") {
            commandAcions.sendDirectEvent(client.sck, CONST.SHOW, requestData, false, "User session not set, please restart game!");
            return false;
        }
        if (typeof client.show != "undefined" && client.show) return false;

        client.show = true;

        const wh = {
            _id: MongoID(client.tbid.toString())
        }
        const project = {

        }
        const tabInfo = await AviatorTables.findOne(wh, project).lean();
        logger.info("show tabInfo : ", tabInfo);

        if (tabInfo == null) {
            logger.info("show user not turn ::", tabInfo);
            delete client.show;
            return false
        }
        if (tabInfo.turnDone) {
            logger.info("action : client.su ::", client.seatIndex);
            delete client.action;
            commandAcions.sendDirectEvent(client.sck, CONST.ACTION, requestData, false, "Turn is already taken!");
            return false;
        }
        if (tabInfo.turnSeatIndex != client.seatIndex) {
            logger.info("show : client.su ::", client.seatIndex);
            delete client.show;
            commandAcions.sendDirectEvent(client.sck, CONST.SHOW, requestData, false, "It's not your turn!");
            return false;
        }

        const playerInGame = await roundStartActions.getPlayingUserInRound(tabInfo.playerInfo);
        logger.info("show userTurnExpaire playerInGame ::", playerInGame);

        if (playerInGame.length != 2) {
            logger.info("show : client.su ::", client.seatIndex);
            delete client.show;
            commandAcions.sendDirectEvent(client.sck, CONST.SHOW, requestData, false, "Not valid show!!");
            return false;
        }

        let playerInfo = tabInfo.playerInfo[client.seatIndex];
        logger.info("show playerInfo ::", playerInfo);

        let currentBet = Number(tabInfo.chalValue);
        logger.info("show currentBet ::", currentBet);

        let gwh = {
            _id: MongoID(client.uid)
        }
        let UserInfo = await GameUser.findOne(gwh, {}).lean();
        logger.info("show UserInfo : ", gwh, JSON.stringify(UserInfo));

        let updateData = {
            $set: {
            },
            $inc: {

            }
        }
        let chalvalue = tabInfo.chalValue;

        if (typeof requestData.isIncrement != "undefined" && requestData.isIncrement) {
            chalvalue = chalvalue * 2;
        }
        let totalWallet = Number(UserInfo.chips) + Number(UserInfo.winningChips)
        if (Number(chalvalue) > Number(totalWallet)) {
            logger.info("show client.su :: ", client.seatIndex);
            delete client.show;
            commandAcions.sendDirectEvent(client.sck, CONST.SHOW, requestData, false, "Please add wallet!!");
            return false;
        }
        chalvalue = Number(Number(chalvalue).toFixed(2));

        await walletActions.deductWallet(client.uid, -chalvalue, 3, "TeenPatti show", tabInfo, client.id, client.seatIndex);

        updateData.$set["chalValue"] = chalvalue;
        updateData.$inc["potValue"] = chalvalue;

        commandAcions.clearJob(tabInfo.job_id);
        const upWh = {
            _id: MongoID(client.tbid.toString()),
            "playerInfo.seatIndex": Number(client.seatIndex)
        }
        logger.info("show upWh updateData :: ", upWh, updateData);

        const tb = await AviatorTables.findOneAndUpdate(upWh, updateData, { new: true });
        logger.info("show tb :: ", tb);

        let response = {
            seatIndex: tb.turnSeatIndex,
            chalValue: chalvalue
        }
        commandAcions.sendEventInTable(tb._id.toString(), CONST.SHOW, response);
        delete client.show;
        await checkWinnerActions.winnercall(tb, true, tb.turnSeatIndex);
        return true;
    } catch (e) {
        logger.info("Exception action : ", e);
    }
}

module.exports.cardPack = async (requestData, client) => {
    try {
        logger.info("PACK requestData : ", requestData);
        if (typeof client.tbid == "undefined" || typeof client.uid == "undefined" || typeof client.seatIndex == "undefined") {
            commandAcions.sendDirectEvent(client.sck, CONST.PACK, requestData, false, "User session not set, please restart game!");
            return false;
        }
        if (typeof client.pack != "undefined" && client.pack) return false;

        client.pack = true;

        const wh = {
            _id: MongoID(client.tbid.toString())
        }
        const project = {

        }
        const tabInfo = await AviatorTables.findOne(wh, project).lean();
        logger.info("PACK tabInfo : ", tabInfo);

        if (tabInfo == null) {
            logger.info("PACK user not turn ::", tabInfo);
            delete client.pack;
            return false
        }
        if (tabInfo.turnSeatIndex != client.seatIndex) {
            logger.info("PACK : client.su ::", client.seatIndex);
            delete client.pack;
            commandAcions.sendDirectEvent(client.sck, CONST.PACK, requestData, false, "It's not your turn!", "Error!");
            return false;
        }
        let playerInfo = tabInfo.playerInfo[client.seatIndex];

        commandAcions.clearJob(tabInfo.job_id);
        let winner_state = checkUserCardActions.getWinState(playerInfo.cards, tabInfo.hukum);
        let userTrack = {
            _id: playerInfo._id,
            username: playerInfo.username,
            cards: playerInfo.cards,
            seatIndex: client.seatIndex,
            total_bet: playerInfo.totalBet,
            play_status: "pack",
            winning_card_status: winner_state.status
        }

        const upWh = {
            _id: MongoID(client.tbid.toString()),
            "playerInfo.seatIndex": Number(client.seatIndex)
        }
        const updateData = {
            $set: {
                "playerInfo.$.status": "pack",
                "playerInfo.$.playerStatus": "pack"
            },
            $push: {
                gameTracks: userTrack
            }
        };
        logger.info("PACK upWh updateData :: ", upWh, updateData);

        const tb = await AviatorTables.findOneAndUpdate(upWh, updateData, { new: true });
        logger.info("PACK tb : ", tb);

        let response = {
            seatIndex: tb.turnSeatIndex,
        }
        commandAcions.sendEventInTable(tb._id.toString(), CONST.PACK, response);

        let activePlayerInRound = await roundStartActions.getPlayingUserInRound(tb.playerInfo);
        logger.info("PACK activePlayerInRound :", activePlayerInRound, activePlayerInRound.length);
        if (activePlayerInRound.length == 1) {
            await gameFinishActions.lastUserWinnerDeclareCall(tb);
        } else {
            await roundStartActions.nextUserTurnstart(tb);
        }
        return true;
    } catch (e) {
        logger.info("Exception PACK : ", e);
    }
}

module.exports.seeCard = async (requestData, client) => {
    try {
        logger.info("seeCard requestData : ", requestData);
        if (typeof client.tbid == "undefined" || typeof client.uid == "undefined" || typeof client.seatIndex == "undefined") {
            commandAcions.sendDirectEvent(client.sck, CONST.SEE_CARD, requestData, false, "1000", "User session not set, please restart game!", "Error!");
            return false;
        }
        const wh = {
            _id: MongoID(client.tbid.toString()),
            "playerInfo.seatIndex": Number(client.seatIndex)
        }
        const project = {
        }
        const tabInfo = await AviatorTables.findOne(wh, project).lean();
        logger.info("seeCard tabInfo : ", tabInfo);

        if (tabInfo == null) {
            logger.info("seeCard user not turn ::", tabInfo);
            return false
        }
        let playerInfo = tabInfo.playerInfo[client.seatIndex];

        const upWh = {
            _id: MongoID(client.tbid.toString()),
            "playerInfo.seatIndex": Number(client.seatIndex)
        }
        const updateData = {
            $set: {
                "playerInfo.$.isSee": true
            }
        };
        logger.info("seeCard upWh updateData :: ", upWh, updateData);

        const tb = await AviatorTables.findOneAndUpdate(upWh, updateData, { new: true });
        logger.info("seeCard tb : ", tb);

        let response = {
            cards: playerInfo.cards
        }
        commandAcions.sendEvent(client, CONST.SEE_CARD_INFO, response);
        let isShow = await roundStartActions.checShowButton(tb.playerInfo,client.seatIndex);

        let response1 = {
            seatIndex: client.seatIndex,
            isShow: isShow
        }
        commandAcions.sendEventInTable(tb._id.toString(), CONST.SEE_CARD, response1);

        return true;
    } catch (e) {
        logger.info("Exception PACK : ", e);
    }
}