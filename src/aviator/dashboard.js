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
const avatarTable = mongoose.model("avatarTable");
const ShopTable = mongoose.model("ShopTable");
const Noticetext = mongoose.model('noticeText');
const mailTable = mongoose.model('mailTable');
const Banners = mongoose.model('banner');



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
            name:1,profileUrl:1,verify:1,uniqueId:1,email:1,mobileNumber:1,createdAt:1,DOB:1,Gender:1,Country:1
        }
        console.log("wh ",wh)
        const playerInfo = await GameUser.findOne(wh, project).lean();
        logger.info("action playerInfo : ", playerInfo);

        if (playerInfo == null) {
            logger.info("action user not turn ::", playerInfo);
            return false
        }
        
        let response = {
            playerInfo: playerInfo,
            countryList:["india","UAE","USA"]
        }
        sendEvent(client, CONST.MYPROFILE, response);
        return true;
    } catch (e) {
        logger.info("Exception action : ", e);
    }
}


/*
    

*/
module.exports.MYWALLET = async (requestData, client) => {
    try {
        logger.info("action requestData : ", requestData);
        if (typeof client.uid == "undefined") {
            commandAcions.sendDirectEvent(client.sck, CONST.MYWALLET, requestData, false, "User session not set, please restart game!");
            return false;
        }
        
        const wh = {
            _id: MongoID(client.uid.toString()),
        }
        const project = {
            name:1,chips:1,winningChips:1,bonusChips:1
        }
        console.log("wh ",wh)
        const playerInfo = await GameUser.findOne(wh, project).lean();
        logger.info("action playerInfo : ", playerInfo);

        if (playerInfo == null) {
            logger.info("action user not turn ::", playerInfo);
            return false
        }
        
        let response = {
            playerInfo: playerInfo,
            countryList:["india","UAE","USA"]
        }
        sendEvent(client, CONST.MYWALLET, response);
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
            commandAcions.sendDirectEvent(client.sck, CONST.UPDATEPROFILE, requestData, false, "User session not set, please restart game!");
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

        const UpdatePlayer = await GameUser.updateOne(wh, UpData)

        if(UpdatePlayer == null){
            logger.info("UpdatePlayer ::", UpdatePlayer);
            return false
        }

        const project = {
            name:1,profileUrl:1,verify:1,uniqueId:1,email:1,createdAt:1,DOB:1,Gender:1,Country:1
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
        sendEvent(client, CONST.UPDATEPROFILE, response);
        return true;
    } catch (e) {
        logger.info("Exception action : ", e);
    }
}


/*
    

*/
module.exports.AVATARLIST = async (requestData, client) => {
    try {
        logger.info("action requestData : ", requestData);
        if (typeof client.uid == "undefined") {
            commandAcions.sendDirectEvent(client.sck, CONST.AVATARLIST, requestData, false, "User session not set, please restart game!");
            return false;
        }
        
        
        const avatarInfo = await avatarTable.findOne({},{}).lean();
        logger.info("action avatarInfo : ", avatarInfo);

        if (avatarInfo == null) {
            logger.info("action user not turn ::", avatarInfo);
            return false
        }
        
        let response = {
            avatarInfo: avatarInfo.imageUrl
        }

        sendEvent(client, CONST.AVATARLIST, response);
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
            profileUrl:1,username:1,chips:1
        }
        const playerInfo = await GameUser.find(wh, project).sort({chips:-1});
        logger.info("action playerInfo : ", playerInfo);

        if (playerInfo == null) {
            logger.info("action user not turn ::", playerInfo);
            return false
        }
        
        let response = {
            playerInfo: playerInfo
        }
        sendEvent(client, CONST.LB, response);
        return true;
    } catch (e) {
        logger.info("Exception action : ", e);
    }
}

/*
    

*/
module.exports.SHOPLIST = async (requestData, client) => {
    try {
        logger.info("action requestData : ", requestData);
        if (typeof client.uid == "undefined") {
            commandAcions.sendDirectEvent(client.sck, CONST.SHOPLIST, requestData, false, "User session not set, please restart game!");
            return false;
        }
        
        
        const shopInfo = await ShopTable.find({},{}).lean();
        logger.info("action ShopTable : ", shopInfo);

        if (shopInfo == null) {
            logger.info("action user not turn ::", shopInfo);
            return false
        }
        
        let response = {
            shopInfo: shopInfo
        }

        sendEvent(client, CONST.SHOPLIST, response);
        return true;
    } catch (e) {
        logger.info("Exception action : ", e);
    }
}


/*
    

*/
module.exports.NOTICELIST = async (requestData, client) => {
    try {
        logger.info("action requestData : ", requestData);
        if (typeof client.uid == "undefined") {
            commandAcions.sendDirectEvent(client.sck, CONST.NOTICELIST, requestData, false, "User session not set, please restart game!");
            return false;
        }
        
        
        const noticeInfo = await Noticetext.find({},{}).lean();
        logger.info("action Noticetext : ", noticeInfo);

        if (noticeInfo == null) {
            logger.info("action user not turn ::", noticeInfo);
            return false
        }
        
        let response = {
            noticeInfo: noticeInfo
        }

        sendEvent(client, CONST.NOTICELIST, response);
        return true;
    } catch (e) {
        logger.info("Exception action : ", e);
    }
}


/*
    

*/
module.exports.MAILLIST = async (requestData, client) => {
    try {
        logger.info("action requestData : ", requestData);
        if (typeof client.uid == "undefined") {
            commandAcions.sendDirectEvent(client.sck, CONST.MAILLIST, requestData, false, "User session not set, please restart game!");
            return false;
        }
        
        
        constmailInfo = await mailTable.find({},{}).lean();
         logger.info("action MAILLIST : ",constmailInfo);

        if (constmailInfo == null) {
            logger.info("action user not turn ::",constmailInfo);
            return false
        }
       
        for (let i = 0; i < constmailInfo.length; i++) {
            if(constmailInfo[i].userId.indexOf(client.uid) != -1){
                constmailInfo.isread = 1
            }else{
                constmailInfo.isread = 0
            }
          }

        
        let response = {
           mailInfo:constmailInfo
        }

        sendEvent(client, CONST.MAILLIST, response);
        return true;
    } catch (e) {
        logger.info("Exception action : ", e);
    }
}

/*
    data:{_id:""}
*/
module.exports.MAILREAD = async (requestData, client) => {
    try {
        logger.info("action requestData : ", requestData);
        if (typeof client.uid == "undefined") {
            commandAcions.sendDirectEvent(client.sck, CONST.MAILREAD, requestData, false, "User session not set, please restart game!");
            return false;
        }
        
        
        mailTableUpdate = await mailTable.updateOne({_id:MongoID(data._id.toString()),},{$addToSet:{userId:client.uid}}).lean();
        logger.info("action MAILREAD : ",mailTableUpdate);

        if (mailTableUpdate == null) {
            logger.info("action user not turn ::",mailTableUpdate);
            sendEvent(client, CONST.MAILREAD, {status:false},false, "Mail Not read Status Update!");
            return false
        }
        
        sendEvent(client, CONST.MAILREAD, {status:true});
        return true;
    } catch (e) {
        logger.info("Exception action : ", e);
    }
}


/*
    data:{_id:""}
*/
module.exports.BANNERLIST = async (requestData, client) => {
    try {
        logger.info("action requestData : ", requestData);
        

        const bannerListData = await Banners.find({}, {})
       
        logger.info('admin/dahboard.js post dahboard  error => ', bannerListData);

        if (bannerListData == null) {
            logger.info("action user not turn ::",bannerListData);
            sendEvent(client, CONST.BANNERLIST, {status:false},false, "Not Banner List..!");
            return false
        }
        
        let response = {
            BannerList:bannerListData
        }
 
         sendEvent(client, CONST.BANNERLIST, response);
        return true;
    } catch (e) {
        logger.info("Exception action : ", e);
    }
}