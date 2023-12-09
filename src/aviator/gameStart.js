const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;
const GameUser = mongoose.model('users');
const AviatorTables = mongoose.model("aviatorTables");
const IdCounter = mongoose.model("idCounter")

const commandAcions = require("../helper/socketFunctions");
const CONST = require("../../constant");
const logger = require("../../logger");
const walletActions = require("./updateWallet");
const { config } = require("dotenv");

const botLogic = require("./botLogic");
const { v4: uuidv4 } = require('uuid');
// const leaveTableActions = require("./leaveTable");

module.exports.gameTimerStart = async (tb) => {
    try {
        logger.info("gameTimerStart tb : ", tb);
        if (tb.gameState != "") return false;

        let wh = {
            _id: tb._id,
            "playerInfo.seatIndex": {$exists:true}
        }
        let update = {
            $set: {
                gameState: "GameStartTimer",
                "GameTimer.GST": new Date(),
                "totalbet":0,
                "playerInfo.$.chalValue":0,
                "playerInfo.$.chalValue1":0
            }
        }
        logger.info("gameTimerStart UserInfo : ", wh, update);

        const tabInfo = await AviatorTables.findOneAndUpdate(wh, update, { new: true });
        logger.info("gameTimerStart tabInfo :: ", tabInfo);

        let roundTime = 5;
        commandAcions.sendEventInTable(tabInfo._id.toString(), CONST.GAME_START_TIMER, { timer: roundTime,history:tabInfo.history });

        let tbId = tabInfo._id;
        let jobId = CONST.GAME_START_TIMER + ":" + tbId;
        let delay = commandAcions.AddTime(roundTime);

        const delayRes = await commandAcions.setDelay(jobId, new Date(delay));

        this.startAviator(tbId)
    } catch (error) {
        logger.error("gameTimerStart.js error ->", error)
    }
}

module.exports.startAviator = async (tbId) => {

    try {

        const tb = await AviatorTables.findOne({
            _id: MongoID(tbId.toString()),
        }, {})

        logger.info("startAviator tbId : ", tbId);
        if (tb == null || tb.gameState != "GameStartTimer") return false;


        //Genrate Rendom Number 
        logger.info("startAviator config.AVIATORLOGIC : ", config.AVIATORLOGIC);
        logger.info("startAviator tb.totalbet : ", tb.totalbet);


        // NORMAL 
        let Number =  this.generateNumber(1,59)

        if(CONST.AVIATORLOGIC == "Client"){ // Client SIDE
            if(tb.totalbet >= 5){
                 Number = this.generateNumber(1,2)
            }else if(tb.totalbet < 5){
                 Number = this.generateNumber(1,5)
            }
        }else if(CONST.AVIATORLOGIC == "User"){  // User SIDE
             Number = this.generateNumber(1,10)
        }   
        console.log("Number ",Number)
        
        let wh = {
            _id: tbId
        }
        let update = {
            $set: {
                gameState: "StartEviator",
                rendomNumber:Number,
                uuid:uuidv4(),
                aviatorDate:new Date()
            },
            $push:{
                "history": {
                    $each: [Number],
                    $slice: -8
                }
            }
        }
        logger.info("startAviator UserInfo : ", wh, update);

        const tabInfo = await AviatorTables.findOneAndUpdate(wh, update, { new: true });
        logger.info("startAviator tabInfo :: ", tabInfo);

        commandAcions.sendEventInTable(tabInfo._id.toString(), CONST.STARTAVIATOR, { rendomNumber: Number });

        setTimeout(async ()=> {
            // Clear destory 
            const tabInfonew = await AviatorTables.findOneAndUpdate(wh, {
                $set: {
                    gameState: "",
                    rendomNumber:0,
                    aviatorDate:""
                }
            }, { new: true });

            this.gameTimerStart(tabInfonew);

            console.log("GAME :::::::::::::::::::::::::::::::gameTimerStart")
        },((Number+2) * 1000));

        botLogic.PlayRobot(tabInfo,tabInfo.playerInfo,Number)

    } catch (error) {
        logger.error("startAviator.js error ->", error)
    }

}       

module.exports.generateNumber=(minRange,maxRange)=>{

    // Generate a random decimal number between 0 (inclusive) and 1 (exclusive)
    const randomDecimal = Math.random().toFixed(2);
    console.log('Random Decimal:', randomDecimal);

    const randomWholeNumber = getRandomInt(minRange, maxRange);
    console.log('Random Whole Number:randomWholeNumber ', randomWholeNumber);

    console.log('Random Whole Number:', randomWholeNumber+parseFloat(randomDecimal));

    return (randomWholeNumber+parseFloat(randomDecimal))
}

// Generate a random whole number between a specified range (min and max)
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports.deduct = async (tabInfo, playerInfo) => {
    try {

        logger.info("\ndeduct playerInfo :: ", playerInfo);
        let seatIndexs = [];
        for (let i = 0; i < playerInfo.length; i++) {
            if (playerInfo[i] != {} && typeof playerInfo[i].seatIndex != "undefined" && playerInfo[i].status == "play") {
                seatIndexs.push(playerInfo[i].seatIndex);

                await walletActions.deductWallet(playerInfo[i]._id,-Number(tabInfo.boot), 1, "aviator Bet", tabInfo, playerInfo[i].sck, playerInfo[i].seatIndex);

                let update = {
                    $inc: {
                        "potValue": Number(tabInfo.boot),
                        "playerInfo.$.totalBet": Number(tabInfo.boot)
                    }
                }
                let uWh = { _id: MongoID(tabInfo._id.toString()), "playerInfo.seatIndex": Number(playerInfo[i].seatIndex) }
                logger.info("deduct uWh update ::", uWh, update)
                await AviatorTables.findOneAndUpdate(uWh, update, { new: true });
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
                await AviatorTables.findOneAndUpdate(uWh, update, { new: true });
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