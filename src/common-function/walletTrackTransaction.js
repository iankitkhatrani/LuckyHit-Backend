const mongoose = require('mongoose');
const MongoID = mongoose.Types.ObjectId;
const GameUser = mongoose.model('users');


const CONST = require('../../constant');
const commandAcions = require('../helper/socketFunctions');
const logger = require('../../logger');
const adminWalletTracks = require('../models/userWalletTracks');


module.exports.deductuserWalletGame = async (id, deductChips, tType, t, game, tableid) => {
  try {
    logger.info('\d check deductuserWalletGame : call.-->>>', id, deductChips, t, tType, t, game, tableid);
    const wh = (typeof id == 'string') ? { _id: MongoID(id) } : { _id: id };

    if (typeof wh == 'undefined' || typeof wh._id == 'undefined' || wh._id == null || typeof tType == 'undefined') {
      return 0;
    }

    deductChips = Number(deductChips.toFixed(2));
    let projection = {
      name: 1,
      chips: 1,
      sckId: 1,
      flags: 1,
      _id: 1
    }

    const adminInfo = await GameUser.findOne(wh, projection);
    logger.info("deductuserWalletGame adminInfo : ", adminInfo);

    if (adminInfo == null) {
      return false;
    }
    logger.info("deductuserWalletGame adminInfo :: ", adminInfo);

    adminInfo.chips = (typeof adminInfo.chips == 'undefined' || isNaN(adminInfo.chips)) ? 0 : Number(adminInfo.chips);

    let opChips = adminInfo.chips;


    logger.info("deductuserWalletGame .chips =>", adminInfo.chips)

    let setInfo = {
      $inc: {}
    };
    let totalDeductChips = deductChips;

    if (adminInfo.chips > 0 && deductChips < 0) {

      setInfo['$inc']['chips'] = (adminInfo.chips + deductChips) >= 0 ? Number(deductChips) : Number(-adminInfo.chips);
      setInfo['$inc']['chips'] = Number(setInfo['$inc']['chips'].toFixed(2))

      let chips = adminInfo.chips;

      adminInfo.chips = (adminInfo.chips + deductChips) >= 0 ? (Number(adminInfo.chips) + Number(deductChips)) : 0;
      adminInfo.chips = Number(Number(adminInfo.chips).toFixed(2));

      deductChips = (deductChips + adminInfo.chips) >= 0 ? 0 : (Number(deductChips) + Number(chips));
      deductChips = Number(Number(deductChips).toFixed(2));
    }

    logger.info("\deductuserWalletGame setInfo :: --->", setInfo);
    let tranferAmount = totalDeductChips;
    logger.info("deductuserWalletGame adminInfo :: ==>", adminInfo);

    if (Object.keys(setInfo["$inc"]).length > 0) {
      for (let key in setInfo["$inc"]) {
        setInfo["$inc"][key] = parseFloat(setInfo["$inc"][key].toString());
      }
    }
    if (Object.keys(setInfo["$inc"]).length == 0) {
      delete setInfo["$inc"];
    }

    logger.info("\d deductuserWalletGame wh :: ", wh, setInfo);
    let upReps = await GameUser.findOneAndUpdate(wh, setInfo, { new: true });
    logger.info("\d new edeductuserWalletGame upReps :: ", upReps);

    upReps.chips = (typeof upReps.chips == 'undefined' || isNaN(upReps.chips)) ? 0 : Number(upReps.chips);
    //upReps.winningChips = (typeof upReps.winningChips == 'undefined' || isNaN(upReps.winningChips)) ? 0 : Number(upReps.winningChips);
    let totalRemaningAmount = upReps.chips //+ upReps.winningChips;

    if (typeof tType != 'undefined') {

      let walletTrack = {
        userId: wh._id.toString(),
        name: adminInfo.name,
        trnxType: tType,
        trnxTypeTxt: t,
        trnxAmount: tranferAmount,
        oppChips: opChips,
        chips: upReps.chips,
        totalBucket: totalRemaningAmount,
        gameType: game,
        tbaleid: tableid
      }
      logger.info("\n 1111 deductuserWalletGame walletTrack :: ", walletTrack);
      await this.trackUserWallet(walletTrack);
    }

    if ((typeof upReps.chips.toString().split(".")[1] != "undefined" && upReps.chips.toString().split(".")[1].length > 2)) {

      let updateData = {
        $set: {}
      }
      updateData["$set"]["chips"] = parseFloat(upReps.chips.toFixed(2))
      if (Object.keys(updateData.$set).length > 0) {
        let upRepss = await GameUser.findOneAndUpdate(wh, updateData, { new: true });
        logger.info("\deductuserWalletGame upRepss  :: ", upRepss);
      }
    }

    logger.info(" deductuserWalletGame adminInfo.sckId.toString() => ", adminInfo.sckId)
    logger.info(" deductuserWalletGame upReps adminInfo.sckId => ", upReps.sckId)

    commandAcions.sendDirectEvent(adminInfo.sckId, CONST.WALLET_UPDATE, {
      chips: upReps.chips,
      totalWallet: totalRemaningAmount,
      msg: t,
      userid: upReps._id.toString()
    });

    return totalRemaningAmount;
  } catch (e) {
    logger.info("deductuserWalletGame  : 1 : Exception : 1", e)
    return 0
  }
}

module.exports.addUserWalletGame = async (id, added_chips, tType, t, game, tableid) => {
  try {
    logger.info('\n addUserWalletGame : call.-->>>', id, added_chips, tType, t, game, tableid);

    const wh = (typeof id == 'string') ? { _id: MongoID(id) } : { _id: id };
    if (typeof wh == 'undefined' || typeof wh._id == 'undefined' || wh._id == null || typeof tType == 'undefined') {
      return false;
    }
    added_chips = Number(added_chips.toFixed(2));
    let projection = {
      id: 1,
      userId: 1,
      name: 1,
      chips: 1,
      sckId: 1
    }

    const adminInfo = await GameUser.findOne(wh, projection);
    logger.info("addUserWalletGame adminInfo : ", adminInfo);
    if (adminInfo == null) {
      return false;
    }
    logger.info("addUserWalletGame adminInfo :: ", adminInfo);

    adminInfo.chips = (typeof adminInfo.chips == 'undefined' || isNaN(adminInfo.chips)) ? 0 : Number(adminInfo.chips);

    let opChips = adminInfo.chips;


    let setInfo = {
      $inc: {}
    };
    let totalDeductChips = added_chips;

    setInfo['$inc']['chips'] = Number(Number(added_chips).toFixed(2));

    adminInfo.chips = Number(adminInfo.chips) + Number(added_chips);
    adminInfo.chips = Number(adminInfo.chips.toFixed(2))


    logger.info("\addUserWalletGame setInfo :: ", setInfo);
    let tranferAmount = totalDeductChips;
    logger.info("addUserWalletGame adminInfo :: ", adminInfo);

    if (Object.keys(setInfo["$inc"]).length > 0) {
      for (let key in setInfo["$inc"]) {
        setInfo["$inc"][key] = parseFloat(setInfo["$inc"][key].toString());
      }
    }
    if (Object.keys(setInfo["$inc"]).length == 0) {
      delete setInfo["$inc"];
    }

    logger.info("\addUserWalletGame wh :: ", wh, setInfo);
    let upReps = await GameUser.findOneAndUpdate(wh, setInfo, { new: true });
    logger.info("\addUserWalletGame upReps :: ", upReps);

    upReps.chips = (typeof upReps.chips == 'undefined' || isNaN(upReps.chips)) ? 0 : Number(upReps.chips);
    let totalRemaningAmount = upReps.chips

    if (typeof tType != 'undefined') {

      let walletTrack = {
        userId: id.toString(),
        name: adminInfo.name,
        trnxType: tType,
        trnxTypeTxt: t,
        trnxAmount: tranferAmount,
        oppChips: opChips,
        chips: upReps.chips,
        totalBucket: totalRemaningAmount,
        gameType: game,
        tbaleid: tableid
      }
      await this.trackUserWallet(walletTrack);
    }

    commandAcions.sendDirectEvent(adminInfo.sckId, CONST.WALLET_UPDATE, {
      // winningChips: upReps.winningChips,
      chips: upReps.chips,
      totalWallet: totalRemaningAmount,
      msg: t,
      userid: upReps._id.toString()
    });

    return totalRemaningAmount;
  } catch (e) {
    logger.info("addUserWalletGame : 1 : Exception : 1", e)
    return 0
  }
}

