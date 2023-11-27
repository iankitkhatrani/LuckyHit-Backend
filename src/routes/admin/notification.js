const mongoose = require('mongoose');
const Users = mongoose.model('users');
const express = require('express');
const router = express.Router();
const config = require('../../../config');
const commonHelper = require('../../helper/commonHelper');
const mainCtrl = require('../../controller/adminController');
const logger = require('../../../logger');

const pushNotifications = require('../../aviator/pushnotification');


/**
* @api {get} /admin/socialURLsList
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.post('/sendNotification', async (req, res) => {
    try {
        console.info('requet => ', req.body);
        if(req.body.title != undefined && req.body.title != null && req.body.notification != undefined && req.body.notification != null){
        
            pushNotifications.sendAllUser({title:req.body.title,body:req.body.notification})

            logger.info('admin/dahboard.js post dahboard  error => ');

            res.json({ falgs:true });
        }else{
            logger.error('admin/dahboard.js post bet-list req.body => ', req.body);
            res.status(config.INTERNAL_SERVER_ERROR).json(req.body);
        }
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});




module.exports = router;