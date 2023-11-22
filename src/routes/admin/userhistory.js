const mongoose = require('mongoose');
const Users = mongoose.model('users');
const express = require('express');
const router = express.Router();
const config = require('../../../config');
const commonHelper = require('../../helper/commonHelper');
const mainCtrl = require('../../controller/adminController');
const logger = require('../../../logger');


/**
* @api {get} /admin/rouletteHistory
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/rouletteHistory', async (req, res) => {
    try {
        console.info('requet => ', req.query);

        const rouletteHistoryData =  [
            {
                "SrNo": 1,
                "DateTime": "2023-10-10 08:30 AM",
                "Name": "Alice",
                "PhoneNumber": "123-456-7890",
                "RoomId": "RHRoom1",
                "Amount": 100, // Amount in this example (can be credit or debit)
                "Type": "Credit", // "Credit" or "Debit"
                "Club": "Club A"
            },
            {
                "SrNo": 2,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "RHRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club B"
            },
            {
                "SrNo": 3,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "RHRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club Bd"
            }, {
                "SrNo": 3,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "RHRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club Bd"
            },
            // Add more game history entries here
        ];

        logger.info('admin/dahboard.js post dahboard  error => ', rouletteHistoryData);

        res.json({ rouletteHistoryData });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {get} /admin/rouletteHistory
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/completeWithdrawal', async (req, res) => {
    try {
        console.info('completeWithdrawal  => ', req.query);

        const completeWithdrawalData = [
            {
                "SrNo": 1,
                "DateTime": "2023-10-10 08:30 AM",
                "Name": "Alice",
                "PhoneNumber": "123-456-7890",
                "RoomId": "CWRoom1",
                "Amount": 100, // Amount in this example (can be credit or debit)
                "Type": "Credit", // "Credit" or "Debit"
                "Club": "Club A"
            },
            {
                "SrNo": 2,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "CWRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club B"
            },
            {
                "SrNo": 3,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "CWRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club Bd"
            },
            // Add more game history entries here
        ];

        logger.info('admin/dahboard.js post dahboard  error => ', completeWithdrawalData);

        res.json({ completeWithdrawalData });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {get} /admin/completeDeposite
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/completeDeposite', async (req, res) => {
    try {
        console.info('requet => ', req.query);

        const completeDepositeData = [
            {
                "SrNo": 1,
                "DateTime": "2023-10-10 08:30 AM",
                "Name": "Alice",
                "PhoneNumber": "123-456-7890",
                "RoomId": "CDRoom1",
                "Amount": 100, // Amount in this example (can be credit or debit)
                "Type": "Credit", // "Credit" or "Debit"
                "Club": "Club A"
            },
            {
                "SrNo": 2,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "CDRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club B"
            },
            {
                "SrNo": 3,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "CDRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club Bd"
            },
            // Add more game history entries here
        ];

        logger.info('admin/dahboard.js post dahboard  error => ', completeDepositeData);

        res.json({ completeDepositeData });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {get} /admin/completeDeposite
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/registerRaferralBonus', async (req, res) => {
    try {
        //console.info('requet => ', req);

        const registerRaferralBonusData =  [
            {
                "SrNo": 1,
                "DateTime": "2023-10-10 08:30 AM",
                "Name": "Alice",
                "PhoneNumber": "123-456-7890",
                "RoomId": "RRRoom1",
                "Amount": 100, // Amount in this example (can be credit or debit)
                "Type": "Credit", // "Credit" or "Debit"
                "Club": "Club A"
            },
            {
                "SrNo": 2,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "RRRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club B"
            },
            {
                "SrNo": 3,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "RRRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club Bd"
            },
            // Add more game history entries here
        ];
        

        logger.info('admin/dahboard.js post dahboard  error => ', registerRaferralBonusData);

        res.json({ registerRaferralBonusData });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {get} /admin/completeDeposite
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/myRaferrals', async (req, res) => {
    try {
        //console.info('requet => ', req);

        const myRaferralsData =  [
            {
                "SrNo": 1,
                "DateTime": "2023-10-10 08:30 AM",
                "Name": "Alice",
                "PhoneNumber": "123-456-7890",
                "RoomId": "MRRoom1",
                "Amount": 100, // Amount in this example (can be credit or debit)
                "Type": "Credit", // "Credit" or "Debit"
                "Club": "Club A"
            },
            {
                "SrNo": 2,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "MRRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club B"
            },
            {
                "SrNo": 3,
                "DateTime": "2023-10-09 10:15 AM",
                "Name": "Bob",
                "PhoneNumber": "987-654-3210",
                "RoomId": "MRRoom2",
                "Amount": 50, // Amount in this example (can be credit or debit)
                "Type": "Debit", // "Credit" or "Debit"
                "Club": "Club Bd"
            },
            // Add more game history entries here
        ];
        

        logger.info('admin/dahboard.js post dahboard  error => ', myRaferralsData);

        res.json({ myRaferralsData });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});



module.exports = router;