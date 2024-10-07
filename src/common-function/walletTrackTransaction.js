const mongoose = require('mongoose');
const MongoID = mongoose.Types.ObjectId;
const GameUser = mongoose.model('users');


const CONST = require('../../constant');
const commandAcions = require('../helper/socketFunctions');
const logger = require('../../logger');
const adminWalletTracks = require('../models/userWalletTracks');


module.exports.deductuserWalletGame = async (id, deductChips, tType, t, game, tableid) => {
  try {
    logger.info('Check deductuserWalletGame: call.', id, deductChips, tType, t, game, tableid);

    // Validate user ID and transaction type
    // const wh = (typeof id === 'string') ? { _id: MongoID(id) } : { _id: id };
    // if (!wh || !wh._id || !tType) {
    //   return 0;
    // }

    deductChips = Number(deductChips.toFixed(2));

    // Fetch user info
    const projection = { name: 1, chips: 1, sckId: 1, _id: 1 };
    const adminInfo = await GameUser.findOne(wh, projection);

    if (!adminInfo) {
      logger.info('No admin info found for ID:', id);
      return false;
    }

    adminInfo.chips = isNaN(adminInfo.chips) ? 0 : Number(adminInfo.chips);
    let opChips = adminInfo.chips;

    // Prepare deduction logic
    if (deductChips > 0 && adminInfo.chips > 0) {
      let totalDeductChips = deductChips;
      let setInfo = { $inc: {} };

      // Deduct chips or set to zero if not enough balance
      setInfo['$inc']['chips'] = (adminInfo.chips - deductChips) >= 0 ? -deductChips : -adminInfo.chips;
      setInfo['$inc']['chips'] = Number(setInfo['$inc']['chips'].toFixed(2));

      // Update user's chips after deduction
      adminInfo.chips = (adminInfo.chips - deductChips) >= 0 ? (adminInfo.chips - deductChips) : 0;
      adminInfo.chips = Number(adminInfo.chips.toFixed(2));

      logger.info("Deducting user chips:", setInfo);

      // Update in DB
      let upReps = await GameUser.findOneAndUpdate(wh, setInfo, { new: true });
      if (!upReps) {
        logger.error('Failed to update user chips.');
        return 0;
      }

      upReps.chips = isNaN(upReps.chips) ? 0 : Number(upReps.chips);
      let totalRemainingAmount = upReps.chips;

      // Log transaction in the wallet tracker
      if (tType) {
        let walletTrack = {
          userId: wh._id.toString(),
          name: adminInfo.name,
          trnxType: tType,
          trnxTypeTxt: t,
          trnxAmount: totalDeductChips,
          oppChips: opChips,
          chips: upReps.chips,
          totalBucket: totalRemainingAmount,
          gameType: game,
          tbaleid: tableid
        };
        await this.trackUserWallet(walletTrack);
      }

      // Send real-time wallet update to the client
      commandAcions.sendDirectEvent(adminInfo.sckId, CONST.WALLET_UPDATE, {
        chips: upReps.chips,
        totalWallet: totalRemainingAmount,
        msg: t,
        userid: upReps._id.toString()
      });

      // Check for decimal precision issues and fix
      if (upReps.chips.toString().includes('.') && upReps.chips.toString().split('.')[1].length > 2) {
        let updateData = { $set: { chips: parseFloat(upReps.chips.toFixed(2)) } };
        await GameUser.findOneAndUpdate(wh, updateData, { new: true });
      }

      return totalRemainingAmount;
    }

    return adminInfo.chips;

  } catch (e) {
    logger.error('deductuserWalletGame Exception:', e.stack || e);
    return 0;
  }
};


module.exports.addUserWalletGame = async (id, addedChips, tType, t, game, tableid) => {
  try {
    logger.info('\n addUserWalletGame : call.-->>>', id, addedChips, tType, t, game, tableid);

    const wh = (typeof id === 'string') ? { _id: MongoID(id) } : { _id: id };
    // if (!wh || !wh._id || !tType || !addedChips || !game || !tableid) {
    //   return false;
    // }

    addedChips = Number(addedChips.toFixed(2));

    const projection = { id: 1, userId: 1, name: 1, chips: 1, sckId: 1 };
    const adminInfo = await GameUser.findOne(wh, projection);

    if (!adminInfo) {
      return false;
    }

    adminInfo.chips = isNaN(adminInfo.chips) ? 0 : Number(adminInfo.chips);
    let opChips = adminInfo.chips;
    let setInfo = { $inc: { chips: addedChips } };

    adminInfo.chips += addedChips;
    adminInfo.chips = Number(adminInfo.chips.toFixed(2));

    let upReps = await GameUser.findOneAndUpdate(wh, setInfo, { new: true });
    upReps.chips = isNaN(upReps.chips) ? 0 : Number(upReps.chips);

    if (tType) {
      let walletTrack = {
        userId: id.toString(),
        name: adminInfo.name,
        trnxType: tType,
        trnxTypeTxt: t,
        trnxAmount: addedChips,
        oppChips: opChips,
        chips: upReps.chips,
        totalBucket: upReps.chips,
        gameType: game,
        tbaleid: tableid
      };
      await this.trackUserWallet(walletTrack);
    }

    commandAcions.sendDirectEvent(adminInfo.sckId, CONST.WALLET_UPDATE, {
      chips: upReps.chips,
      totalWallet: upReps.chips,
      msg: t,
      userid: upReps._id.toString()
    });

    return upReps.chips;
  } catch (e) {
    logger.error("addUserWalletGame : Exception", e);
    return 0;
  }
};


