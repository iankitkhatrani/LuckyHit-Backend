
const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;

const PlayingTables = mongoose.model("blackNwhiteTables");

const gameTrackActions = require("./gameTrack");
const commandAcions = require("../helper/socketFunctions");


const CONST = require("../../constant");
const roundEndActions = require("./roundEnd");
const roundStartActions = require("./roundStart");
const walletActions = require("./updateWallet");
const logger = require("../../logger");
const { Logger } = require("mongodb");

module.exports.lastUserWinnerDeclareCall = async (tb) => {
    if (tb.isLastUserFinish) return false;
    const upWh = {
        _id: tb._id,
    }
    const updateData = {
        $set: {
            "isLastUserFinish": true
        }
    };
    logger.info("lastUserWinnerDeclareCall upWh updateData :: ", upWh, updateData);

    const tabInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, { new: true });
    logger.info("lastUserWinnerDeclareCall tabInfo : ", tabInfo);
    let winner = {};
    for (var i = 0; i < tabInfo.playerInfo.length; i++) {
        if (typeof tabInfo.playerInfo[i].seatIndex != "undefined" && tabInfo.playerInfo[i].status == "play") {
            winner = tabInfo.playerInfo[i];
        }
    }
    if (winner == {}) return false;

    logger.info("lastUserWinnerDeclareCall winner ::", winner);



    let dcUWh = {
        _id: MongoID(tb._id.toString()),
        "playerInfo.seatIndex": Number(winner.seatIndex)
    }
    let up = {
        $set: {
            "playerInfo.$.playStatus": "winner",
        }
    }
    const tbInfo = await PlayingTables.findOneAndUpdate(dcUWh, up, { new: true });
    logger.info("lastUserWinnerDeclareCall tbInfo : ", tbInfo);

    await this.winnerDeclareCall([winner], tabInfo);
    return true;

}

module.exports.winnerDeclareCall = async (winner, tabInfo) => {
    try {
        logger.info("winnerDeclareCall winner ::  -->", winner);
        logger.info("winnerDeclareCall tabInfo ::  -->", tabInfo);

        winner[0].index = 'Black';
        winner[1].index = 'White';
        // Find the maximum cardCount object
        const maxCardCountObject = winner.reduce((maxObj, currentObj) => {
            return currentObj.cardCount > maxObj.cardCount ? currentObj : maxObj;
        }, winner[0]); // Start with the first object as the initial max

        // Check if there's a tie
        const isTie = winner.every(obj => obj.cardCount === maxCardCountObject.cardCount);

        // Set the winResult accordingly
        winner.forEach(obj => {
            if (isTie) {
                obj.winResult = 'Tie';
            } else if (obj === maxCardCountObject) {
                obj.winResult = 'Win';
            } else {
                obj.winResult = 'Loss';
            }
        });

        logger.info("Objects with updated winResults:", winner);

        let tbid = tabInfo._id.toString()
        logger.info("winnerDeclareCall tbid ::", tbid);


        const upWh = {
            _id: tbid
        }
        const updateData = {
            $set: {
                "isFinalWinner": true,
                gameState: "RoundEndState",
            }
        };
        logger.info("winnerDeclareCall upWh updateData :: ", upWh, updateData);

        const tbInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, { new: true });
        logger.info("winnerDeclareCall tbInfo : ", tbInfo);


        // const totalAmountByType = calculateTotalAmountByType(tbInfo.playerInfo);



        // function calculateTotalAmountByType(playerInfo) {
        const typeAmounts = {};

        // Iterate through betLists of each player
        tbInfo.playerInfo.forEach(player => {
            if (player && player.betLists) {
                player.betLists.forEach(bet => {
                    const type = bet.type;
                    const amount = bet.betAmount;

                    // Initialize if type not seen before
                    if (!typeAmounts[type]) {
                        typeAmounts[type] = 0;
                    }

                    // Accumulate the amount for the type
                    typeAmounts[type] += amount;
                });
            }
        });

        logger.info("Total Amounts Grouped by Type:", typeAmounts);

        // return typeAmounts;
        // }

        // Call the function with the playerInfo array from the table object


        // let winnerIndexs = [];
        // let winnerIds = [];
        // for (let i = 0; i < winner.length; i++) {
        //     winnerIndexs.push(winner[i].seatIndex);
        //     winnerIds.push(winner[i]._id)
        // }
        const playerInGame = await roundStartActions.getPlayingUserInRound(tbInfo.playerInfo);
        logger.info("getWinner playerInGame ::", playerInGame);

        for (let i = 0; i < playerInGame.length; i++) {
            // let winnerState = checkUserCardActions.getWinState(playerInGame[i].cards, tbInfo.hukum);
            // logger.info("winnerState FETCH::", winnerState);

            tbInfo.gameTracks.push(
                {
                    _id: playerInGame[i]._id,
                    username: playerInGame[i].username,
                    seatIndex: playerInGame[i].seatIndex,
                    cards: playerInGame[i].cards,
                    totalBet: playerInGame[i].totalBet,
                    playStatus: (winnerIndexs.indexOf(playerInGame[i].seatIndex) != -1) ? "win" : "loss",
                    winningCardStatus: winnerState.status
                }
            )
        }

        logger.info("winnerDeclareCall tbInfo.gameTracks :: ", tbInfo.gameTracks, winnerIds);

        const winnerTrack = await gameTrackActions.gamePlayTracks(winnerIndexs, tbInfo.gameTracks, tbInfo);
        logger.info("winnerDeclareCall winnerTrack:: ", winnerTrack);

        for (let i = 0; i < tbInfo.gameTracks.length; i++) {
            if (tbInfo.gameTracks[i].playStatus == "win") {
                await walletActions.addWallet(tbInfo.gameTracks[i]._id, Number(winnerTrack.winningAmount), 4, "BlackNWhite Win", tabInfo);
            }
        }

        let winnerViewResponse = await this.winnerViewResponseFilter(tbInfo.gameTracks, winnerTrack, winnerIndexs);
        winnerViewResponse.gameId = tbInfo.gameId;
        winnerViewResponse.winnerIds = tbInfo.winnerIds;

        commandAcions.sendEventInTable(tbInfo._id.toString(), CONST.WINNER, winnerViewResponse);

        await roundEndActions.roundFinish(tbInfo);

    } catch (err) {
        logger.info("Exception  WinnerDeclareCall : 1 :: ", err)
    }
}

module.exports.winnerViewResponseFilter = (playerInfos, winnerTrack, winnerIndexs) => {
    logger.info("winnerViewResponseFilter playerInfo : ", playerInfos);
    let userInfo = [];
    let playerInfo = playerInfos;

    for (let i = 0; i < playerInfo.length; i++) {
        if (typeof playerInfo[i].seatIndex != "undefined") {
            logger.info("winnerViewResponseFilter playerInfo[i] : ", playerInfo[i]);
            userInfo.push({
                _id: playerInfo[i]._id,
                seatIndex: playerInfo[i].seatIndex,
                cards: playerInfo[i].cards,
                playStatus: playerInfo[i].playStatus,
                cardStatus: playerInfo[i].winningCardStatus
            })
        }
    }
    return {
        winnerSeatIndex: winnerIndexs,
        winningAmount: winnerTrack.winningAmount,
        userInfo: userInfo
    }
}