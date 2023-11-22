const mongoose = require('mongoose');
const Users = mongoose.model('users');
const express = require('express');
const router = express.Router();
const config = require('../../../config');
const commonHelper = require('../../helper/commonHelper');
const mainCtrl = require('../../controller/adminController');
const logger = require('../../../logger');


/**
* @api {get} /admin/lobbies
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/rummyGameHistory', async (req, res) => {
    try {
        //console.info('requet => ', req);

        const gameHistoryData = [
            {
                "SrNo": 1,
                "DateTime": "2023-10-10 08:30 AM",
                "Name": "Alice",
                "PhoneNumber": "123-456-7890",
                "RoomId": "GRoom1",
                "Amount": 100, // Amount in this example (can be credit or debit)
                "Type": "Credit", // "Credit" or "Debit"
                "Club": "Club A"
            },
            {
                "SrNo": 2,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "GRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club B"
            },
            {
                "SrNo": 3,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "GRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club Bd"
            },
            // Add more game history entries here
        ]
        
        //await Users.find({}, { username: 1, id: 1, mobileNumber: 1, "counters.totalMatch": 1, chips: 1, referralCode: 1, createdAt: 1, lastLoginDate: 1, status: 1 })

        logger.info('admin/dahboard.js post dahboard  error => ', gameHistoryData);

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
router.get('/ludoGameHistory', async (req, res) => {
    try {
        //console.info('requet => ', req);

        const gameHistoryData = [
            {
                "SrNo": 1,
                "DateTime": "2023-10-10 08:30 AM",
                "Name": "Alice",
                "PhoneNumber": "123-456-7890",
                "RoomId": "LRoom1",
                "Amount": 100, // Amount in this example (can be credit or debit)
                "Type": "Credit", // "Credit" or "Debit"
                "Club": "Club A"
            },
            {
                "SrNo": 2,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "LRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club B"
            },
            {
                "SrNo": 3,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "LRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club Bd"
            },
            // Add more game history entries here
        ]
        
        //await Users.find({}, { username: 1, id: 1, mobileNumber: 1, "counters.totalMatch": 1, chips: 1, referralCode: 1, createdAt: 1, lastLoginDate: 1, status: 1 })

        logger.info('admin/dahboard.js post dahboard  error => ', gameHistoryData);

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

            console.log("dddddddddddddddddddd")
        
        //await Users.find({}, { username: 1, id: 1, mobileNumber: 1, "counters.totalMatch": 1, chips: 1, referralCode: 1, createdAt: 1, lastLoginDate: 1, status: 1 })

        logger.info('admin/dahboard.js post dahboard  error => ');

        res.json({ falgs:true });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


module.exports = router;