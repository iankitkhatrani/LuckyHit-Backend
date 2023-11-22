const mongoose = require('mongoose');
const Users = mongoose.model('users');
const express = require('express');
const router = express.Router();
const config = require('../../../config');
const commonHelper = require('../../helper/commonHelper');
const mainCtrl = require('../../controller/adminController');
const logger = require('../../../logger');
const { registerUser } = require('../../helper/signups/signupValidation');


/**
* @api {post} /admin/lobbies
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/UserList', async (req, res) => {
    try {
        //console.info('requet => ', req);

        const userList = await Users.find({}, { username: 1, id: 1, mobileNumber: 1, "counters.totalMatch": 1, isVIP: 1, chips: 1, referralCode: 1, createdAt: 1, lastLoginDate: 1, status: 1 })

        logger.info('admin/dahboard.js post dahboard  error => ', userList);

        res.json({ userList });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {post} /admin/UserData
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/UserData', async (req, res) => {
    try {
        console.info('requet => ', req.query);
        //
        const userInfo = await Users.findOne({ _id: new mongoose.Types.ObjectId(req.query.userId) }, { username: 1, id: 1, loginType: 1, profileUrl: 1, mobileNumber: 1, email: 1, uniqueId: 1, "counters.totalMatch": 1, deviceType: 1, chips: 1, referralCode: 1, createdAt: 1, lastLoginDate: 1, status: 1 })

        logger.info('admin/dahboard.js post dahboard  error => ', userInfo);

        res.json({ userInfo });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {post} /admin/AddUser
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.post('/AddUser', async (req, res) => {
    try {

        //currently send rendom number and generate 
        let number = await createPhoneNumber()
        let response = {
            mobileNumber: Number(number),
            deviceId: `${number}`,
            isVIP: 1
        }

        let RecentUser = await registerUser(response)

        logger.info('admin/dahboard.js post dahboard  error => ', RecentUser);

        res.json({ status: "ok" });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        //res.send("error");

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
router.delete('/DeleteUser/:id', async (req, res) => {
    try {
        console.log("req ", req.params.id)

        const RecentUser = await Users.deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) })

        logger.info('admin/dahboard.js post dahboard  error => ', RecentUser);

        res.json({ status: "ok" });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        //res.send("error");

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
router.put('/addMoney', async (req, res) => {
    try {
        console.log("Add Money ", req.body)
        //const RecentUser = //await Users.deleteOne({_id: new mongoose.Types.ObjectId(req.params.id)})

        logger.info('admin/dahboard.js post dahboard  error => ');

        res.json({ status: "ok" });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        //res.send("error");

        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});

/**
* @api {post} /admin/deductMoney
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.put('/deductMoney', async (req, res) => {
    try {
        console.log("deductMoney ", req.body)
        //const RecentUser = //await Users.deleteOne({_id: new mongoose.Types.ObjectId(req.params.id)})

        logger.info('admin/dahboard.js post dahboard  error => ');

        res.json({ status: "ok" });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        //res.send("error");

        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {post} /admin/K
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.put('/kycInfo', async (req, res) => {
    try {
        console.log("kycInfo ", req.body)
        //const RecentUser = //await Users.deleteOne({_id: new mongoose.Types.ObjectId(req.params.id)})

        logger.info('admin/dahboard.js post dahboard  error => ');

        res.json({ status: "ok" });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        //res.send("error");

        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});



async function createPhoneNumber() {
    const countryCode = "91";

    // Generate a random 9-digit mobile number
    const randomMobileNumber = Math.floor(Math.random() * 9000000000) + 1000000000;

    // Concatenate the country code and the random mobile number
    const indianMobileNumber = countryCode + randomMobileNumber;

    return indianMobileNumber;
}

module.exports = router;