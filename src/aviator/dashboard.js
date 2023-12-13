const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;
const AviatorTables = mongoose.model("aviatorTables");
const GameUser = mongoose.model("users");
const MyBetTable = mongoose.model("mybetlist");
const { sendEvent, sendDirectEvent, AddTime, setDelay, clearJob } = require('../helper/socketFunctions');
const CONST = require("../../constant");
const logger = require("../../logger");
const commandAcions = require("../helper/socketFunctions");
const walletActions = require("./updateWallet");

/*
    

*/
module.exports.MYPROFILE = async (requestData, client) => {
    try {
        logger.info("action requestData : ", requestData);
        if (typeof client.uid == "undefined") {
            commandAcions.sendDirectEvent(client.sck, CONST.MP, requestData, false, "User session not set, please restart game!");
            return false;
        }
        if (typeof client.action != "undefined" && client.action) return false;

        client.action = true;

        const wh = {
            _id: MongoID(client.tbid.toString()),
            gameState:"GameStartTimer"
        }
        const project = {

        }
        console.log("wh ",wh)
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
            $inc:{
                
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
        console.log("tabInfo.uuid ",tabInfo.uuid)
        this.MybetInsert(tabInfo.uuid,chalvalue,0,0,client)

        if(requestData.actionplace == 1)
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
            userid:client.uid
        }
        sendEvent(client, CONST.ACTION, response);


        commandAcions.sendEventInTable(tb._id.toString(), CONST.TABLEACTION, response);

        delete client.action;

       
        
        return true;
    } catch (e) {
        logger.info("Exception action : ", e);
    }
}