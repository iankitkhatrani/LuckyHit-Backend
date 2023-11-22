const mongoose = require('mongoose');
const GameUser = mongoose.model('users');
const commonHelper = require('../helper/commonHelper');
const commandAcions = require("../helper/socketFunctions");
const CONST = require("../../constant");
const logger = require('../../logger');
const joinTable = require("./joinTable");
const gamePlay = require("./gamePlay");
const cardLogic = require("./cardLogic");



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

module.exports.PlayRobot = async (tableInfo,BetInfo,playerInGame) => {
    try {

        // Play Robot Logic 
        logger.info("PlayRobot ",tableInfo)
        logger.info("BetInfo ",BetInfo)

        if(BetInfo != undefined && BetInfo.playerId != undefined && tableInfo._id != undefined){

            
            console.log(cardLogic.GetRandomInt(0,1))

            let robotCardValue = cardLogic.valueOfCard(BetInfo.cards)

            console.log("robotCardValue .info ",robotCardValue)

            console.log("BetInfo.playStatus ",BetInfo.playStatus)


            //robotCardValue 1 2 3 4 5 

            if(BetInfo.isSee){
                //action Valu Funcation call
                console.log("BetInfo.playStatus ",BetInfo.isSee)
                //1. check potlimit over ho gaya tha ke nahi
                if(robotCardValue == 5 || robotCardValue == 4 || robotCardValue == 3 ){
                    // double chalValue value and action
                    //Chal chalValue 
                    gamePlay.action({ isIncrement: true },{uid:BetInfo.playerId,tbid:tableInfo._id,seatIndex:BetInfo.seatIndex,sck:""})

                }else if(robotCardValue == 2 || robotCardValue == 1){
                    //action chalValue Normal
                    gamePlay.action({ isIncrement: false },{uid:BetInfo.playerId,tbid:tableInfo._id,seatIndex:BetInfo.seatIndex,sck:""})

    
                }else {

                    console.log("playerInGame ",playerInGame)
                    if(cardLogic.GetRandomInt(0,10) >= 8){
                        if(playerInGame.length == 2)
                        {
                            gamePlay.show({ isIncrement: false },{uid:BetInfo.playerId,tbid:tableInfo._id,seatIndex:BetInfo.seatIndex,sck:""})
                        }else{
                            console.log("card PAck ")
                            gamePlay.cardPack({ isIncrement: false },{uid:BetInfo.playerId,tbid:tableInfo._id,seatIndex:BetInfo.seatIndex,sck:""})

                        }
                    }else{
                        gamePlay.action({ isIncrement: false },{uid:BetInfo.playerId,tbid:tableInfo._id,seatIndex:BetInfo.seatIndex,sck:""})

                    }
                    
                }
                
        
            }else {
                //Blind Valu Funcation call
                //1. check potlimit over ho gaya tha ke nahi
                logger.info("Blind  BetInfo.playStatus ",BetInfo.playStatus);

                gamePlay.seeCard({ },{uid:BetInfo.playerId,tbid:tableInfo._id,seatIndex:BetInfo.seatIndex,sck:""})



                if(robotCardValue == 5 || robotCardValue == 4 || robotCardValue == 3 ){
                    // double chalValue  value and action
                    //Blind chalValue 
                    gamePlay.action({ isIncrement: true },{uid:BetInfo.playerId,tbid:tableInfo._id,seatIndex:BetInfo.seatIndex,sck:""})

                    logger.info("Blind  robotCardValue  5 4 3 ",robotCardValue);
                    
                }else if(robotCardValue == 2 || robotCardValue == 1){
                    //Blind chalValue Normal
                    if(cardLogic.GetRandomInt(0,1)){
                        gamePlay.action({ isIncrement: true },{uid:BetInfo.playerId,tbid:tableInfo._id,seatIndex:BetInfo.seatIndex,sck:""})
                    }else{
                        gamePlay.action({ isIncrement: false },{uid:BetInfo.playerId,tbid:tableInfo._id,seatIndex:BetInfo.seatIndex,sck:""})
                    }
                    logger.info("Blind  robotCardValue  2 1 ",robotCardValue);
                    
                }else{
                    logger.info("Blind  robotCardValue  else  ",robotCardValue);
                   
                    if(tableInfo.potLimit/4 <= tableInfo.potValue && cardLogic.GetRandomInt(0,1)){
                        // Card Seen 
                        gamePlay.seeCard({ },{uid:BetInfo.playerId,tbid:tableInfo._id,seatIndex:BetInfo.seatIndex,sck:""})

                    }else{
                        gamePlay.action({ isIncrement: true },{uid:BetInfo.playerId,tbid:tableInfo._id,seatIndex:BetInfo.seatIndex,sck:""})
                    }

                }
            }
        }else{
            logger.info("PlayRobot else  Robot ", tableInfo,BetInfo);

        }
        
    } catch (error) {
        logger.info("Play Robot ", error);
    }
}