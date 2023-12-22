
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
      }
      userInfo.push({
        _id: player._id,
        seatIndex: player.seatIndex,
        totalBet: typeAmounts
      })
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
        }
      )
    }

    logger.info("winnerDeclareCall tbInfo.gameTracks :: ", tbInfo.gameTracks);

    // const winnerTrack = await gameTrackActions.gamePlayTracks(winnerIndexs, tbInfo.gameTracks, tbInfo);
    // logger.info("winnerDeclareCall winnerTrack:: ", winnerTrack);

    // for (let i = 0; i < tbInfo.gameTracks.length; i++) {
    //   if (tbInfo.gameTracks[i].playStatus == "win") {
    //     await walletActions.addWallet(tbInfo.gameTracks[i]._id, Number(winnerTrack.winningAmount), 4, "BlackNWhite Win", tabInfo);
    //   }
    // }

    let winnerViewResponse = {
      cardDetails: winner,
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

/*

// Sample data
let winner = [
  {
    flag: true,
    cards: ["D-10-0","C-8-0","S-4-0"],
    cardCount: 22,
    status: 'High_Cards',
    index: 'Black',
    winResult: 'Tie'
  },
  {
    flag: true,
    cards: ["D-11-0","D-9-0","S-2-0"],
    cardCount: 22,
    status: 'High_Cards',
    index: 'White',
    winResult: 'Tie'
  }
];

let table = {
  BNWCards: { black: [], white: [] },
  gameId: '',
  gameType: 'BlackNWhite',
  activePlayer: 1,
  maxSeat: 7,
  playerInfo: [
    {
      seatIndex: 0,
      _id: '65769ed020ce4166fc770550',
      playerId: '65769ed020ce4166fc770550',
      username: 'USER_5',
      profile: null,
      coins: 109883.33,
      status: '',
      playerStatus: '',
      betLists: [
        { type: 'Black', betAmount: 10 },
        { type: 'White', betAmount: 20 },
        { type: 'Black', betAmount: 30 }
      ],
      chalValue: 0,
      chalValue1: 0,
      turnMissCounter: 0,
      turnCount: 0,
      sck: 'awJ6KsGzlYBD1-dzAAAB',
      playerSocketId: 'awJ6KsGzlYBD1-dzAAAB',
      playerLostChips: 0,
      Iscom: 0
    },
    {},
    {},
    {},
    {},
    {},
    {}
  ],
  potLimit: 0,
  gameState: 'GameStartTimer',
  jobId: '',
  turnDone: false,
  gameTracks: [],
  callFinalWinner: false,
  isLastUserFinish: false,
  isFinalWinner: false,
  history: [],
  betamount: [],
  totalbet: 0,
  _id: '6584afea28c22b216855bfed'
};

// Function to calculate total amount grouped by type
function calculateTotalAmountByType(playerInfo) {
  const typeAmounts = {};

  // Iterate through betLists of each player
  playerInfo.forEach(player => {
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

  return typeAmounts;
}

// Call the function with the playerInfo array from the table object
const totalAmountByType = calculateTotalAmountByType(table.playerInfo);

console.log("Total Amounts Grouped by Type:", totalAmountByType);



**************************************


let winner = [
  {
    flag: true,
    cards: ["D-10-0","C-8-0","S-4-0"],
    cardCount: 22,
    status: 'High_Cards',
    index: 'Black',
    winResult: 'Tie'
  },
  {
    flag: true,
    cards: ["D-11-0","D-9-0","S-2-0"],
    cardCount: 22,
    status: 'High_Cards',
    index: 'White',
    winResult: 'Tie'
  }
];

let table = {
  BNWCards: { black: [], white: [] },
  gameId: '',
  gameType: 'BlackNWhite',
  activePlayer: 1,
  maxSeat: 7,
  playerInfo: [
    {
      seatIndex: 0,
      _id: '65769ed020ce4166fc770550',
      playerId: '65769ed020ce4166fc770550',
      username: 'USER_5',
      profile: null,
      coins: 109883.33,
      status: '',
      playerStatus: '',
      betLists: [
        { type: "Black", betAmount: 10 },
        { type: "White", betAmount: 20 },
        { type: "Black", betAmount: 30 }
      ],
      chalValue: 0,
      chalValue1: 0,
      turnMissCounter: 0,
      turnCount: 0,
      sck: 'awJ6KsGzlYBD1-dzAAAB',
      playerSocketId: 'awJ6KsGzlYBD1-dzAAAB',
      playerLostChips: 0,
      Iscom: 0
    },
    {
      seatIndex: 1,
      _id: '65769ed020ce4166fc770110',
      playerId: '65769ed020ce4166fc770110',
      username: 'USER_5',
      profile: null,
      coins: 109883.33,
      status: '',
      playerStatus: '',
      betLists: [
        { type: "Black", betAmount: 50 },
        { type: "White", betAmount: 20 },
        { type: "Black", betAmount: 30 }
      ],
      chalValue: 0,
      chalValue1: 0,
      turnMissCounter: 0,
      turnCount: 0,
      sck: 'awJ6KsGzlYBD1-dzAAAB',
      playerSocketId: 'awJ6KsGzlYBD1-dzAAAB',
      playerLostChips: 0,
      Iscom: 0
    },
    {},
    {},
    {},
    {},
    {}
  ],
  potLimit: 0,
  gameState: 'GameStartTimer',
  jobId: '',
  turnDone: false,
  gameTracks: [],
  callFinalWinner: false,
  isLastUserFinish: false,
  isFinalWinner: false,
  history: [],
  betamount: [],
  totalbet: 0,
  _id: '6584afea28c22b216855bfed'
};

// Initialize total bet amounts for each type
let totalBetAmounts = { Black: 0, White: 0 };

// Iterate through playerInfo array and calculate total bet amounts
table.playerInfo.forEach(player => {
  if (player.betLists) {
    player.betLists.forEach(bet => {
      if (bet.type === 'Black') {
        totalBetAmounts.Black += bet.betAmount;
      } else if (bet.type === 'White') {
        totalBetAmounts.White += bet.betAmount;
      }
    });
  }
});

// Update the table object with total bet amounts
table.BNWCards.black = totalBetAmounts.Black;
table.BNWCards.white = totalBetAmounts.White;

console.log("Updated table object:", table);

*/