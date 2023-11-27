const mongoose = require('mongoose');

const express = require('express');
const router = express.Router();
const config = require('../../../config');
const commonHelper = require('../../helper/commonHelper');
const mainCtrl = require('../../controller/adminController');
const logger = require('../../../logger');
const Noticetext = mongoose.model('noticeText');
/**
* @api {get} /admin/socialURLsList
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/noticeTextList', async (req, res) => {
    try {
        //console.info('requet => ', req);

        const noticeText = await Noticetext.find({}, {})

        logger.info('admin/dahboard.js post dahboard  error => ', noticeText);

        res.json({ noticeText });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {get} /admin/socialURLsList
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.post('/noticeText', async (req, res) => {
    try {
        console.info('requet => ', req.body);
        const newObj = new Noticetext(req.body);
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
* @api {get} /admin/noticedelete
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.delete('/noticedelete/:id', async (req, res) => {
    try {
        console.info('requet => ', req.params);

        //await Users.find({}, { username: 1, id: 1, mobileNumber: 1, "counters.totalMatch": 1, chips: 1, referralCode: 1, createdAt: 1, lastLoginDate: 1, status: 1 })

        const RecentUser = await Noticetext.deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) })


        logger.info('admin/dahboard.js post dahboard  error => ',RecentUser);

        res.json({ falgs: true });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});



module.exports = router;