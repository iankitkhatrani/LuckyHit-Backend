const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const logger = require('../../logger');

const usersHelper = require('../helper/usersHelper');
const commonHelper = require('../helper/commonHelper');

const Admin = mongoose.model('admin');
const BetLists = mongoose.model('betList');


/**
 * @description . Create Admin User
 * @param {Object} requestBody
 * @returns {Object}
 */

async function registerAdmin(requestBody) {
    try {
        const { name, password, email } = requestBody;
        //logger.info('requestBody => ', requestBody);

        const user = await Admin.countDocuments({ email });
        //logger.info("user =>", user);

        if (user > 0) {
            return {
                message: 'User already exists',
                status: 0,
            };
        } else {
            const newData = {
                name,
                email,
                password,
            };

            const hashedPassword = await bcrypt.hash(password, 10);
            newData.password = hashedPassword;
            const response = await usersHelper.registerAdmin(newData);

            delete response.data.password;

            if (response.status) {
                const token = await commonHelper.sign(response.data);
                response.data.token = token;
            } else {
                logger.info('At mainController.js:540 User not created => ', JSON.stringify(requestBody));
            }
            return response;
        }
    } catch (error) {
        logger.error('adminController.js registerAdmin error=> ', error, requestBody);
        return {
            message: 'something went wrong while registering, please try again',
            status: 0,
        };
    }
}

/**
 * @description . Create Admin User
 * @param {Object} requestBody
 * @returns {Object}
 */

async function registerAdminUpdate(requestBody) {
    try {
        const { email,oldPwd, newPwd, newEmail } = requestBody;
       console.log('111111111111requestBody => ', requestBody);
        console.log("dddd")
        const data = await Admin.findOne({ email }).lean();
        console.log("11111111111user =>", data);

        if (data !== null) {
            const passwordMatch = await bcrypt.compare(oldPwd, data.password);
            console.log('passwordMatch =====> ', passwordMatch, "\n data =====> ", data);
            if (passwordMatch) {

                const updateData = {
                    $set:{
    
                    }
                };
                if(newPwd != ""){
                    
                    const hashedPassword = await bcrypt.hash(newPwd, 10);
                    updateData["$set"]["password"] = hashedPassword
                
                }
    
                if(newEmail != ""){
                    updateData["$set"]["email"] = newEmail
                
                }
    
    
                console.log("updateData ",updateData)
    
                const response = await Admin.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(data._id) }, updateData, { new: true });
            
                console.log("res",response)
                
                const token = await commonHelper.sign(data);
                data.token = token;
                delete data.password;
                return { status: 1, message: 'Update Admin Id Password Succesfully', data };
            } else return { status: 0, message: 'Incorrect Password' };
        } else {
            logger.info('At mainController.js:571 userId not found => ', JSON.stringify(requestBody));
            return { status: 0, message: 'Id not Found' };
        }

    } catch (error) {
        logger.error('adminController.js registerAdmin error=> ', error, requestBody);
        return {
            message: 'something went wrong while registering, please try again',
            status: 0,
        };
    }
}


/**
 * @description . Admin Login
 * @param {Object} requestBody
 * @returns {Object}
 */
async function adminLogin(requestBody) {

    const { email, password } = requestBody;
    console.log('email => ', email, '\n password => ', password);
    try {
        const data = await Admin.findOne({ email }).lean();

        // const token = await commonHelper.sign(data);
        // data.token = token;
        // delete data.password;
        // return { status: 1, message: 'Login Succesfully', data };


        if (data !== null) {
            const passwordMatch = await bcrypt.compare(password, data.password);
            console.log('passwordMatch =====> ', passwordMatch, "\n data =====> ", data);
            if (passwordMatch) {
                const token = await commonHelper.sign(data);
                data.token = token;
                delete data.password;
                return { status: 1, message: 'Login Succesfully', data };
            } else return { status: 0, message: 'Incorrect Password' };
        } else {
            logger.info('At mainController.js:571 userId not found => ', JSON.stringify(requestBody));
            return { status: 0, message: 'Id not Found' };
        }
    } catch (error) {
        logger.error('mainController.js adminLogin error=> ', error, requestBody);
        return { status: 0, message: 'No data found' };
    }
}


/**
 * @description . Add betlist
 * @param {Object} requestBody
 * @returns {Object}
 */
async function registerBetList(requestBody) {
    logger.info('registerBetList requestBody => ', requestBody);
    const { gameName, gameType, entryFee, chalLimit, potLimit, maxPlayer } = requestBody;
    try {
        const entryFeexists = await BetLists.countDocuments({ entryFee });
        if (entryFeexists > 0) {
            return { status: 0, message: 'Entry Fee Already Exists' };
        }
        const newData = { gameName, gameType, entryFee, chalLimit, potLimit, maxPlayer };
        const response = await usersHelper.betLists(newData);
        // logger.info('Create Bet table  response => ', response);
        if (response.status) {
            response.message = 'Register Bet Success';
        } else {
            response.message = 'Invalid Credential';
        }
        return response;
    } catch (error) {
        logger.error('mainController.js registerBetList error=> ', error, requestBody);
        return {
            message: 'something went wrong while registering, please try again',
            status: 0,
        };
    }
}

/**
 * @description . updateBetList
 * @param {Object} requestBody
 * @returns {Object}
 */
async function updateBetList(requestBody) {
    const { entryFee, gamePlayType } = requestBody;
    try {
        const data = await Users.findOne({
            entryFee: commonHelper.strToMongoDb(entryFee),
        }).lean();

        if (data !== null) {
            const res = { entryFee, gamePlayType };

            const result = await commonHelper.update(BetLists, { entryFee: commonHelper.strToMongoDb(entryFee) }, res);

            if (result.status === 1) {
                return { status: true, message: 'Update User Details Succesfully' };
            } else {
                return { status: false, message: 'Details not Updated' };
            }
        } else {
            return { status: 0, message: 'Id Not Found' };
        }
    } catch (error) {
        logger.error('mainController.js updateBetList error=> ', error, requestBody);
        return { status: 0, message: 'No data found' };
    }
}

/**
 * @description . getBetList
 * @param {Object} requestBody
 * @returns {Object}
 */
async function getBetList(requestBody) {
    try {
        const responseData = await BetLists.aggregate([
            { $sort: { entryFee: 1 } },
            {
                $project: {
                    entryFee: '$entryFee',
                    gamePlayType: '$gamePlayType',
                },
            },
        ]);

        if (responseData.length !== 0) {
            return { status: 1, message: 'result sucessfully ', data: responseData };
        } else {
            return { status: 0, message: 'data not find' };
        }
    } catch (error) {
        logger.error('mainController.js getBetList error=> ', error, requestBody);
    }
}

/**
 * @description . getBetDetails
 * @param {Object} requestBody
 * @returns {Object}
 */
async function getBetDetails(requestBody) {
    // console.info('request Body  Send  => ', requestBody);
    const { id } = requestBody;
    try {
        const responseData = await BetLists.findOne({
            _id: commonHelper.strToMongoDb(id),
        }).lean();

        //logger.info('responseData => ', responseData);
        // return responseData
        if (responseData !== null) {
            return { status: 1, message: 'result sucessfully ', data: responseData };
        } else {
            return { status: 0, message: 'data not find' };
        }
    } catch (error) {
        logger.error('mainController.js getBetDetails error=> ', error, requestBody);
    }
}

/**
 * @description . getBetList
 * @param {Object} requestBody
 * @returns {Object}
 */
async function getBannerList(requestBody) {
    try {

        const bannerListData = [
            {
                id: 1,
                title: "Important Announcement",
                imageUrl: "https://wallpapers.com/images/hd/youtube-banner-gaming-557nnzh0ovcuj01c.jpg",
                date: "2023-11-15",
            },
            {
                id: 2,
                title: "New Game Release",
                imageUrl: "https://img.freepik.com/premium-psd/gaming-youtube-banner_584197-753.jpg",
                date: "2023-11-10",
            }
        ]

        if (bannerListData.length !== 0) {
            return { status: 1, message: 'result sucessfully ', List: bannerListData };
        } else {
            return { status: 0, message: 'data not find' };
        }
    } catch (error) {
        logger.error('mainController.js getBetList error=> ', error, requestBody);
    }
}

module.exports = {
    registerAdmin,
    registerAdminUpdate,
    adminLogin,
    registerBetList,
    updateBetList,
    getBetList,
    getBetDetails,
    getBannerList,
}