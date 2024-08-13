const express = require('express');
const router = express.Router();
const logger = require('../../../logger');
const mongoose = require('mongoose');
const users = mongoose.model("users");
const paymentin = mongoose.model("paymentin");

router.post('/payment-callback', async (req, res) => {
    try {
        logger.info(':::::::::::::::::::::::::::::::::::::response => ', req.body);

        if (req.body != undefined && req.body.Status != undefined) {
            console.log("res.body. ", req.body.OrderId)
            const PaymentIndata = await paymentin.findOneAndUpdate({ "OrderID": req.body.OrderId }, { $set: { webhook: req.body } }, {
                new: true,
            });
            console.log("PaymentIndata ", PaymentIndata)
            if (PaymentIndata && PaymentIndata.userId && req.body.Status == "Success") {

                await walletActions.addWalletPayin(PaymentIndata.userId, Number(req.body.Amount), 'Credit', 'PayIn');

            } else {
                logger.info("PaymentIndata ", PaymentIndata)
                logger.info("req.body Faild  ", req.body)
            }
        } else {
            logger.info("req.body ", req.body)
        }
        res.send("check API ok")
    } catch (error) {
        res.send("check API ok / try catch error")
    }
});

module.exports = router;