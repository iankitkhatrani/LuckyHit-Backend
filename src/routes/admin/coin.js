const mongoose = require('mongoose');
const Users = mongoose.model('users');
const ShopTable = mongoose.model("ShopTable");

const express = require('express');
const router = express.Router();
const config = require('../../../config');
const commonHelper = require('../../helper/commonHelper');
const mainCtrl = require('../../controller/adminController');
const logger = require('../../../logger');


/**
* @api {get} /admin/coinlist
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/coinlist', async (req, res) => {
    try {
        //console.info('requet => ', req);

        const coinlist = await ShopTable.find({}, {})
        logger.info('admin/dahboard.js post dahboard  error => ', coinlist);

        res.json({ coinlist });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {get} /admin/coinadded
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.post('/coinadded', async (req, res) => {
    try {
        console.info('requet => ', req.body);
        
        //const insertres =  commonHelper.insert("social",req.body)

        const newObj = new  ShopTable(req.body);
        const data = await newObj.save();

        if (data) {
        return  res.json({
            flags:true,
            message: 'record added',
            data: JSON.parse(JSON.stringify(data)),
        });
        } else {
        return  res.json({flags:false, status: 0, message: 'record not added', data: null });
        }
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});

/**
* @api {get} /admin/coindelete
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.delete('/coindelete/:id', async (req, res) => {
    try {
        console.info('requet => ', req.params);
    
        const RecentUser = await ShopTable.deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) })

        logger.info('admin/dahboard.js post dahboard  error => ',RecentUser);

        res.json({ falgs:true });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


module.exports = router;