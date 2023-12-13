const mongoose = require('mongoose');
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

        let user_wh = {
            Iscom: 1,
            //type:'free'
        }

        let robotInfo = await GameUser.findOne(user_wh, {});
        logger.info("JoinRobot ROBOT Info : ", robotInfo)
        if(robotInfo == null){
            logger.info("JoinRobot ROBOT Not Found  : ")
            return false
        }

        await GameUser.updateOne(user_wh, {$set:{type:"busy"}});
        await joinTable.findEmptySeatAndUserSeat(tableInfo, {uid:robotInfo._id});

    } catch (error) {
        logger.info("Robot Logic Join", error);
    }
}

module.exports.PlayRobot = async (tableInfo,PlayerInfo,Number) => {
    try {

        // Play Robot Logic 
        logger.info("PlayRobot ",tableInfo)
        logger.info("Number ",Number)

        
        if(PlayerInfo != undefined  && tableInfo._id != undefined){
                                                                                                                                                                                                                               
            
            logger.info("PlayRobot  tableInfo ",tableInfo)

            //find total Robot 
            //and check out rendom 
            //PlayerInfo rendom number 
            let RobotPlayer = []
            let BetArray= [10,50,100,200,150,60,160,360,1000]

            PlayerInfo.forEach(e => {
                if(e.Iscom == 1){
                    e.Number = GameStart.generateNumber(0,1)?GameStart.generateNumber(0,Number):GameStart.generateNumber(Number,60);
                    e.bet =  BetArray[this.GetRandomInt(0,BetArray.length-1)];
                    e.winamount = 0;

                    if(Number > e.Number){
                        e.winamount =  e.Number * e.bet;
                    }

                    RobotPlayer.push(e)
                }
            })

            // Genrate Rendome Number 
            // 0 to Number
            
            commandAcions.sendEventInTable(tableInfo._id.toString(), CONST.ROBOTPLAY, { RobotPlayer: RobotPlayer });
   

        }else{
            logger.info("PlayRobot else  Robot ", tableInfo,PlayerInfo);

        }
        
    } catch (error) {
        logger.info("Play Robot ", error);
    }
}


module.exports.GetRandomInt=(min,max)=>{
    return Math.floor(Math.random() * (max - min + 1)) + min;
}