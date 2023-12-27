
// const { getBetList } = require('./betList');
const { joinTable } = require("./joinTable");
const { leaveTable } = require("./leaveTable");
const { disconnectTableHandle, findDisconnectTable } = require("./disconnectHandle");
const { action, CHECKOUT, lastGameScoreBoard } = require("./gamePlay");
const { userReconnect } = require("./reConnectFunction");

module.exports = {
  // getBetList: getBetList,
  joinTable: joinTable,
  action: action,
  CHECKOUT: CHECKOUT,
  leaveTable: leaveTable,
  findDisconnectTable: findDisconnectTable,
  disconnectTableHandle: disconnectTableHandle,
  lastGameScoreBoard: lastGameScoreBoard,
  reconnect: userReconnect
};
