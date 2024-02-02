const server = require('https').createServer();
const schedule = require('node-schedule');

// eslint-disable-next-line no-undef
io = module.exports = require('socket.io')(server, { allowEIO3: true });

const logger = (module.exports = require('../../logger'));
const CONST = require('../../constant');
const signupActions = require('../helper/signups/index');
const commonHelper = require('../helper/commonHelper');
const gamePlayActions = require('../aviator/');
const BNWgamePlayActions = require('../blackNwhite/');
const { registerUser } = require('../helper/signups/signupValidation');
const mainCtrl = require('./mainController');
const { sendEvent, sendDirectEvent } = require('../helper/socketFunctions');
const { userReconnect } = require('../aviator/reConnectFunction');
const { getBannerList } = require('./adminController');


const myIo = {};

// create a init function for initlize the socket object
myIo.init = function (server) {
    // attach server with socket
    // eslint-disable-next-line no-undef
    io.attach(server);

    // eslint-disable-next-line no-undef
    io.on('connection', async (socket) => {

        try {
            // logger.info("Socket connected ===> ", socket.id);
            sendEvent(socket, CONST.DONE, {});

            socket.on('req', async (data) => {
                const decryptObj = commonHelper.decrypt(data.payload);
                const payload = JSON.parse(decryptObj);

                switch (payload.eventName) {

                    case CONST.PING: {
                        sendEvent(socket, CONST.PONG, {});
                        break;
                    }

                    case CONST.CHECK_MOBILE_NUMBER: {
                        try {
                            signupActions.checkMobileNumber(payload.data, socket);
                        } catch (error) {
                            logger.error('socketServer.js check Mobile Number User error => ', error);
                        }
                        break;
                    }

                    case CONST.REGISTER_USER: {
                        try {
                            await registerUser(payload.data, socket);
                        } catch (error) {
                            logger.error('socketServer.js Register User Table error => ', error);
                        }
                        break;
                    }

                    case CONST.SEND_OTP: {
                        try {
                            let result = await mainCtrl.otpSend(payload.data);
                            sendEvent(socket, CONST.SEND_OTP, result);
                        } catch (error) {
                            logger.error('socketServer.js Send Otp error => ', error);
                        }
                        break;
                    }

                    case CONST.VERIFY_OTP: {
                        try {
                            const result = await mainCtrl.verifyOTP(payload.data);
                            if (result.status) {
                                sendEvent(socket, CONST.VERIFY_OTP, { verified: true });
                            }
                            else {
                                sendEvent(socket, CONST.VERIFY_OTP, { verified: false });
                            }
                        } catch (error) {
                            logger.error('socketServer.js Verify Otp error => ', error);
                        }
                        break;
                    }

                    case CONST.LOGIN: {
                        try {
                            await signupActions.userLogin(payload.data, socket);
                        } catch (e) {
                            logger.info('Exception userLogin :', e);
                        }
                        break;
                    }

                    case CONST.DASHBOARD: {
                        try {
                            await signupActions.appLunchDetail(payload.data, socket);
                        } catch (e) {
                            logger.info('CONST.DASHBOARD Exception appLunchDetail :', e);
                        }
                        break;
                    }

                    case CONST.JOIN_SIGN_UP: {
                        socket.uid = payload.data.playerId;
                        socket.sck = socket.id;

                        await gamePlayActions.joinTable(payload.data, socket);
                        break;
                    }

                    case CONST.BNW_JOIN_SIGN_UP: {
                        socket.uid = payload.data.playerId;
                        socket.sck = socket.id;

                        await BNWgamePlayActions.joinTable(payload.data, socket);
                        break;
                    }

                    case CONST.ACTION: {
                        gamePlayActions.action(payload.data, socket);
                        break;
                    }

                    case CONST.BNW_ACTION: {
                        await BNWgamePlayActions.action(payload.data, socket);
                        break;
                    }

                    case CONST.CANCEL: {
                        gamePlayActions.Cancel(payload.data, socket);
                        break;
                    }

                    case CONST.MYBET: {
                        gamePlayActions.mybetlist(payload.data, socket);
                        break;
                    }


                    case CONST.CHECKOUT: {
                        gamePlayActions.CHECKOUT(payload.data, socket);
                        break;
                    }

                    case CONST.PLAYERLIST:{
                        gamePlayActions.PLAYERLIST(payload.data, socket);
                        break;
                    }

                    case CONST.MYREFLIST:{
                        gamePlayActions.MYREFLIST(payload.data, socket);
                        break;
                    }
                    

                    case CONST.LEAVE_TABLE: {
                        gamePlayActions.leaveTable(payload.data, socket);
                        break;
                    }

                    case CONST.BNW_LEAVE_TABLE: {
                        await BNWgamePlayActions.leaveTable(payload.data, socket);
                        break;
                    }

                    case CONST.BNW_PREVIOUS_RESULT_HISTORY: {
                        await BNWgamePlayActions.lastGameScoreBoard(payload.data, socket);
                        break;
                    }

                    case CONST.RECONNECT: {
                        await gamePlayActions.reconnect(payload.data, socket);
                        break;
                    }

                    case CONST.BNW_RECONNECT: {
                        logger.info("Re connect called by BNW");
                        await BNWgamePlayActions.reconnect(payload.data, socket);
                        break;
                    }

                    case CONST.MYPROFILE: {
                        await gamePlayActions.MYPROFILE(payload.data, socket);
                        break;
                    }

                    case CONST.MYWALLET: { 
                        await gamePlayActions.MYWALLET(payload.data, socket);
                        break;
                    }

                    case CONST.UPDATEPROFILE: {
                        await gamePlayActions.UPDATEPROFILE(payload.data, socket);
                        break;
                    }

                    case CONST.AVATARLIST: {
                        await gamePlayActions.AVATARLIST(payload.data, socket);
                        break;
                    }

                    case CONST.SHOPLIST: {
                        await gamePlayActions.SHOPLIST(payload.data, socket);
                        break;
                    }

                    case CONST.NOTICELIST: {
                        await gamePlayActions.NOTICELIST(payload.data, socket);
                        break;
                    }

                    case CONST.MAILLIST: {
                        await gamePlayActions.MAILLIST(payload.data, socket);
                        break;
                    }

                    case CONST.MAILREAD: {
                        await gamePlayActions.MAILREAD(payload.data, socket);
                        break;
                    }

                    case CONST.LB: {
                        await gamePlayActions.LB(payload.data, socket);
                        break;
                    }

                    case CONST.BANNER: {
                        const result = await getBannerList(payload.data, socket);
                        sendEvent(socket, CONST.BANNER, result);
                        break;
                    }

                    case CONST.ADDCARD: {
                        await gamePlayActions.ADDCARD(payload.data, socket);
                        break;
                    }

                    case CONST.GETCARD: {
                        await gamePlayActions.GETCARD(payload.data, socket);
                        break;
                    }

                    case CONST.WITHDRAWALREQ: {
                        await gamePlayActions.WITHDRAWALREQ(payload.data, socket);
                        break;
                    }

                    case CONST.BANNERLIST:{
                        await gamePlayActions.BANNERLIST(payload.data, socket);
                        break;
                    }

                    

                    default:
                        sendEvent(socket, CONST.INVALID_EVENT, {
                            msg: 'This Event Is Nothing',
                        });
                        break;
                }
            });

            /* Disconnect socket */
            socket.on('disconnect', async () => {
                try {
                    logger.info('\n<==== disconnect socket id ===>', socket.id, '\n Disconnect Table Id =>', socket.tbid);

                    const playerId = socket.uid;
                    let jobId = CONST.DISCONNECT + playerId;
                    logger.info('schedule USER Start DISCONNECTED jobId typeof : ', jobId, typeof jobId);

                    //object player is disconnect or not

                    let timerSet = Date.now() + 60000;
                    //await setDelay(jobId, new Date(delay), 'disconnect');
                    schedule.scheduleJob(jobId.toString(), timerSet, async function () {
                        const result = schedule.cancelJob(jobId);

                        logger.info('after USER JOB CANCELLED scheduleJob: ', result);
                        await gamePlayActions.disconnectTableHandle(socket);
                    });
                } catch (error) {
                    logger.error('socketServer.js error when user disconnect => ', error);
                }
            });
        } catch (err) {
            logger.info('socketServer.js error => ', err);
        }
    });
};

module.exports = myIo;
