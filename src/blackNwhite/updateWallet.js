const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;
const PlayingTables = mongoose.model("blackNwhiteTables");
const UserWalletTracks = mongoose.model("userWalletTracks");
const GameUser = mongoose.model("users");
const commandAcions = require("../helper/socketFunctions");
const CONST = require("../../constant");
const logger = require("../../logger");

module.exports.deductWallet = async (id, deductChips, tType, t, tbInfo, client, seatIndex) => {
    try {
        logger.info('\ndedudctWallet : call.-->>>', id, deductChips, t);
        const wh = (typeof id == 'string') ? { _id: MongoID(id) } : { _id: id };

        if (typeof wh == 'undefined' || typeof wh._id == 'undefined' || wh._id == null || typeof tType == 'undefined') {
            return 0;
        }

        deductChips = Number(deductChips.toFixed(2));
        let projection = {
            id: 1,
            username: 1,
            uniqueId: 1,
            chips: 1,
            winningChips: 1,
            sck: 1,
            flags: 1
        }

        const userInfo = await GameUser.findOne(wh, projection);
        logger.info("dedudctWallet userInfo : ", userInfo);

        if (userInfo == null) {
            return false;
        }
        logger.info("dedudctWallet userInfo :: ", userInfo);

        userInfo.chips = (typeof userInfo.chips == 'undefined' || isNaN(userInfo.chips)) ? 0 : Number(userInfo.chips);
        userInfo.winningChips = (typeof userInfo.winningChips == 'undefined' || isNaN(userInfo.winningChips)) ? 0 : Number(userInfo.winningChips);

        let opGameWinning = userInfo.winningChips;
        let opChips = userInfo.chips;


        logger.info("userInfo.chips =>", userInfo.chips)
        logger.info("userInfo.winningChips =>", userInfo.winningChips)

        let setInfo = {
            $inc: {}
        };
        let totalDeductChips = deductChips;

        if (userInfo.winningChips > 0 && deductChips < 0) {

            setInfo['$inc']['winningChips'] = (userInfo.winningChips + deductChips) >= 0 ? Number(deductChips) : Number(-userInfo.winningChips);
            setInfo['$inc']['winningChips'] = Number(setInfo['$inc']['winningChips'].toFixed(2))

            let winningChips = userInfo.winningChips;

            userInfo.winningChips = (userInfo.winningChips + deductChips) >= 0 ? (Number(userInfo.winningChips) + Number(deductChips)) : 0;
            userInfo.winningChips = Number(Number(userInfo.winningChips).toFixed(2));

            deductChips = (deductChips + userInfo.winningChips) >= 0 ? 0 : (Number(deductChips) + Number(winningChips));
            deductChips = Number(Number(deductChips).toFixed(2));
        }

        if (userInfo.chips > 0 && deductChips < 0) {

            setInfo['$inc']['chips'] = (userInfo.chips + deductChips) >= 0 ? Number(deductChips) : Number(-userInfo.chips);
            setInfo['$inc']['chips'] = Number(setInfo['$inc']['chips'].toFixed(2))

            let chips = userInfo.chips;

            userInfo.chips = (userInfo.chips + deductChips) >= 0 ? (Number(userInfo.chips) + Number(deductChips)) : 0;
            userInfo.chips = Number(Number(userInfo.chips).toFixed(2));

            deductChips = (deductChips + userInfo.chips) >= 0 ? 0 : (Number(deductChips) + Number(chips));
            deductChips = Number(Number(deductChips).toFixed(2));
        }

        logger.info("\ndedudctWallet setInfo :: --->", setInfo);
        let tranferAmount = Number(totalDeductChips);
        logger.info("dedudctWallet userInfo :: ==>", userInfo);
        logger.info("dedudctWallet tranferAmount :: ==>", tranferAmount);

        if (Object.keys(setInfo["$inc"]).length > 0) {
            for (let key in setInfo["$inc"]) {
                setInfo["$inc"][key] = parseFloat(setInfo["$inc"][key].toString());
            }
        }
        if (Object.keys(setInfo["$inc"]).length == 0) {
            delete setInfo["$inc"];
        }

        logger.info("\ndedudctWallet wh :: ", wh, setInfo);
        let upReps = await GameUser.findOneAndUpdate(wh, setInfo, { new: true });
        logger.info("\ndedudctWallet upReps :: ", upReps);

        upReps.chips = (typeof upReps.chips == 'undefined' || isNaN(upReps.chips)) ? 0 : Number(upReps.chips);
        upReps.winningChips = (typeof upReps.winningChips == 'undefined' || isNaN(upReps.winningChips)) ? 0 : Number(upReps.winningChips);
        let totalRemaningAmount = upReps.chips + upReps.winningChips;

        if (typeof tType != 'undefined') {

            let walletTrack = {
                id: userInfo.id,
                uniqueId: userInfo.uniqueId,
                userId: wh._id.toString(),
                trnxType: tType,
                trnxTypeTxt: t,
                trnxAmount: Number(tranferAmount),
                oppChips: opChips,
                oppWinningChips: opGameWinning,
                chips: upReps.chips,
                winningChips: upReps.winningChips,
                totalBucket: totalRemaningAmount,
                depositId: (tbInfo && tbInfo.depositId) ? tbInfo.depositId : "",
                withdrawId: (tbInfo && tbInfo.withdrawId) ? tbInfo.withdrawId : "",
                gameId: (tbInfo && tbInfo.gameId) ? tbInfo.game_id : "",
                isRobot: (typeof userInfo.flags != "undefined" && userInfo.flags.isRobot) ? userInfo.flags.isRobot : 0,
                gameType: (tbInfo && tbInfo.gameType) ? tbInfo.gameType : "", //Game Type
                maxSeat: (tbInfo && tbInfo.maxSeat) ? tbInfo.maxSeat : 0,//Maxumum Player.
                betValue: (tbInfo && tbInfo.betValue) ? tbInfo.betValue : 0,
                tableId: (tbInfo && tbInfo._id) ? tbInfo._id.toString() : ""
            }
            await this.trackUserWallet(walletTrack);
        }

        if ((typeof upReps.chips.toString().split(".")[1] != "undefined" && upReps.chips.toString().split(".")[1].length > 2) || (typeof upReps.winningChips.toString().split(".")[1] != "undefined" && upReps.winningChips.toString().split(".")[1].length > 2)) {

            let updateData = {
                $set: {}
            }
            updateData["$set"]["chips"] = parseFloat(upReps.chips.toFixed(2))

            updateData["$set"]["winningChips"] = parseFloat(upReps.winningChips.toFixed(2))

            if (Object.keys(updateData.$set).length > 0) {
                let upRepss = await GameUser.findOneAndUpdate(wh, updateData, { new: true });
                logger.info("\ndedudctWallet upRepss  :: ", upRepss);
            }
        }

        logger.info(" userInfo.sckId.toString() => ", userInfo.sckId)
        logger.info(" upReps userInfo.sckId => ", upReps.sckId)
        logger.info(" client userInfo.sckId => ", client)

        commandAcions.sendEventInTable(tbInfo._id.toString(), CONST.BNW_WALLET_UPDATE, {
            winningChips: upReps.winningChips,
            chips: upReps.chips,
            totalWallet: totalRemaningAmount,
            msg: t,
            seatIndex: seatIndex
        });

        if (typeof tbInfo != "undefined" && tbInfo != null && typeof tbInfo._id != "undefined" && typeof tbInfo.gt != "undefined" && tbInfo.gt == "Points Rummy") {
            if (typeof tbInfo.pi != "undefined" && tbInfo.pi.length > 0) {
                for (let i = 0; i < tbInfo.pi.length; i++) {
                    if (typeof tbInfo.pi[i] != "undefined" && typeof tbInfo.pi[i].ui != "undefined" && tbInfo.pi[i].ui._id.toString() == wh._id.toString()) {

                        let uChips = Number(upReps.chips) + Number(upReps.winningChips)

                        let tbWh = {
                            _id: MongoID(tbInfo._id.toString()),
                            "playerInfo._id": MongoID(wh._id.toString())
                        }

                        await PlayingTables.findOneAndUpdate(tbWh, { $set: { "playerInfo.$.coins": uChips } }, { new: true })

                        commandAcions.sendEventInTable(tbInfo._id.toString(), CONST.TABLE_USER_WALLET_UPDATE, {
                            totalWallet: uChips,
                            seatIndex: tbInfo.playerInfo[i].seatIndex
                        });
                        break;
                    }
                }
            }
        }
        return totalRemaningAmount;
    } catch (e) {
        logger.info("deductWallet : 1 : Exception : 1", e)
        return 0
    }
}

module.exports.addWallet = async (id, added_chips, tType, t, tbInfo, client, seatIndex) => {
    try {
        logger.info('\ndedudctWallet : call.-->>>', id, added_chips, t);
        const wh = (typeof id == 'string') ? { _id: MongoID(id) } : { _id: id };
        if (typeof wh == 'undefined' || typeof wh._id == 'undefined' || wh._id == null || typeof tType == 'undefined') {
            return false;
        }
        added_chips = Number(added_chips.toFixed(2));
        let projection = {
            id: 1,
            username: 1,
            uniqueId: 1,
            chips: 1,
            winningChips: 1,
            sckId: 1,
            flags: 1
        }

        const userInfo = await GameUser.findOne(wh, projection);
        logger.info("dedudctWallet userInfo : ", userInfo);
        if (userInfo == null) {
            return false;
        }
        logger.info("dedudctWallet userInfo :: ", userInfo);

        userInfo.chips = (typeof userInfo.chips == 'undefined' || isNaN(userInfo.chips)) ? 0 : Number(userInfo.chips);
        userInfo.winningChips = (typeof userInfo.winningChips == 'undefined' || isNaN(userInfo.winningChips)) ? 0 : Number(userInfo.winningChips);

        let opGameWinning = userInfo.winningChips;
        let opChips = userInfo.chips;


        let setInfo = {
            $inc: {}
        };
        let totalDeductChips = added_chips;

        setInfo['$inc']['winningChips'] = Number(Number(added_chips).toFixed(2));

        userInfo.winningChips = Number(userInfo.winningChips) + Number(added_chips);
        userInfo.winningChips = Number(userInfo.winningChips.toFixed(2))


        logger.info("\ndedudctWallet setInfo :: ", setInfo);
        let tranferAmount = totalDeductChips;
        logger.info("dedudctWallet userInfo :: ", userInfo);

        if (Object.keys(setInfo["$inc"]).length > 0) {
            for (let key in setInfo["$inc"]) {
                setInfo["$inc"][key] = parseFloat(setInfo["$inc"][key].toString());
            }
        }
        if (Object.keys(setInfo["$inc"]).length == 0) {
            delete setInfo["$inc"];
        }

        logger.info("\ndedudctWallet wh :: ", wh, setInfo);
        let upReps = await GameUser.findOneAndUpdate(wh, setInfo, { new: true });
        logger.info("\ndedudctWallet upReps :: ", upReps);

        upReps.chips = (typeof upReps.chips == 'undefined' || isNaN(upReps.chips)) ? 0 : Number(upReps.chips);
        upReps.winningChips = (typeof upReps.winningChips == 'undefined' || isNaN(upReps.winningChips)) ? 0 : Number(upReps.winningChips);
        let totalRemaningAmount = upReps.chips + upReps.winningChips;

        if (typeof tType != 'undefined') {

            let walletTrack = {
                id: userInfo.id,
                uniqueId: userInfo.uniqueId,
                user_id: wh._id.toString(),
                trnx_type: tType,
                trnx_type_txt: t,
                trnx_amount: Number(tranferAmount),
                opChips: opChips,
                opGameWinning: opGameWinning,
                chips: upReps.chips,
                winningChips: upReps.winningChips,
                total_bucket: totalRemaningAmount,
                deposit_id: (tbInfo && tbInfo.diposit_id) ? tbInfo.diposit_id : "",
                withdraw_id: (tbInfo && tbInfo.withdraw_id) ? tbInfo.withdraw_id : "",
                game_id: (tbInfo && tbInfo.game_id) ? tbInfo.game_id : "",
                is_robot: (typeof userInfo.flags != "undefined" && userInfo.flags.is_robot) ? userInfo.flags.is_robot : 0,
                game_type: (tbInfo && tbInfo.game_type) ? tbInfo.game_type : "", //Game Type
                max_seat: (tbInfo && tbInfo.max_seat) ? tbInfo.max_seat : 0,//Maxumum Player.
                bet: (tbInfo && tbInfo.bet) ? tbInfo.bet : 0,
                table_id: (tbInfo && tbInfo._id) ? tbInfo._id.toString() : ""
            }
            await this.trackUserWallet(walletTrack);
        }

        if ((typeof upReps.chips.toString().split(".")[1] != "undefined" && upReps.chips.toString().split(".")[1].length > 2) || (typeof upReps.winningChips.toString().split(".")[1] != "undefined" && upReps.winningChips.toString().split(".")[1].length > 2)) {

            let updateData = {
                $set: {}
            }
            updateData["$set"]["chips"] = parseFloat(upReps.chips.toFixed(2))

            updateData["$set"]["winningChips"] = parseFloat(upReps.winningChips.toFixed(2))

            if (Object.keys(updateData.$set).length > 0) {
                let upRepss = await GameUser.findOneAndUpdate(wh, updateData, { new: true });
                logger.info("\ndedudctWallet upRepss  :: ", upRepss);
            }
        }
        commandAcions.sendDirectEvent(client, CONST.BNW_WALLET_UPDATE, {
            winningChips: upReps.winningChips,
            chips: upReps.chips,
            totalWallet: totalRemaningAmount,
            msg: t,
            seatIndex: seatIndex
        });

        if (typeof tbInfo != "undefined" && tbInfo != null && typeof tbInfo._id != "undefined") {
            if (typeof tbInfo.pi != "undefined" && tbInfo.pi.length > 0) {
                for (let i = 0; i < tbInfo.pi.length; i++) {
                    if (typeof tbInfo.pi[i] != "undefined" && typeof tbInfo.pi[i].ui != "undefined" && tbInfo.pi[i].ui._id.toString() == wh._id.toString()) {

                        let uChips = Number(upReps.chips) + Number(upReps.winningChips)

                        let tbWh = {
                            _id: MongoID(tbInfo._id.toString()),
                            "playerInfo._id": MongoID(wh._id.toString())
                        }
                        await PlayingTables.findOneAndUpdate(tbWh, { $set: { "playerInfo.$.coins": uChips } }, { new: true })

                        commandAcions.sendEventInTable(client, CONST.TABLE_USER_WALLET_UPDATE, {
                            totalWallet: uChips,
                            seatIndex: tbInfo.playerInfo[i].seatIndex
                        });
                        break;
                    }
                }
            }
        }
        return totalRemaningAmount;
    } catch (e) {
        logger.info("deductWallet : 1 : Exception : 1", e)
        return 0
    }
}

module.exports.trackUserWallet = async (obj) => {
    logger.info("\ntrackUserWallet obj ::", obj);

    await UserWalletTracks.create(obj)
    return true;
}