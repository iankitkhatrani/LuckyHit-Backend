const mongoose = require('mongoose');
const Users = mongoose.model('users');
const express = require('express');
const router = express.Router();
const config = require('../../../config');
const commonHelper = require('../../helper/commonHelper');
const mainCtrl = require('../../controller/adminController');
const logger = require('../../../logger');
const CONST = require("../../../constant");


/**
* @api {get} /admin/lobbies
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/blackwhitegamehistory', async (req, res) => {
    try {
        console.log('requet => ', req);

        const gameHistoryData = await GameHistory.find({"game": "BlackandWhite" },
        { DateTime: 1, userId: 1, Name: 1, PhoneNumber: 1, RoomId: 1, Amount: 1, Type: 1, game:1 }).sort({ DateTime: -1 })

        console.log("completeWithdrawalData ", gameHistoryData)

        res.json({ gameHistoryData });        
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {get} /admin/lobbies
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/aviatorGameHistory', async (req, res) => {
    try {
        
        const gameHistoryData = await GameHistory.find({"game": "aviator" },
        { DateTime: 1, userId: 1, Name: 1, PhoneNumber: 1, RoomId: 1, Amount: 1, Type: 1, game:1 }).sort({ DateTime: -1 })

        console.log("completeWithdrawalData ", gameHistoryData)

        res.json({ gameHistoryData });  
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});



/**
* @api {get} /admin/lobbies
* @apiName  gameLogicSet
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.put('/gameLogicSet', async (req, res) => {
    try {
        console.info('requet => ', req.body);
        console.log("req.body.gamelogic",CONST.AVIATORLOGIC)

        if(req.body.game == "Aviator"){
            CONST.AVIATORLOGIC = req.body.gamelogic 
        
            console.log("dddddddddddddddddddd",CONST.AVIATORLOGIC)
        }else if(req.body.game == "BlackWhite"){
            CONST.BLACKWHITE = req.body.gamelogic 
        
            console.log("dddddddddddddddddddd",CONST.BLACKWHITE)
        }
        
        logger.info('admin/dahboard.js post dahboard  error => ',CONST);

        res.json({ falgs:true });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


module.exports = router;