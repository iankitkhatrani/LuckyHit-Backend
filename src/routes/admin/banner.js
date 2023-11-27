const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const config = require('../../../config');
const logger = require('../../../logger');
const { getBannerList } = require('../../controller/adminController');
const Banners = mongoose.model('banner');

/**
* @api {get} /admin/socialURLsList
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.get('/bannerList', async (req, res) => {
    try {
        //console.info('requet => ', req);
        //get Data from controller
        //let res = await getBannerList();

        const bannerListData = await Banners.find({}, {})
       
        logger.info('admin/dahboard.js post dahboard  error => ', bannerListData);

        res.json({ bannerListData });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});


/**
* @api {post} /admin/Banner Addd
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/

var multer = require('multer')
var storage1 = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/upload/Banner')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '.jpg') //Appending .jpg
    }
});
var upload = multer({ storage: storage1 })

router.post('/BannerUpload',upload.single('image'), async (req, res) => {
    try {
        
        console.log("(req.file ",req.file)

    
        if (req.file.path != 'undefined' && req.file.path != '' && req.file.path != null) {

            res.json({ flag: true, path: req.file.path.substr(7) });
        } else {
            res.json({ flag: false, path: "" });
        }
        
        logger.info('admin/dahboard.js post dahboard  inf o::: => ' );

    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        //res.send("error");

        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});



/**
* @api {get} /admin/banneradd
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.post('/bannerAdd', async (req, res) => {
    try {
        console.info('requet => ', req.body);

        //await Users.find({}, { username: 1, id: 1, mobileNumber: 1, "counters.totalMatch": 1, chips: 1, referralCode: 1, createdAt: 1, lastLoginDate: 1, status: 1 })

        const newObj = new Banners(req.body);
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
* @api {get} /admin/bannerdelete
* @apiName  add-bet-list
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.delete('/bannerdelete/:id', async (req, res) => {
    try {
        console.info('requet => ', req.params);

        const RecentUser = await Banners.deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) })

        logger.info('admin/dahboard.js post dahboard  error => ');

        res.json({ falgs: true });
    } catch (error) {
        logger.error('admin/dahboard.js post bet-list error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});



module.exports = router;