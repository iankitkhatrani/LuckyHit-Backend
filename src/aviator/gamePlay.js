const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;
const AviatorTables = mongoose.model("aviatorTables");
const GameUser = mongoose.model("users");
const MyBetTable = mongoose.model("mybetlist");
const GameHistory = mongoose.model("GameHistory");

const { sendEvent, sendDirectEvent, AddTime, setDelay, clearJob } = require('../helper/socketFunctions');
const CONST = require("../../constant");
const logger = require("../../logger");
const commandAcions = require("../helper/socketFunctions");
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
            gameState: "GameStartTimer"
        }
        const project = {

        }
        console.log("wh ", wh)
        const tabInfo = await AviatorTables.findOne(wh, project).lean();
        logger.info("action tabInfo : ", tabInfo);

        if (tabInfo == null) {
            logger.info("action user not turn ::", tabInfo);
            delete client.action;
            return false
        }
        if ((requestData.actionplace == 1 && tabInfo.playerInfo[client.seatIndex].chalValue != 0) ||
            (requestData.actionplace == 2 && tabInfo.playerInfo[client.seatIndex].chalValue1 != 0)
        ) {
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
            $inc: {

            }
        }
        let chalvalue = currentBet;
        updateData.$set["playerInfo.$.playStatus"] = "action"

        let totalWallet = Number(UserInfo.chips) + Number(UserInfo.winningChips)

        if (Number(chalvalue) > Number(totalWallet)) {
            logger.info("action client.su ::", client.seatIndex);
            delete client.action;
            commandAcions.sendDirectEvent(client.sck, CONST.ACTION, requestData, false, "Please add wallet!!");
            return false;
        }
        chalvalue = Number(Number(chalvalue).toFixed(2))

        await walletActions.deductWallet(client.uid, -chalvalue, 2, "aviator action", tabInfo, client.id, client.seatIndex);



        await this.AddGameHistory({
            "userId": client.uid,
            "DateTime": new Date(),
            "Name": UserInfo.username,
            "PhoneNumber": UserInfo.mobileNumber,
            "RoomId": tabInfo.uuid,
            "Amount": chalvalue,
            "Type": "debit_action",
            "game": "aviator"
        });


        console.log("tabInfo.uuid ", tabInfo.uuid)
        this.MybetInsert(tabInfo.uuid, chalvalue, 0, 0, client)

        if (requestData.actionplace == 1)
            updateData.$set["playerInfo.$.chalValue"] = chalvalue;
        else
            updateData.$set["playerInfo.$.chalValue1"] = chalvalue;


        updateData.$inc["totalbet"] = chalvalue;
        //updateData.$set["turnDone"] = true;
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
            chalValue: chalvalue,
            userid: client.uid
        }
        sendEvent(client, CONST.ACTION, response);


        commandAcions.sendEventInTable(tb._id.toString(), CONST.TABLEACTION, response);

        delete client.action;



        return true;
    } catch (e) {
        logger.info("Exception action : ", e);
    }
}


/*
    bet : 10,
    actionplace:1 || 2

*/
module.exports.Cancel = async (requestData, client) => {
    try {
        logger.info("action requestData : ", requestData);
        if (typeof client.tbid == "undefined" || typeof client.uid == "undefined" || typeof client.seatIndex == "undefined" || typeof requestData.bet == "undefined") {
            commandAcions.sendDirectEvent(client.sck, CONST.CANCEL, requestData, false, "User session not set, please restart game!");
            return false;
        }
        if (typeof client.CANCEL != "undefined" && client.CANCEL) return false;

        client.CANCEL = true;

        const wh = {
            _id: MongoID(client.tbid.toString()),
            gameState: "GameStartTimer"
        }
        const project = {

        }
        console.log("wh ", wh)
        const tabInfo = await AviatorTables.findOne(wh, project).lean();
        logger.info("CANCEL tabInfo : ", tabInfo);

        if (tabInfo == null) {
            logger.info("CANCEL user not turn ::", tabInfo);
            delete client.CANCEL;
            return false
        }
        if ((requestData.actionplace == 1 && tabInfo.playerInfo[client.seatIndex].chalValue == 0) ||
            (requestData.actionplace == 2 && tabInfo.playerInfo[client.seatIndex].chalValue1 == 0)
        ) {
            logger.info("action : client.su ::", client.seatIndex);
            delete client.CANCEL;
            commandAcions.sendDirectEvent(client.sck, CONST.CANCEL, requestData, false, "Turn is already taken!");
            return false;
        }

        let playerInfo = tabInfo.playerInfo[client.seatIndex];
        let currentBet = Number(requestData.bet);

        logger.info("CANCEL currentBet ::", currentBet);

        let gwh = {
            _id: MongoID(client.uid)
        }
        let UserInfo = await GameUser.findOne(gwh, {}).lean();
        logger.info("CANCEL UserInfo : ", gwh, JSON.stringify(UserInfo));

        let updateData = {
            $set: {

            },
            $inc: {

            }
        }
        let chalvalue = currentBet;
        updateData.$set["playerInfo.$.playStatus"] = ""

        // let totalWallet = Number(UserInfo.chips) + Number(UserInfo.winningChips)

        // if (Number(chalvalue) > Number(totalWallet)) {
        //     logger.info("CANCEL client.su ::", client.seatIndex);
        //     delete client.CANCEL;
        //     commandAcions.sendDirectEvent(client.sck, CONST.CANCEL, requestData, false, "Please add wallet!!");
        //     return false;
        // }
        chalvalue = Number(Number(chalvalue).toFixed(2))

        await walletActions.addWallet(client.uid, chalvalue, 2, "aviator bet Cancel", tabInfo, client.id, client.seatIndex);


        await this.AddGameHistory({
            "userId": client.uid,
            "DateTime": new Date(),
            "Name": UserInfo.username,
            "PhoneNumber": UserInfo.mobileNumber,
            "RoomId": tabInfo.uuid,
            "Amount": chalvalue,
            "Type": "credit_cancel",
            "game": "aviator"
        });

        if (requestData.actionplace == 1)
            updateData.$set["playerInfo.$.chalValue"] = 0;
        else
            updateData.$set["playerInfo.$.chalValue1"] = 0;


        updateData.$inc["totalbet"] = -chalvalue;
        //updateData.$set["turnDone"] = true;
        commandAcions.clearJob(tabInfo.job_id);

        const upWh = {
            _id: MongoID(client.tbid.toString()),
            "playerInfo.seatIndex": Number(client.seatIndex)
        }
        logger.info("CANCEL upWh updateData :: ", upWh, updateData);

        const tb = await AviatorTables.findOneAndUpdate(upWh, updateData, { new: true });
        logger.info("CANCEL tb : ", tb);

        MyBetTable.deleteOne({ uuid: tabInfo.uuid, uid: client.uid, chalvalue: chalvalue })

        let response = {
            seatIndex: tb.turnSeatIndex,
            chalValue: 0,
            actionplace: requestData.actionplace,
            userid: client.uid
        }

        sendEvent(client, CONST.CANCEL, response);


        commandAcions.sendEventInTable(tb._id.toString(), CONST.TABLECANCEL, response);


        delete client.CANCEL;



        return true;
    } catch (e) {
        logger.info("Exception CANCEL : ", e);
    }
}

/*
    betAmount : 10,
    actionPlace:1 || 2
    checkout: 2.5

    CheckOut(int betAmount, int ,float checkout)


*/
module.exports.CHECKOUT = async (requestData, client) => {
    try {
        logger.info("check out requestData : ", requestData);
        if (typeof client.tbid == "undefined" || typeof client.uid == "undefined" || typeof client.seatIndex == "undefined" || typeof requestData.bet == "undefined") {
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
        if ((requestData.actionplace == 1 && tabInfo.playerInfo[client.seatIndex].chalValue == 0) ||
            (requestData.actionplace == 2 && tabInfo.playerInfo[client.seatIndex].chalValue1 == 0)
        ) {
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

        winAmount = Number(Number(requestData.bet) * (requestData.checkout))
        console.log("winAmount ", winAmount)

        Deductcom = Number((winAmount * 2) / 100)

        winAmount = Number(winAmount - Deductcom).toFixed(2);

        console.log("winAmount :::::::::::::::::::::::::::::", winAmount)

        await walletActions.addWallet(client.uid, winAmount, 2, "aviator Win", tabInfo, client.id, client.seatIndex);

        console.log("winAmount :::::::::::::::::::::::::::::", winAmount)

        await this.AddGameHistory({
            "userId": client.uid,
            "DateTime": new Date(),
            "Name": UserInfo.username,
            "PhoneNumber": UserInfo.mobileNumber,
            "RoomId": tabInfo.uuid,
            "Amount": winAmount,
            "Type": "credit_win",
            "game": "aviator"
        });

        console.log("Deductcom ", Deductcom)

        if (requestData.actionplace == 1)
            updateData.$set["playerInfo.$.chalValue"] = 0;
        else
            updateData.$set["playerInfo.$.chalValue1"] = 0;


        //updateData.$set["turnDone"] = true;
        commandAcions.clearJob(tabInfo.job_id);

        const upWh = {
            _id: MongoID(client.tbid.toString()),
            "playerInfo.seatIndex": Number(client.seatIndex)
        }
        logger.info("action upWh updateData :: ", upWh, updateData);

        const tb = await AviatorTables.findOneAndUpdate(upWh, updateData, { new: true });
        logger.info("action requestData.checkout ", requestData.checkout);

        this.MybetInsert(tabInfo.uuid, 0, requestData.checkout, winAmount, client)

        let response = {
            seatIndex: tb.turnSeatIndex,
            winamount: winAmount,
            userid: client.uid,
            bet: requestData.bet,
            checkout: requestData.checkout
        }
        //commandAcions.sendEventInTable(tb._id.toString(), CONST.CHECKOUT, response);
        sendEvent(client, CONST.CHECKOUT, response);
        commandAcions.sendEventInTable(tb._id.toString(), CONST.TABLECHECKOUT, response);
        delete client.action;

        return true;
    } catch (e) {
        logger.info("Exception action : ", e);
    }
}

/*
    
*/
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
        const project = {

        }
        console.log("wh ", wh)
        const mybetlist = await MyBetTable.find(wh, project).sort({ _id: -1 }).limit(10).lean();
        logger.info("mybetlist mybetlist : ", mybetlist);

        if (mybetlist == null) {
            logger.info("mybetlist bet data not found  ::", mybetlist);
            return false
        }

        console.log("mybetlist ", mybetlist)


        sendEvent(client, CONST.MYBET, { mybetlist: mybetlist });

        return true;
    } catch (e) {
        logger.info("Exception CANCEL : ", e);
    }
}

/*
    amount:0,
    x:10,
    winamount:100,
    clinet:{}
*/
module.exports.MybetInsert = async (gameId, amount, x, winamount, client) => {

    try {
        logger.info("MybetInsert requestData gameId: ", gameId);
        logger.info("MybetInsert requestData amount: ", amount);
        logger.info("MybetInsert requestData x: ", x);
        logger.info("MybetInsert requestData winamount: ", winamount);

        if (typeof client.tbid == "undefined" || typeof client.uid == "undefined") {
            logger.info("MybetInsert If requestData : ");
            return false;
        }
        if (winamount != 0) {
            let upWh = {
                gameId: gameId,
                uid: client.uid
            }
            let updateData = {
                x: x,
                winamount: winamount
            }

            console.log("upWh ", upWh)
            console.log("updateData ", updateData)


            const tb = await MyBetTable.findOneAndUpdate(upWh, updateData, { new: true });
        } else {

            let insertobj = {
                gameId: gameId,
                betamount: amount,
                x: x,
                winamount: winamount,
                uid: client.uid
            }

            let insertInfo = await MyBetTable.create(insertobj);
            logger.info("MybetInsert insertInfo : ", insertInfo);

        }
    } catch (e) {
        logger.info("Exception Mybetlist : ", e);
    }



}


module.exports.Redisbinding = async () => {
    //subscribing for heabeats expiration
    rclient1.send_command('config', ['set', 'notify-keyspace-events', 'Ex'])
    rclient1.subscribe('__keyevent@10__:expired');
    // console.log("Redisbinding ")
    rclient1.on('message', function (channel, msg, type) {
        var obj = msg.split(":")
        // console.log("Obj ::::::::::::::::", obj)
        if (obj.length > 3 && obj[0] != undefined && obj[1] != undefined
            && obj[2] != undefined && obj[3] != undefined && obj[4] != undefined && obj[5] != undefined && obj[6] != undefined) {
            let response = {
                seatIndex: -1,
                winamount: Number(obj[3]),
                userid: obj[2],
                bet: Number(obj[5]),
                checkout: Number(obj[6])

            }

            commandAcions.sendEventInTable(obj[4], CONST.TABLECHECKOUT, response);
        }
    });

}


module.exports.AddGameHistory = async (obj) => {

    await GameHistory.create(obj)

    return false
}