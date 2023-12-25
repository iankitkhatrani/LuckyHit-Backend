const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;
const PlayingTables = mongoose.model("blackNwhiteTables");

const commandAcions = require("../helper/socketFunctions");
const gameStartActions = require("./gameStart");
const logger = require("../../logger");

module.exports.roundFinish = async (tb) => {
    try {
        logger.info("\n roundFinish tb :: ", tb);

        let wh = {
            _id: MongoID(tb._id.toString())
        }
        let update = {
            $set: {
                BNWCards: { black: [], white: [] },
                counters: {
                    totalBlackChips: 0,
                    totalWhiteChips: 0,
                    totalHitChips: 0,
                },
                gameTracks: [],
                gameId: "",
                gameState: "",
                isLastUserFinish: false,
                isFinalWinner: false,
                callFinalWinner: false,
                hukum: "",
                chalValue: 0,
                potValue: 0,
                turnDone: false,
                jobId: "",
            },
            $unset: {
                gameTimer: 1
            }
        }
        logger.info("roundFinish wh :: ", wh, update);

        let tbInfo = await PlayingTables.findOneAndUpdate(wh, update, { new: true });
        logger.info("roundFinish tbInfo : ", tbInfo);
        let tableId = tbInfo._id;

        let jobId = commandAcions.GetRandomString(5);
        let delay = commandAcions.AddTime(5);
        const delayRes = await commandAcions.setDelay(jobId, new Date(delay));
        logger.info("roundFinish delayRes : ", delayRes);

        const wh1 = {
            _id: MongoID(tableId.toString())
        }
        const tabInfo = await PlayingTables.findOne(wh1, {}).lean();
        if (tabInfo.activePlayer >= 1)
            await gameStartActions.gameTimerStart(tabInfo);

        return true;
    } catch (err) {
        logger.info("Exception roundFinish : ", err)
    }
}