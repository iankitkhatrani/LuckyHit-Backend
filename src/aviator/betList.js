const mongoose = require('mongoose');
const commandAcions = require("../helper/socketFunctions");
const CONST = require("../../constant");
const logger = require('../../logger');
const BetLists = mongoose.model('betList');

module.exports.getBetList = async (requestData, client) => {
    try {
        let listInfo = await BetLists.aggregate([
            { $sort: { _id: 1 } },
            {
                $project: {
                    "betId": '$_id',
                    "_id": 0,
                    "boot": '$entryFee',
                    "chalLimit": "$chalLimit",
                    "potLimit": "$potLimit",
                    "totalPlayer": "$totalPlayer",
                }
            }

        ]);
        logger.info("BetList data : ", JSON.stringify(listInfo));

        let response = {
            "List": listInfo
        }
        client.uid = requestData.user_id;
        client.sck = client.id;
        commandAcions.sendEvent(client, CONST.GET_TEEN_PATTI_ROOM_LIST, response);

    } catch (error) {
        logger.info("GET_TEEN_PATTI_ROOM_LIST", error);
    }
}