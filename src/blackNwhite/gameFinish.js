
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

module.exports.winnerDeclareCall = async (winner, tabInfo) => {
  try {
    logger.info("winnerDeclareCall winner ::  -->", winner);

    let winnerObj = this.filterWinnerResponse(winner)
    logger.info("winnerObj::  -->", winnerObj);

    const winnerCardIndex = winner.filter(player => player.winResult === "Win");
    const winnerCard = winnerCardIndex[0].index
    logger.log("winnercard 1=>", winnerCardIndex[0].index)
    logger.log("winnercard 2=>", winnerCard)

    let tbid = tabInfo._id.toString()
    logger.info("winnerDeclareCall tbid ::", tbid);

    const addLastWinCard = tabInfo.lastGameResult.push(winnerCard)
    logger.info("addLastWinCard", addLastWinCard);

    const upWh = {
      _id: tbid
    }
    const updateData = {
      $set: {
        "isFinalWinner": true,
        gameState: "RoundEndState",
        "lastGameResult": tabInfo.lastGameResult,
      }
    };
    logger.info("winnerDeclareCall upWh updateData :: ", upWh, updateData);

    const tbInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, { new: true });
    logger.info("winnerDeclareCall tbInfo : ", JSON.stringify(tbInfo));

    const typeAmounts = {};
    let userInfo = [];


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

        let doublebet;
        let amount;
        let finalAmount;

        if (typeAmounts[winnerCard] == 'Tie') {
          doublebet = (typeAmounts[winnerCard] * 6)
          amount = (doublebet * 1) / 100
          finalAmount = doublebet - amount
        } else {
          doublebet = (typeAmounts[winnerCard] * 2)
          amount = (doublebet * 1) / 100
          finalAmount = doublebet - amount
        }

        userInfo.push({
          _id: player._id,
          seatIndex: player.seatIndex,
          totalBet: finalAmount,
          sckId: player.sck,
        })

      }
    });

    logger.info("Total Amounts Grouped by Type:", typeAmounts);
    logger.info("Total Amounts Grouped by Type: UserInfo", userInfo);

    const playerInGame = await roundStartActions.getPlayingUserInRound(tbInfo.playerInfo);
    logger.info("getWinner playerInGame ::", playerInGame);

    const updateWallet = await this.manageUserScore(userInfo, tabInfo);
    logger.info("getWinner updateWallet ::", updateWallet);

    for (let i = 0; i < playerInGame.length; i++) {
      tbInfo.gameTracks.push(
        {
          _id: playerInGame[i]._id,
          username: playerInGame[i].username,
          seatIndex: playerInGame[i].seatIndex,
        }
      )
    }

    logger.info("winnerDeclareCall tbInfo.gameTracks :: ", tbInfo.gameTracks);


    let jobId = commandAcions.GetRandomString(10);
    let delay = commandAcions.AddTime(4);
    await commandAcions.setDelay(jobId, new Date(delay));

    let winnerViewResponse = {
      cardDetails: winnerObj,
      userInfo
    }

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

module.exports.filterWinnerResponse = (winnerList) => {
  let winner = winnerList

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

  return winner

}

module.exports.manageUserScore = async (playerInfo, tabInfo) => {
  let tableInfo;
  for (let i = 0; i < playerInfo.length; i++) {
    logger.info('\n Manage User Score Player Info ==>', playerInfo[i]);
    await walletActions.addWallet(playerInfo[i]._id, playerInfo[i].totalBet, 'Credit', tabInfo, playerInfo[i].sck, playerInfo[i].seatIndex)
  }
  return tableInfo;
};