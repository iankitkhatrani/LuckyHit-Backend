const mongoose = require('mongoose');
const MongoID = mongoose.Types.ObjectId;
const GameUser = mongoose.model('users');
const PlayingTables = mongoose.model("blackNwhiteTables");

const commandAcions = require("../helper/socketFunctions");
const CONST = require("../../constant");
const logger = require('../../logger');
const joinTable = require("./joinTable");
const { getRandomInt } = require('./cardLogic');

module.exports.JoinRobot = async (tableInfo) => {
    try {

        let RobotPlayer = []

        logger.info("BnW tableInfo playerInfo =>", tableInfo.playerInfo)

        tableInfo.playerInfo.forEach(e => {
            logger.info("tableInfo.playerInfo ", e)
            if (e.Iscom == 1) {
                RobotPlayer.push(MongoID(e._id).toString())
            }
        })

        let user_wh = {
            Iscom: 1,
            "_id": { $nin: RobotPlayer }
        }

        logger.info("BnW JoinRobot ROBOT Not user_wh   : ", user_wh)


        let robotInfo = await GameUser.findOne(user_wh, {});
        logger.info("JoinRobot ROBOT Info : ", robotInfo)

        if (robotInfo == null) {
            logger.info("JoinRobot ROBOT Not Found  : ")
            return false
        }

        await joinTable.findEmptySeatAndUserSeat(tableInfo, { uid: robotInfo._id });

    } catch (error) {
        logger.info("Robot Logic Join", error);
    }
}

module.exports.PlayRobot = async (tableInfo, PlayerInfo) => {

    try {
        // Play Robot Logic
        logger.info("BNW PlayRobot ", tableInfo)

        if (PlayerInfo != undefined && tableInfo._id != undefined) {
            logger.info("PlayRobot  tableInfo ", tableInfo)

            let RobotPlayer = []
            let BetArray = [10, 20, 50, 100, 200, 10, 20, 5000, 50]
            let BetType = ['Black', 'White', 'LuckyHit', 'Black', 'White',]

            async function processPlayerInfo(PlayerInfo) {
                for (const e of PlayerInfo) {
                    logger.info("PlayRobot E -->", e);
                    if (e.Iscom == 1) {
                        let betLists = BetType[getRandomInt(0, BetType.length - 1)];
                        let bet = BetArray[getRandomInt(0, BetArray.length - 1)];

                        logger.info("PlayRobot betIndex ", bet);
                        logger.info("PlayRobot betLists ", betLists);

                        RobotPlayer.push(e);

                        if (betLists == 'Black') {
                            let updateData = {
                                $set: {},
                                $inc: {},
                            };
                            e.betLists.push({ tableId: tableInfo._id, playerId: e._id, type: betLists, betAmount: bet });
                            updateData.$inc['counters.totalBlackChips'] = bet;
                            updateData.$set['playerInfo.$.betLists'] = e.betLists;
                            const upWh = {
                                _id: MongoID(tableInfo._id.toString()),
                                'playerInfo.seatIndex': Number(e.seatIndex),
                            };

                            tableInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, {
                                new: true,
                            });

                            logger.info("whiteAmount totalBlackChips BOT LOGIC  table Info -->", tableInfo);

                            commandAcions.sendEventInTable(tableInfo._id.toString(), CONST.BNW_BET_COUNTEING, { activePlayer: tableInfo.activePlayer, betAmount: bet, totalBlackChips: tableInfo.counters.totalBlackChips, playerId: e.playerId, seatIndex: e.seatIndex, betType: betLists });

                        } else if (betLists == 'White') {
                            let updateData = {
                                $set: {},
                                $inc: {},
                            };
                            e.betLists.push({ tableId: tableInfo._id, playerId: e._id, type: betLists, betAmount: bet });
                            updateData.$set['playerInfo.$.betLists'] = e.betLists;
                            updateData.$inc['counters.totalWhiteChips'] = bet;

                            const upWh = {
                                _id: MongoID(tableInfo._id.toString()),
                                'playerInfo.seatIndex': Number(e.seatIndex),
                            };

                            tableInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, {
                                new: true,
                            });

                            logger.info("whiteAmount totalWhiteChips BOT LOGIC  table Info -->", tableInfo);
                            commandAcions.sendEventInTable(tableInfo._id.toString(), CONST.BNW_BET_COUNTEING, { activePlayer: tableInfo.activePlayer, betAmount: bet, totalWhiteChips: tableInfo.counters.totalWhiteChips, playerId: e.playerId, seatIndex: e.seatIndex, betType: betLists });
                        } else {
                            let updateData = {
                                $set: {},
                                $inc: {},
                            };
                            e.betLists.push({ tableId: tableInfo._id, playerId: e._id, type: betLists, betAmount: bet });
                            updateData.$set['playerInfo.$.betLists'] = e.betLists;
                            updateData.$inc['counters.totalHitChips'] = bet;

                            const upWh = {
                                _id: MongoID(tableInfo._id.toString()),
                                'playerInfo.seatIndex': Number(e.seatIndex),
                            };

                            tableInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, {
                                new: true,
                            });

                            logger.info("whiteAmount totalHitChips BOT LOGIC  table Info -->", tableInfo);
                            commandAcions.sendEventInTable(tableInfo._id.toString(), CONST.BNW_BET_COUNTEING, { activePlayer: tableInfo.activePlayer, betAmount: bet, totalHitChips: tableInfo.counters.totalHitChips, playerId: e.playerId, seatIndex: e.seatIndex, betType: betLists });
                        }
                    } else {
                        logger.info(" Not Find User ");
                    }
                }
            }

            // Usage
            await processPlayerInfo(PlayerInfo);
            return;

        } else {
            logger.info("PlayRobot else  Robot ", tableInfo, PlayerInfo);
        }

        // let wh = {
        //     _id: MongoID(tableInfo._id.toString()),
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
        // let tbInfo = await PlayingTables.findOneAndUpdate(wh, updateData, { new: true });
        // logger.info("Remove Bot : ", tbInfo);


    } catch (error) {
        logger.info("Play Robot ", error);
    }
}

