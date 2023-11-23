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

            },
            $inc:{
                
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
        updateData.$set["playerInfo.$.chalValue"] = chalvalue;
        else
        updateData.$set["playerInfo.$.chalValue1"] = chalvalue;


        updateData.$inc["totalbet"] = chalvalue;
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
        const tabInfo = await AviatorTables.findOne(wh, project).lean();
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

        await walletActions.deductWallet(client.uid, winAmount, 2, "eviator Win", tabInfo, client.id, client.seatIndex);

        if(requestData.actionplace == 1)
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

        const tb = await AviatorTables.findOneAndUpdate(upWh, updateData, { new: true });
        logger.info("action tb : ", tb);

        let response = {
            seatIndex: tb.turnSeatIndex,
            winamount: winAmount
        }
        commandAcions.sendEventInTable(tb._id.toString(), CONST.CHECKOUT, response);
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

