const mongoose = require('mongoose');
const Users = mongoose.model('users');
const express = require('express');
const router = express.Router();
const config = require('../../../config');
const commonHelper = require('../../helper/commonHelper');
const mainCtrl = require('../../controller/adminController');
const logger = require('../../../logger');
const CONST = require("../../../constant");
const GameHistory = mongoose.model("GameHistory");
const fs = require("fs")

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

        const gameHistoryData = await GameHistory.find({ "game": "BlackandWhite" },
            { DateTime: 1, userId: 1, Name: 1, PhoneNumber: 1, RoomId: 1, Amount: 1, Type: 1, game: 1 }).sort({ DateTime: -1 })

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

        const gameHistoryData = await GameHistory.find({ "game": "aviator" },
            { DateTime: 1, userId: 1, Name: 1, PhoneNumber: 1, RoomId: 1, Amount: 1, Type: 1, game: 1 }).sort({ DateTime: -1 })

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
        // console.log("req.body.gamelogic", CONST.AVIATORLOGIC)

        console.log("dddddddddddddddddddd 1", process.env.AVIATORLOGIC)

        console.log("req.body.game.gamename  1", req.body.game.gameName )

        if (req.body.game.gameName == "aviator") {
            GAMELOGICCONFIG.AVIATORLOGIC = req.body.gamelogic

            console.log("GAMELOGICCONFIG ", GAMELOGICCONFIG)

            let link = "./gamelogic.json"
            console.log("link ", link)
            fs.writeFile(link, JSON.stringify(GAMELOGICCONFIG), function (err) {
                console.log("erre", err)
                if (err) {
                    console.log(err);
                }

            });

        } else if (req.body.game.gameName == "balckandwhite") {
            GAMELOGICCONFIG.BLACKANDWHITE = req.body.gamelogic


            let link = "./gamelogic.json"
            console.log("link ", link)
            fs.writeFile(link, JSON.stringify(GAMELOGICCONFIG), function (err) {
                console.log("erre", err)
                if (err) {
                    console.log(err);
                }

            });

        }


        res.json({ falgs: true });
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
router.get('/getgamelogic', async (req, res) => {
    try {
        console.info('requet => ', req.query);
        // console.log("req.body.gamelogic", CONST.AVIATORLOGIC)

        console.log("dddddddddddddddddddd 1", process.env.AVIATORLOGIC)

        console.log("req.query.gameName", req.query.gamename )

        if (req.query.gamename == "aviator") {
          
            res.json({ logic: GAMELOGICCONFIG.AVIATORLOGIC });

        } else if (req.query.gamename == "balckandwhite") {
            

            res.json({ logic: GAMELOGICCONFIG.BLACKANDWHITE });

        }else{
            res.json({ logic: "" });
        }


        
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});





module.exports = router;