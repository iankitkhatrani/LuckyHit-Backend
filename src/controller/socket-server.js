const server = require('https').createServer();
const schedule = require('node-schedule');

// eslint-disable-next-line no-undef
io = module.exports = require('socket.io')(server, { allowEIO3: true });

const logger = (module.exports = require('../../logger'));
const CONST = require('../../constant');
const signupActions = require('../helper/signups/index');
const commonHelper = require('../helper/commonHelper');
const gamePlayActions = require('../eviator/');
const { registerUser } = require('../helper/signups/signupValidation');
const mainCtrl = require('./mainController');
const { sendEvent, sendDirectEvent } = require('../helper/socketFunctions');
const { userReconnect } = require('../eviator/reConnectFunction');
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
                            if (result.status && payload.data.otpType === 'signup') {
                                sendEvent(socket, CONST.VERIFY_OTP, result.data);
                                await registerUser(payload.data, socket);
                            }
                            else if (result.status && payload.data.otpType == 'login') {
                                await signupActions.userLogin(payload.data, socket);
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

                    case CONST.GET_TEEN_PATTI_ROOM_LIST: {
                        try {
                            await gamePlayActions.getBetList(payload.data, socket);
                        } catch (error) {
                            logger.error('socketServer.js GET_TEEN_PATTI_ROOM_LIST error => ', error);
                        }
                        break;
                    }

                    case CONST.JOIN_SIGN_UP: {
                        socket.uid = payload.data.playerId;
                        socket.sck = socket.id;

                        await gamePlayActions.joinTable(payload.data, socket);
                        break;
                    }


                    case CONST.SHOW: {
                        gamePlayActions.show(payload.data, socket);
                        break;
                    }

                    case CONST.ACTION: {
                        gamePlayActions.action(payload.data, socket);
                        break;
                    }

                    case CONST.PACK: {
                        gamePlayActions.cardPack(payload.data, socket);
                        break;
                    }

                    case CONST.SEE_CARD: {
                        gamePlayActions.seeCard(payload.data, socket);
                        break;
                    }

                    case CONST.LEAVE_TABLE: {
                        gamePlayActions.leaveTable(payload.data, socket);
                        break;
                    }

                    case CONST.RECONNECT: {
                        await userReconnect(payload.data, socket);
                        break;
                    }

                    case CONST.BANNER: {
                        const result = await getBannerList(payload.data, socket);
                        sendEvent(socket, CONST.BANNER, result);
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
