const mongoose = require('mongoose');
const GameUser = mongoose.model('users');
const commonHelper = require('../helper/commonHelper');
const commandAcions = require("../helper/socketFunctions");
const CONST = require("../../constant");
const logger = require('../../logger');
const joinTable = require("./joinTable");
const gamePlay = require("./gamePlay");
const GameStart = require("./gameStart");


module.exports.JoinRobot = async (tableInfo, BetInfo) => {
    try {

        let user_wh = {
            Iscom: 1
        }

        let robotInfo = await GameUser.findOne(user_wh, {});
        logger.info("JoinRobot BNW ROBOT Info : ", robotInfo)


        await joinTable.findEmptySeatAndUserSeat(tableInfo, BetInfo, { uid: robotInfo._id });

    } catch (error) {
        logger.info("Robot Logic Join", error);
    }
}

module.exports.PlayRobot = async (tableInfo, PlayerInfo, Number) => {
    try {
        // Play Robot Logic 
        logger.info("PlayRobot ", tableInfo)

        if (PlayerInfo != undefined && tableInfo._id != undefined) {
            logger.info("PlayRobot  tableInfo ", tableInfo)

            //find total Robot 
            //and check out rendom 
            //PlayerInfo rendom number 

            let RobotPlayer = []
            let BetArray = [10, 50, 100, 200]

            PlayerInfo.forEach(e => {
                if (e.Iscom == 1) {
                    e.Number = GameStart.generateNumber(0, 1) ? GameStart.generateNumber(0, Number) : GameStart.generateNumber(Number, 60);
                    e.bet = BetArray[this.GetRandomInt(10, BetArray.length - 1)];
                    e.winamount = 0;

                    console.log("Number ", Number)
                    console.log("e.Number ", e.Number)


                    if (Number > e.Number) {
                        e.winamount = e.Number * e.bet;

                        rclient.hmset("BnW:" + tableInfo.uuid + ":" + e._id.toString() + ":" + e.winamount.toString(), { "uid": e._id.toString(), Number: e.Number }, function (err) {
                            rclient.expire("BnW:" + tableInfo.uuid + ":" + e._id.toString() + ":" + e.winamount.toString(), Math.round(e.Number) - 1)
                        })
                    }

                    delete e.profile
                    delete e.coins
                    delete e.status
                    delete e.playerStatus
                    delete e.chalValue
                    delete e.chalValue1
                    delete e.turnMissCounter
                    delete e.turnCount
                    delete e.sck
                    delete e.playerSocketId
                    delete e.playerLostChips
                    delete e.Iscom

                    RobotPlayer.push(e)
                }
            })
            commandAcions.sendEventInTable(tableInfo._id.toString(), CONST.BNW_BET_COUNTEING, { totalBlackChips: tableInfo.counters.totalBlackChips });

        } else {
            logger.info("PlayRobot else  Robot ", tableInfo, PlayerInfo);

        }

    } catch (error) {
        logger.info("Play Robot ", error);
    }
}

module.exports.GetRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}