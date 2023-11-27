const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;

const AviatorTables = mongoose.model("aviatorTables");
const GameUser = mongoose.model("users");

const CONST = require("../../constant");
const logger = require("../../logger");
const commandAcions = require("../helper/socketFunctions");

const admin = require('firebase-admin');
serviceAccount = require('../../firebaseToken.json');
const topic = 'LuckyHit';
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
/*
    
    Title:""
    Body:""

*/
module.exports.sendAllUser = async (requestData) => {
    try {
        
        const message = {
            notification: requestData,
            topic: topic, // Replace with the topic you want to send to
        };

        admin.messaging().send(message) // send noti from here
        .then((response) => {
            console.log('Successfully sent message:', response);
        })
        .catch((error) => {
            console.error('Error sending message:', error);
        });

        return true;
    } catch (e) {
        logger.info("Exception action : ", e);
    }
}

/*
    One User or multi user

    Title:""
    Body:""
    Tokens:[""]

*/

module.exports.sendPushNoti = async (requestData) => {
    try {
        
        const message = {
            notification: {
                title:requestData.Title,
                body:requestData.Body
            },
            tokens: requestData.Tokens, // Replace with the topic you want to send to
        };

        admin.messaging().send(message) // send noti from here
        .then((response) => {
            console.log('Successfully sent message:', response);
        })
        .catch((error) => {
            console.error('Error sending message:', error);
        });

        return true;
    } catch (e) {
        logger.info("Exception action : ", e);
    }
}


module.exports.subscribeToken = async (requestData) =>{

    if(requestData.fcmToken != undefined &&  requestData.fcmToken != null && requestData.fcmToken != "" ){

        admin.messaging().subscribeToTopic([requestData.fcmToken],topic)
        .then(() => {
            console.log(`Successfully subscribed user to topic: topic`);
        })
        .catch((error) => {
            console.error(`Error subscribing user to topic:topic`, error);
        });
    }else{
        console.error('Error subscribing user to requestData', requestData);
    }
}