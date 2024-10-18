const express = require('express');
const router = express.Router();
const mainCtrl = require('../../controller/adminController');
const { OK_STATUS, BAD_REQUEST } = require('../../../config');
const logger = require('../../../logger');
const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;
const AviatorTables = mongoose.model("aviatorTables");
const blackNwhiteTables = mongoose.model("blackNwhiteTables");
const GameUser = mongoose.model("users");



/**
 * @api {post} /admin/signup-admin
 * @apiName  register admin
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */

router.post('/signup-admin', async (req, res) => {
  res.json(await mainCtrl.registerAdmin(req.body));
});


router.post('/signup-admin-update', async (req, res) => {
  console.log("signup-admin :::::::::::::::", req.body)
  res.json(await mainCtrl.registerAdminUpdate(req.body));
});



/**
 * @api {post} /admin/login
 * @apiName  login for admin
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.post('/login', async (req, res) => {
  try {
    // res.json(await mainCtrl.adminLogin(req.body));
    const data = await mainCtrl.adminLogin(req.body);
    logger.info('data => ', data);
    res.status(OK_STATUS).json(data);
  } catch (err) {
    logger.error('admin/auth.js login error => ', err);
    res.status(BAD_REQUEST).json({ status: 0, message: 'Something went wrong' });
  }
});


/**
* @api {get} /admin/DeletePlaying
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/DeletePlaying', async (req, res) => {
  try {

    await blackNwhiteTables.deleteMany({})

    res.json({ status: "ok" });
  } catch (error) {
    logger.error('admin/dahboard.js post bet-list error => ', error);
    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});


/**
* @api {get} /admin/DeletePlayingAV
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/DeletePlayingAV', async (req, res) => {
  try {

    await AviatorTables.deleteMany({})
    let wh = { Iscom: 1 }; // Ensure Iscom is an integer or modify accordingly
    let updateData = {
      $set: {
        type: "free"
      }
    };

    // Perform the update
    let updateBotstatus = await GameUser.updateMany(wh, updateData);
    logger.info("updateBotstatus ==>", updateBotstatus);


    logger.info('admin/dahboard.js post dahboard  error => ');

    res.json({ status: "ok" });
  } catch (error) {
    logger.error('admin/dahboard.js post bet-list error => ', error);
    res.status(config.INTERNAL_SERVER_ERROR).json(error);
  }
});

router.post('/webhook', async (req, res) => {
  console.log("sdddddddddddddddddddddd", req.body)
  logger.info(':::::::::::::::::::::::::::::::::::::responce => ', req.body);

  //Find Any reacod here 

  // if there 

  // if(req.body != undefined && req.body.Status != undefined){
  //   console.log("res.body. ",req.body.OrderId)
  //     const PaymentIndata = await paymentin.findOneAndUpdate({"OrderID": req.body.OrderId}, {$set:{webhook:req.body}}, {
  //         new: true,
  //     }); 
  //     console.log("PaymentIndata ",PaymentIndata)
  //     if(PaymentIndata && PaymentIndata.userId && req.body.Status == "Success"){ 

  //       await walletActions.addWalletPayin(PaymentIndata.userId, Number(req.body.Amount), 'Credit', 'PayIn');
  //     }else{
  //       console.log("PaymentIndata ",PaymentIndata)
  //       console.log("req.body Faild  ",req.body)
  //     }
  // }else{
  //   console.log("req.body ",req.body)
  // }
  res.send("ok")
});

module.exports = router;
