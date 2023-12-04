const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;

const CONST = require("../../constant");
const commandAcions = require('../helper/socketFunctions');
const gamePlayActions = require("./gamePlay");
const logger = require("../../logger");
const botLogic = require("./botLogic");

const AviatorTables = mongoose.model("aviatorTables");

module.exports.getPlayingUserInRound = async (p) => {
    try {

        let pl = [];
        if (typeof p == 'undefined' || p == null)
            return pl;

        for (let x = 0; x < p.length; x++) {
            if (typeof p[x] == 'object' && p[x] != null && typeof p[x].seatIndex != 'undefined')
                pl.push(p[x]);
        }
        return pl;
    } catch (error) {
        logger.error('roundStart.js getPlayingUserInRound error : ', error);
    }
}
