const mongoose = require('mongoose');
const GameUser = mongoose.model('users');
const commonHelper = require('../helper/commonHelper');
const commandAcions = require("../helper/socketFunctions");
const CONST = require("../../constant");
const logger = require('../../logger');
const joinTable = require("./joinTable");
const gamePlay = require("./gamePlay");



module.exports.JoinRobot = async (tableInfo,BetInfo) => {
    try {

        let user_wh = {
            Iscom: 1
        }

        let robotInfo = await GameUser.findOne(user_wh, {});
        logger.info("JoinRobot ROBOT Info : ", robotInfo)


        await joinTable.findEmptySeatAndUserSeat(tableInfo, BetInfo, {uid:robotInfo._id});

    } catch (error) {
        logger.info("Robot Logic Join", error);
    }
}

module.exports.PlayRobot = async (tableInfo,PlayerInfo,Number) => {
    try {

        // Play Robot Logic 
        logger.info("PlayRobot ",tableInfo)
        
        if(PlayerInfo != undefined  && tableInfo._id != undefined){
                                                                                                                                                                                                                               
            
            logger.info("PlayRobot  tableInfo ",tableInfo)

            //find total Robot 
            //and check out rendom 
            //PlayerInfo rendom number 

            

            

        }else{
            logger.info("PlayRobot else  Robot ", tableInfo,PlayerInfo);

        }
        
    } catch (error) {
        logger.info("Play Robot ", error);
    }
}