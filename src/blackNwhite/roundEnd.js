const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;
const PlayingTables = mongoose.model("blackNwhiteTables");

const commandAcions = require("../helper/socketFunctions");
const gameStartActions = require("./gameStart");
const logger = require("../../logger");

module.exports.roundFinish = async (tb) => {
    try {

        /*        leave BOT        */
        // let whr = {
        //     _id: MongoID(tb._id.toString()),
        //     "playerInfo.Iscom": 1,
        // };
        // let updateData = {
        //     $set: {
        //         "playerInfo.$": {}
        //     },
        //     $inc: {
        //         activePlayer: -1
        //     }
        // }
        // tb = await PlayingTables.findOneAndUpdate(whr, updateData, { new: true });
        // logger.info("Remove Bot : ", tb);

        logger.info("\n roundFinish tb :: ", tb);
        tb = await this.resetPlayer(tb)
        logger.info("\n get reset player details roundFinish tb :: ", tb);

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

module.exports.resetPlayer = async (tb) => {
    try {
        const playerInGame = await this.getPlayingUserInTable(tb.playerInfo);

        for (const player of playerInGame) {
            logger.info("player -- > ", player);
            if (player.playerId) {
                let uWh1 = {
                    _id: MongoID(tb._id.toString()),
                    'playerInfo.seatIndex': Number(player.seatIndex),
                };

                let dataUpdate = {
                    $set: {
                        'playerInfo.$.status': '',
                        'playerInfo.$.finished': false,
                        'playerInfo.$.betLists': []
                    },
                };

                tb = await PlayingTables.findOneAndUpdate(uWh1, dataUpdate, { new: true });
                logger.info('\n roundFinish restart Table', tb);
                logger.info('\n\n 1111 roundFinish restart Table', JSON.stringify(tb));
            }
        }

        let uh = {
            _id: MongoID(tb._id.toString()),
        };
        tb = await PlayingTables.findOne(uh, {}).lean();
        logger.info('\n roundFinish restart Table', tb);
        return tb

    } catch (e) {
        logger.error(' resetPlayer error : ', e);
    }
};

module.exports.getPlayingUserInTable = async (p) => {
    try {
        // logger.info("\n get getPlayingUserInTable Round p :", p);
        let pl = [];
        if (typeof p === 'undefined' || p === null) {
            logger.info('\n get table Playing User In Round p find Null:', p);
            return pl;
        }


        for (let x = 0; x < p.length; x++) {
            if (typeof p[x] === 'object' && p[x] !== null && typeof p[x].seatIndex !== 'undefined') {
                pl.push(p[x]);
            }
        }
        return pl;
    } catch (e) {
        logger.error('leaveTable.js getPlayingUserInTable error : ', e);
    }
};