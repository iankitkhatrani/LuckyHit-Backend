const mongoose = require('mongoose');
const Users = mongoose.model('users');
const express = require('express');
const router = express.Router();
const config = require('../../../config');
const commonHelper = require('../../helper/commonHelper');
const mainCtrl = require('../../controller/adminController');
const logger = require('../../../logger');
const { registerUser } = require('../../helper/signups/signupValidation');
const walletActions = require("../../aviator/updateWallet");
const { getUserDefaultFields, saveGameUser } = require('../../helper/signups/appStart');

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

        const userList = await Users.find({Iscom:0}, { username: 1,profileUrl:1,winningChips:1,bonusChips:1, id: 1,email:1,uniqueId:1,
            "blackandwhite.totalMatch":1,"aviator.totalMatch":1, mobileNumber: 1, "counters.totalMatch": 1, isVIP: 1, chips: 1, referralCode: 1, createdAt: 1, lastLoginDate: 1, status: 1 })

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
        console.log("req ::::::::::::",req.body)
        let response = {
            mobileNumber:req.body.mobileNumber,
            name:req.body.name,
            email:req.body.email,
            password:req.body.password,
            isVIP: 1,
            country:req.body.country
        }

        console.log("response  :::::::::::: response ",response)

        logger.info('Register User Request Body =>', response);
        const { mobileNumber } = response;
    
        let query = { mobileNumber: mobileNumber };
        let result = await Users.findOne(query, {});
        if (!result) {
            let defaultData = await getUserDefaultFields(response);
            logger.info('registerUser defaultData : ', defaultData);
    
            let userInsertInfo = await saveGameUser(defaultData);
            logger.info('registerUser userInsertInfo : ', userInsertInfo);
            
            if(userInsertInfo){
                res.json({ status: true });
            }else{
                res.status(config.NOT_FOUND).json(error);   
            }
        }else{
            res.status(config.NOT_FOUND).json(error);
        } 
        
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
        //userId
        // 
        //const RecentUser = //await Users.deleteOne({_id: new mongoose.Types.ObjectId(req.params.id)})
        if(req.body.userId != undefined && req.body.type != undefined && req.body.money != undefined){

            const UserData = await Users.find({_id:new mongoose.Types.ObjectId(req.body.userId)}, { sckId:1 })
            console.log("UserData ",UserData)
            if(UserData != undefined &&  UserData[0].sckId != undefined){

                
                await walletActions.addWalletAdmin(req.body.userId,Number(req.body.money),3,req.body.type,{},{id:UserData.sckId},-1);
            }

            res.json({ status: "ok" });
        }else{
            console.log("false")
            res.json({ status: false });
        }

        logger.info('admin/dahboard.js post dahboard  error => ');

        
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

        if(req.body.userId != undefined && req.body.type != undefined && req.body.money != undefined){

            const UserData = await Users.find({_id:new mongoose.Types.ObjectId(req.body.userId)}, { sckId:1 })
            console.log("UserData ",UserData)
            if(UserData != undefined &&  UserData[0].sckId != undefined){

                
                await walletActions.deductWalletAdmin(req.body.userId,-Number(req.body.money),4,req.body.type,{},{id:UserData.sckId},-1);
            }

            res.json({ status: "ok" });
        }else{
            console.log("false")
            res.json({ status: false });
        }

        logger.info('admin/dahboard.js post dahboard  error => ');

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