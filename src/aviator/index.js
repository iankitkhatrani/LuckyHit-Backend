

const { joinTable } = require("./joinTable");
const { leaveTable } = require("./leaveTable");
const { disconnectTableHandle, findDisconnectTable } = require("./disconnectHandle");
const {Redisbinding, Cancel, action,CHECKOUT,mybetlist } = require("./gamePlay");
const {MYWALLET,MYPROFILE,UPDATEPROFILE,LB,AVATARLIST,SHOPLIST,NOTICELIST,MAILLIST,MAILREAD } = require("./dashboard");
const {ADDCARD,GETCARD} = require("./updateWallet");
const {reconnect} = require("./reconnect")


module.exports = {
  joinTable: joinTable,
  action: action,
  Cancel:Cancel,
  CHECKOUT:CHECKOUT,
  mybetlist:mybetlist,
  leaveTable: leaveTable,
  findDisconnectTable: findDisconnectTable,
  disconnectTableHandle: disconnectTableHandle,
  Redisbinding:Redisbinding,
  MYPROFILE:MYPROFILE,
  UPDATEPROFILE:UPDATEPROFILE,
  MYWALLET:MYWALLET,
  LB:LB,
  AVATARLIST:AVATARLIST,
  SHOPLIST:SHOPLIST,
  NOTICELIST:NOTICELIST,
  MAILLIST:MAILLIST,
  MAILREAD:MAILREAD,
  ADDCARD:ADDCARD,
  reconnect: reconnect,
  GETCARD:GETCARD
};
