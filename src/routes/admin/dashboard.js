const mongoose = require('mongoose');
const Users = mongoose.model('users');
const express = require('express');
const router = express.Router();
const config = require('../../../config');
const commonHelper = require('../../helper/commonHelper');
const mainCtrl = require('../../controller/adminController');
const logger = require('../../../logger');


/**
 * @api {post} /admin/lobbies
 * @apiName  add-bet-list
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get('/', async (req, res) => {
    try {
      //console.info('requet => ', req);
      const totalUser = await Users.find().count()
      const totalDeposit = 100;
      const totalWithdraw = 15100;
      const todayDeposit = 151;
      const todayWithdraw = 494;
      const todayKYC = 65464;
      const totalGamePay = 41654;


      logger.info('admin/dahboard.js post dahboard  error => ', totalUser);

      res.json({totalUser,totalDeposit,totalWithdraw,todayDeposit,todayWithdraw,todayKYC,totalGamePay});
    } catch (error) {
      logger.error('admin/dahboard.js post bet-list error => ', error);
      res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
  });

  /**
 * @api {post} /admin/lobbies
 * @apiName  add-bet-list
 * @apiGroup  Admin
 * @apiHeader {String}  x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.get('/latatestUser', async (req, res) => {
    try {
      //console.info('requet => ', req);
      let t = new Date().setSeconds(new Date().getSeconds() - 604800);
        
        logger.info('admin/dahboard.js post dahboard  error => ', t);
      const RecentUser = await Users.find({ createdAt :{$gte: new Date(t) } },{username:1,id:1,createdAt:1})
      
      logger.info('admin/dahboard.js post dahboard  error => ', RecentUser);

      res.json({RecentUser});
    } catch (error) {
      logger.error('admin/dahboard.js post bet-list error => ', error);
      res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
  });



  
  module.exports = router;