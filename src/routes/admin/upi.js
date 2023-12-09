"use strict";
const UpiService = require("../../services/upi.service");
const CommonUtility = require("../../helper/Common");

const commonUtility = new CommonUtility();

module.exports = function (app, express) {
  const router = express.Router();

  router.post("/verify-upi", commonUtility.verifyUserAuth, commonUtility.decryptBody, (req, res) => {
    return new UpiService().boot(req, res).verifyUpi();
  });

  router.post("/update-upi", commonUtility.verifyUserAuth, commonUtility.decryptBody, (req, res) => {
    return new UpiService().boot(req, res).updateUpi();
  });

  router.post("/initiate-deposit", commonUtility.verifyUserAuth, commonUtility.decryptBody, (req, res) => {
    return new UpiService().boot(req, res).initiateDeposit();
  });

  router.post("/initiate-withdraw", commonUtility.verifyUserAuth, commonUtility.decryptBody, (req, res) => {
    return new UpiService().boot(req, res).initiateWithdraw();
  });

  router.post("/transaction", commonUtility.verifyUserAuth, commonUtility.decryptBody, (req, res) => {
    return new UpiService().boot(req, res).transactionById();
  });

  router.post("/transactions-list", commonUtility.verifyUserAuth, commonUtility.decryptBody, (req, res) => {
    return new UpiService().boot(req, res).transactionsList();
  });

  router.get("/upi-info", commonUtility.verifyUserAuth, (req, res) => {
    return new UpiService().boot(req, res).getUpiInfo();
  });

  router.get("/can-initiate-payment/:type", commonUtility.verifyUserAuth, (req, res) => {
    return new UpiService().boot(req, res).canInitiatePayment();
  });

  router.post("/admin/verification-requests/:type", commonUtility.verifyAdminAuth, commonUtility.decryptBody, (req, res) => {
    return new UpiService().boot(req, res).verificationReqList();
  });

  router.post("/admin/txn-requests/:type", commonUtility.verifyAdminAuth, commonUtility.decryptBody, (req, res) => {
    return new UpiService().boot(req, res).paymentRequests();
  });

  router.put("/admin/deposit", commonUtility.verifyAdminAuth, commonUtility.decryptBody, (req, res) => {
    return new UpiService().boot(req, res).updateDepositStatus();
  });

  router.put("/admin/withdraw", commonUtility.verifyAdminAuth, commonUtility.decryptBody, (req, res) => {
    return new UpiService().boot(req, res).updateWithdrawStatus();
  });

  router.put("/admin/update-upi-status", commonUtility.verifyAdminAuth, commonUtility.decryptBody, (req, res) => {
    return new UpiService().boot(req, res).updateUPIVerificationStatus();
  });

  app.use("/upi", router);
};
