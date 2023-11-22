const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;

const AviatorTables = mongoose.model("aviatorTables");
const GameUser = mongoose.model("users");

const CONST = require("../../constant");
const commandAcions = require("../helper/socketFunctions");
const roundStartActions = require("./roundStart")
const gameFinishActions = require("./gameFinish");
const logger = require("../../logger");


module.exports.leaveTable = async (requestData, client) => {
    var requestData = (requestData != null) ? requestData : {}
    if (typeof client.tbid == "undefined" || typeof client.uid == "undefined" || typeof client.seatIndex == "undefined") {
        commandAcions.sendDirectEvent(client.sck, CONST.LEAVE_TABLE, requestData, false, "User session not set, please restart game!");
        return false;
    }

    let userWh = {
        _id: MongoID(client.uid.toString()),
    }
    let userInfo = await GameUser.findOne(userWh, {});
    logger.info("leaveTable userInfo : ", userInfo)

    let wh = {
        _id: MongoID(client.tbid.toString()),
        "playerInfo._id": MongoID(client.uid.toString())
    };
    let tb = await AviatorTables.findOne(wh, {});
    logger.info("leaveTable tb : ", tb);

    if (tb == null) return false;

    if (typeof client.id != "undefined")
        client.leave(tb._id.toString());

    let reason = (requestData != null && typeof requestData.reason != "undefined" && requestData.reason) ? requestData.reason : "ManuallyLeave"
    let playerInfo = tb.playerInfo[client.seatIndex];
    logger.info("leaveTable playerInfo : =>", playerInfo)

    let updateData = {
        $set: {
            "playerInfo.$": {}
        },
        $inc: {
            activePlayer: -1
        }
    }
    if (tb.activePlayer == 2 && tb.gameState == "GameStartTimer") {
        let jobId = CONST.GAME_START_TIMER + ":" + tb._id.toString();
        commandAcions.clearJob(jobId)
        updateData["$set"]["gameState"] = "";
    }
    if (tb.activePlayer == 1) {
        let jobId = "LEAVE_SINGLE_USER:" + tb._id;
        commandAcions.clearJob(jobId)
    }

    if (tb.gameState == "RoundStated") {
        if (client.seatIndex == tb.turnSeatIndex) {
            commandAcions.clearJob(tb.jobId)
        }
        if (playerInfo.cards.length == 3) {
            if (["action", "blind"].indexOf(playerInfo.playStatus) != -1) {

                let userTrack = {
                    _id: playerInfo._id,
                    username: playerInfo.username,
                    cards: playerInfo.cards,
                    seatIndex: playerInfo.seatIndex,
                    totalBet: playerInfo.totalBet,
                    playStatus: "leaveTable"
                }
                updateData["$push"] = {
                    "gameTracks": userTrack
                }
            }
        }
    }

    logger.info("leaveTable updateData : ", wh, updateData);

    let response = {
        reason: reason,
        tbid: tb._id,
        seatIndex: client.seatIndex
    }

    let tbInfo = await AviatorTables.findOneAndUpdate(wh, updateData, { new: true });
    logger.info("leaveTable tbInfo : ", tbInfo);

    commandAcions.sendDirectEvent(client.sck.toString(), CONST.LEAVE_TABLE, response);
    commandAcions.sendEventInTable(tb._id.toString(), CONST.LEAVE_TABLE, response);


    await this.manageOnUserLeave(tbInfo);
}

module.exports.manageOnUserLeave = async (tb, client) => {
    logger.info("\nmanageOnUserLeave tb : ", tb);

    const playerInGame = await roundStartActions.getPlayingUserInRound(tb.playerInfo);
    logger.info("manageOnUserLeave playerInGame : ", playerInGame);

    if (tb.gameState == "RoundStated" || tb.gameState == "CollectBoot") {
        if (playerInGame.length >= 2) {
            await roundStartActions.nextUserTurnstart(tb, false);
        } else if (playerInGame.length == 1) {
            await gameFinishActions.lastUserWinnerDeclareCall(tb);
        }
    } else if (["", "GameStartTimer"].indexOf(tb.gameState) != -1) {
        if (playerInGame.length == 0 && tb.activePlayer == 0) {
            let wh = {
                _id: MongoID(tb._id.toString())
            }
            await AviatorTables.deleteOne(wh);
        } else if (tb.activePlayer == 0) {
            this.leaveSingleUser(tb._id)
        }
    }

}

module.exports.leaveSingleUser = async (tbid) => {
    console.log("leaveSingleUser call tbid : ", tbid);
    let tbId = tbid
    let jobId = "LEAVE_SINGLE_USER:" + tbid;
    let delay = commandAcions.AddTime(120);
    const delayRes = await commandAcions.setDelay(jobId, new Date(delay));
    console.log("leaveSingleUser delayRes : ", delayRes);

    const wh1 = {
        _id: MongoID(tbId.toString())
    }
    const tabInfo = await AviatorTables.findOne(wh1, {}).lean();
    console.log("leaveSingleUser tabInfo : ", tabInfo);
    if (tabInfo.activePlayer == 1) {
        let playerInfos = tabInfo.playerInfo
        for (let i = 0; i < playerInfos.length; i++) {
            if (typeof playerInfos[i].seatIndex != "undefined") {
                await this.leaveTable({
                    reason: "singleUserLeave"
                }, {
                    uid: playerInfos[i]._id.toString(),
                    tbid: tabInfo._id.toString(),
                    seatIndex: playerInfos[i].seatIndex,
                    sck: playerInfos[i].sck,
                })
            }
        }

    }
}