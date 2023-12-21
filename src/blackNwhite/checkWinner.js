const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;

const roundStartActions = require("./roundStart");
const checkUserCardActions = require("./checkUserCard");
const gameFinishActions = require("./gameFinish");
const logger = require("../../logger");

const PlayingTables = require("../models/blackNwhiteTables");

module.exports.autoShow = async (tb) => {

    const wh = {
        _id: MongoID(tb._id.toString())
    }
    const tabInfo = await PlayingTables.findOne(wh, {}).lean();

    logger.info("autoShow wh tabInfo : ", wh, tabInfo);
    logger.info("autoShow condition 1: ", tabInfo.callFinalWinner);
    logger.info("autoShow condition 2: ", tabInfo.gameState);

    if (tabInfo.callFinalWinner) return false;

    if (tabInfo.gameState != "RoundStated") return false;

    const upWh = {
        _id: MongoID(tb._id.toString())
    }
    const updateData = {
        $set: {
            "callFinalWinner": true
        }
    }
    logger.info("autoShow upWh updateData :: ", upWh, updateData);

    const tbInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, { new: true });
    logger.info("autoShow tbInfo : ", tbInfo);

    let winners = await this.getWinner(tbInfo);
    logger.info("autoShow winners : ", winners);

    await gameFinishActions.winnerDeclareCall(winners, tbInfo);

}

module.exports.winnercall = async (tb, isShow, showUserSeatIndex) => {

    const wh = {
        _id: MongoID(tb._id.toString())
    }
    const tabInfo = await PlayingTables.findOne(wh, {}).lean();

    logger.info("winnercall wh tabInfo : ", wh, tabInfo);
    logger.info("winnercall condition 1: ", tabInfo.callFinalWinner);
    logger.info("winnercall condition 2: ", tabInfo.gameState);

    if (tabInfo.callFinalWinner) return false;

    // if (tabInfo.gameState != "RoundStated") return false;

    const upWh = {
        _id: MongoID(tb._id.toString())
    }
    const updateData = {
        $set: {
            "callFinalWinner": true
        }
    }
    logger.info("winnercall upWh updateData :: ", upWh, updateData);

    const tbInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, { new: true });
    logger.info("winnercall tbInfo : ", tbInfo);

    let winners = await this.getWinner(tbInfo, isShow, showUserSeatIndex, tbInfo.BNWCards);
    logger.info("winners ==> : ", winners);

    await gameFinishActions.winnerDeclareCall(winners, tbInfo);

}

module.exports.getWinner = async (tb, isShow, showUserSeatIndex, BNWCards) => {

    logger.info("getWinner tb : ", tb);

    const playerInGame = await roundStartActions.getPlayingUserInRound(tb.playerInfo);
    logger.info("getWinner playerInGame ::", playerInGame);

    let winners = checkUserCardActions.getWinnerUser(playerInGame, tb.hukum, isShow, showUserSeatIndex, BNWCards);
    logger.info("getWinner winners ::", winners);

    return winners;
}