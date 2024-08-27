const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const paymentin = mongoose.model('paymentin');
const logger = require('../../../logger');
const walletActions = require("../../common-function/walletTrackTransaction");

router.post('/payment-callback', async (req, res) => {
    try {
        const callbackData = req.body;
        logger.info('Callback Data Received: ', callbackData);

        if (callbackData && callbackData.orderId) {
            const paymentData = await paymentin.findOneAndUpdate(
                { "OrderID": callbackData.orderId },
                { $set: { webhook: callbackData } },
                { new: true }
            );
            logger.info("Payment Data: ", paymentData);

            if (paymentData && paymentData.userId && callbackData.txnStatus === "Transaction Successful") {
                await walletActions.addUserWalletGame(paymentData.userId, Number(callbackData.amount), 'Credit', 'PayIn');
                logger.info('Wallet updated successfully for user:', paymentData.userId);
            } else {
                logger.info("Payment not successful or no associated user ID found.");
            }
        } else {
            logger.info("Invalid callback data received: ", callbackData);
        }

        res.status(200).json({ status: "200", message: "SUCCESS" });
    } catch (error) {
        logger.error("Error in payment callback processing: ", error);
        res.status(500).json({ status: "500", message: "Internal Server Error" });
    }
});

module.exports = router;
