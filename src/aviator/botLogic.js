const mongoose = require('mongoose');
const MongoID = mongoose.Types.ObjectId;
const GameUser = mongoose.model('users');
const commonHelper = require('../helper/commonHelper');
const commandAcions = require("../helper/socketFunctions");
const CONST = require("../../constant");
const logger = require('../../logger');
const joinTable = require("./joinTable");
const gamePlay = require("./gamePlay");
const GameStart = require("./gameStart");


module.exports.JoinRobot = async (tableInfo) => {
    try {

        let RobotPlayer = []

        //console.log("tableInfo.playerInfo ",tableInfo.playerInfo)

        tableInfo.playerInfo.forEach(e => {
            //console.log("tableInfo.playerInfo ",e)
            if (e.Iscom == 1) {
                RobotPlayer.push(MongoID(e._id))
            }
        })

        let user_wh = {
            Iscom: 1,
            "_id": { $nin: RobotPlayer }
        }

        logger.info("JoinRobot ROBOT Not user_wh   : ", user_wh)


        let robotInfo = await GameUser.findOne(user_wh, {});
        logger.info("JoinRobot ROBOT Info : ", robotInfo)
        if (robotInfo == null) {
            logger.info("JoinRobot ROBOT Not Found  : ")
            return false
        }

        await GameUser.updateOne(user_wh, { $set: { type: "busy" } });
        await joinTable.findEmptySeatAndUserSeat(tableInfo, { uid: robotInfo._id });

    } catch (error) {
        logger.info("Robot Logic Join", error);
    }
}

module.exports.PlayRobot = async (tableInfo, PlayerInfo, Number) => {
    try {
        // Play Robot Logic 
        logger.info("PlayRobot ", tableInfo)
        logger.info("Number ", Number)


        if (PlayerInfo != undefined && tableInfo._id != undefined) {

            logger.info("PlayRobot  tableInfo ", tableInfo)

            //find total Robot 
            //and check out rendom 
            //PlayerInfo rendom number 
            let RobotPlayer = []
            let BetArray = [10, 50, 100, 200, 150, 60, 160, 360, 1000]

            PlayerInfo.forEach(e => {
                if (e.Iscom == 1) {
                    logger.info("PlayRobot  Under Is Com ")
                    e.Number = GameStart.generateNumber(0, 1) ? GameStart.generateNumber(0, Number) : GameStart.generateNumber(Number, 60);
                    e.bet = BetArray[this.GetRandomInt(0, BetArray.length - 1)];
                    e.winamount = 0;

                    //console.log("Number ",Number)
                    //console.log("e.Number ",e.Number)


                    if (Number > e.Number) {
                        e.winamount = e.Number * e.bet;

                        rclient.hmset("Aviator:" + tableInfo.uuid + ":" + e._id.toString() + ":" + e.winamount.toString() + ":" + tableInfo._id + ":" + e.Number + ":" + e.bet, { "uid": e._id.toString(), Number: e.Number }, function (err) {
                            rclient.expire("Aviator:" + tableInfo.uuid + ":" + e._id.toString() + ":" + e.winamount.toString() + ":" + tableInfo._id + ":" + e.Number + ":" + e.bet, Math.round(e.Number) - 1)

                        })
                    }

                    RobotPlayer.push(e)
                }
            })

            // Genrate Rendome Number 
            // 0 to Number
            commandAcions.sendEventInTable(tableInfo._id.toString(), CONST.ROBOTPLAY, { RobotPlayer: RobotPlayer });

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