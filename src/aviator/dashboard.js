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
            commandAcions.sendDirectEvent(client.sck, CONST.MYPROFILE, requestData, false, "User session not set, please restart game!");
            return false;
        }
        
        const wh = {
            _id: MongoID(client.uid.toString()),
        }
        const project = {
            name:1,profileUrl:1,verify:1,uniqueId:1,email:1,mobileNumber:1,createdAt:1,DOB:1,Gender:1,Country:1,Pancard:1,Adharcard:1
        }
        console.log("wh ",wh)
        const playerInfo = await GameUser.findOne(wh, project).lean();
        logger.info("action playerInfo : ", playerInfo);

        if (playerInfo == null) {
            logger.info("action user not turn ::", playerInfo);
            return false
        }
        
        let response = {
            playerInfo: playerInfo
        }
        sendEvent(client, CONST.MYPROFILE, response);
        return true;
    } catch (e) {
        logger.info("Exception action : ", e);
    }
}


/*
    

*/
module.exports.UPDATEPROFILE = async (requestData, client) => {
    try {
        logger.info("action requestData : ", requestData);
        if (typeof client.uid == "undefined") {
            commandAcions.sendDirectEvent(client.sck, CONST.MYPROFILE, requestData, false, "User session not set, please restart game!");
            return false;
        }
        
        const wh = {
            _id: MongoID(client.uid.toString()),
        }
        const UpData={
            $set:{

            }
        }

        if(requestData.profileUrl != undefined){
            UpData["$set"]["profileUrl"] = requestData.profileUrl
        }

        if(requestData.name != undefined){
            UpData["$set"]["name"] = requestData.name
        }

        if(requestData.email != undefined){
            UpData["$set"]["email"] = requestData.email
        }

        if(requestData.mobileNumber != undefined){
            UpData["$set"]["mobileNumber"] = requestData.mobileNumber
            UpData["$set"]["verify.mobileno"] = false
        }

        if(requestData.DOB != undefined){
            UpData["$set"]["DOB"] = requestData.DOB
        }

        if(requestData.Gender != undefined){
            UpData["$set"]["Gender"] = requestData.Gender
        }

        if(requestData.Country != undefined){
            UpData["$set"]["Country"] = requestData.Country
        }

        if(requestData.Pancard != undefined){
            UpData["$set"]["Pancard"] = requestData.Pancard
        }
        if(requestData.Adharcard != undefined){
            UpData["$set"]["Adharcard"] = requestData.Adharcard
        }

        const project = {
            name:1,profileUrl:1,verify:1,uniqueId:1,email:1,createdAt:1,DOB:1,Gender:1,Country:1,Pancard:1,Adharcard:1
        }
        console.log("wh ",wh)
        const playerInfo = await GameUser.findOne(wh, project).lean();
        logger.info("action playerInfo : ", playerInfo);

        if (playerInfo == null) {
            logger.info("action user not turn ::", playerInfo);
            return false
        }
        
        let response = {
            playerInfo: playerInfo[0]
        }
        sendEvent(client, CONST.MYPROFILE, response);
        return true;
    } catch (e) {
        logger.info("Exception action : ", e);
    }
}


/*
    LB
*/
module.exports.LB = async (requestData, client) => {
    try {
        logger.info("action requestData : ", requestData);
        if (typeof client.uid == "undefined") {
            commandAcions.sendDirectEvent(client.sck, CONST.MYPROFILE, requestData, false, "User session not set, please restart game!");
            return false;
        }
        
        const wh = {
           Iscom:0
        }
        const project = {
            profileUrl:1,name:1,chips:1
        }
        const playerInfo = await GameUser.findOne(wh, project).sort({chips:-1});
        logger.info("action playerInfo : ", playerInfo);

        if (playerInfo == null) {
            logger.info("action user not turn ::", playerInfo);
            return false
        }
        
        let response = {
            playerInfo: playerInfo[0]
        }
        sendEvent(client, CONST.LB, response);
        return true;
    } catch (e) {
        logger.info("Exception action : ", e);
    }
}