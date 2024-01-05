const mongoose = require('mongoose');
const MongoID = mongoose.Types.ObjectId;
const GameUser = mongoose.model('users');
const PlayingTables = mongoose.model("blackNwhiteTables");

const commandAcions = require("../helper/socketFunctions");
const CONST = require("../../constant");
const logger = require('../../logger');
const joinTable = require("./joinTable");
const { getRandomInt } = require('./cardLogic');

module.exports.JoinRobot = async (tableInfo, BetInfo) => {
    try {

        let user_wh = {
            Iscom: 1
        }

        let robotInfo = await GameUser.findOne(user_wh, {});
        logger.info("JoinRobot BNW ROBOT Info : ", robotInfo)


        await joinTable.findEmptySeatAndUserSeat(tableInfo, BetInfo, { uid: robotInfo._id });

    } catch (error) {
        logger.info("Robot Logic Join", error);
    }
}

module.exports.PlayRobot = async (tableInfo, PlayerInfo, Number) => {

    try {
        // Play Robot Logic
        logger.info("BNW PlayRobot ", tableInfo)

        if (PlayerInfo != undefined && tableInfo._id != undefined) {
            logger.info("PlayRobot  tableInfo ", tableInfo)

            let RobotPlayer = []
            let BetArray = [10, 20, 50, 100, 200]
            let BetType = ['Black', 'White', 'LuckyHit']

            async function processPlayerInfo(PlayerInfo) {
                for (const e of PlayerInfo) {
                    logger.info("PlayRobot E -->", e);
                    if (e.Iscom == 1) {
                        let betLists = BetType[getRandomInt(0, BetType.length - 1)];
                        let bet = BetArray[getRandomInt(0, BetArray.length - 1)];

                        logger.info("PlayRobot betIndex ", bet);

                        // e.betLists.push({ betLists, bet });
                        /*
                        
                        tableId "6597f7c2d401773d70894cde"
                        playerId "65769ed020ce4166fc770550"
                        betAmount 50
                        type "Black"
                        */
                        // delete properties from 'e' object

                        RobotPlayer.push(e);

                        if (bet == 'Black') {
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

                            commandAcions.sendEventInTable(tableInfo._id.toString(), CONST.BNW_BET_COUNTEING, { activePlayer: tableInfo.activePlayer, totalBlackChips: tableInfo.counters.totalBlackChips, playerId: e.playerId, seatIndex: e.seatIndex, betType: betLists });
                        } else if (bet == 'White') {
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
                            commandAcions.sendEventInTable(tableInfo._id.toString(), CONST.BNW_BET_COUNTEING, { activePlayer: tableInfo.activePlayer, totalWhiteChips: tableInfo.counters.totalWhiteChips, playerId: e.playerId, seatIndex: e.seatIndex, betType: betLists });
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
                            commandAcions.sendEventInTable(tableInfo._id.toString(), CONST.BNW_BET_COUNTEING, { activePlayer: tableInfo.activePlayer, totalHitChips: tableInfo.counters.totalHitChips, playerId: e.playerId, seatIndex: e.seatIndex, betType: betLists });
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
    } catch (error) {
        logger.info("Play Robot ", error);
    }
}

