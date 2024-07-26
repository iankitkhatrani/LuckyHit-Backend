const mongoose = require('mongoose');
const MongoID = mongoose.Types.ObjectId;
const paymentin = mongoose.model('paymentin');

const GameUser = mongoose.model('users');
const crypto = require('crypto');
const axios = require('axios');
const commandActions = require('../helper/socketFunctions');
const CONST = require('../../constant');
const logger = require('../../logger');


const mid = '900000000000026'
const SecretKey = "scr2dHNWS5QYjb07vVmVOu9VGG3JhG1dPP5"
const SaltKey = "salNeSAWnEOmCd3UiEBQozhWoUny5GIZg"
const StaticSalt = "Asdf@1234";

async function initiatePayment(requestData, socket) {
    try {
        logger.info("\n Send Payment Request : ", requestData);
        const { playerId, customerName, amount, currency, txnReqType, emailId, mobileNo, optional1 } = requestData;

        let testAmount = 10
        const orderNo = generateReferenceNumber();
        const formattedDate = formatDate(new Date().toISOString());
        logger.info("formattedDate ", formattedDate);

        const paymentindata = await paymentin.create({
            userId: playerId,
            transactionId: orderNo,
            name: customerName,
            email: emailId,
            phone: mobileNo,
            amount: testAmount,
            paymentStatus: "Pending"
        });

        let paisaAmount = testAmount * 100;
        logger.info("paisaAmount ", paisaAmount);
        let finalAmount = paisaAmount.toString();
        logger.info("final paisaAmount ", finalAmount);

        if (paymentindata) {
            logger.info("payload paymentindata =>", paymentindata);

            let dataSequence = [
                mid,
                orderNo,
                finalAmount,
                "INR",
                "S",
                "", "", "", "", "", "", "", "", "",
                emailId,
                mobileNo,
                "", "", "", "",
                "UPI",
                "", "", "", "", "",
                customerName, "",
                "intent"
            ].join(',');

            logger.info("data Sequence =>", dataSequence);

            const encryptReq = encrypt(dataSequence, SecretKey, SaltKey, StaticSalt);
            logger.info("encryptReq =>", encryptReq);


            // const checkSum = getCheckSum(dataSequence, SecretKey);
            let transactionMethod = ''
            let vpa = ''
            let cardNumber = ''
            let expiryDate = ''
            let cvv = ''
            let bankCode = ''



            const checkSum = getCheckSum(SaltKey, orderNo, finalAmount, transactionMethod, bankCode, vpa, cardNumber, expiryDate, cvv);
            logger.info("checkSum =>", checkSum);

            const postData = {
                encryptReq,
                checkSum,
                mid
            };

            try {
                const response = await axios.post('https://payin.paymor.in/PaymentGateway/api/seamless/txnReq', postData, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                logger.info('Response: =>', response.data);
            } catch (error) {
                logger.error('Error: =>', error.response ? error.response.data : error.message);
            }
        } else {
            logger.info("Data Not Insert");
            commandActions.sendEvent(socket, CONST.PAY_IN, {}, false, 'Something Went Wrong Please try again');
        }
    } catch (error) {
        logger.error("Pay In Error -->", error);
    }
}

function derivateKey(password, salt, iterations, keyLengthBits) {
    const key = crypto.pbkdf2Sync(password, salt, iterations, keyLengthBits / 8, 'sha256');
    return key;
}

function encrypt(data, secretKey, saltKey, staticSalt) {
    const iv = crypto.randomBytes(16);
    const key = derivateKey(secretKey, saltKey + staticSalt, 65536, 256);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + encrypted;
}

function base64Encode(data) {
    return Buffer.from(data, 'utf8').toString('base64');
}

function getCheckSum(saltKey, orderNo, amount, transactionMethod, bankCode, vpa, cardNumber, expiryDate, cvv) {
    const dataString = `${orderNo},${amount},${transactionMethod},${bankCode},${vpa},${cardNumber},${expiryDate},${cvv}`;
    const base64SaltKey = base64Encode(saltKey);
    let hashValue = crypto.createHmac('sha512', Buffer.from(base64SaltKey, 'base64')).update(dataString).digest('hex');
    return hashValue.toUpperCase();
}

function generateReferenceNumber() {
    // Create a string of all digits (0-9)
    const digits = '0123456789';

    // Generate a random string of 10 characters from the digits string
    let referenceNumber = '';
    for (let i = 0; i < 10; i++) {
        const randomIndex = Math.floor(Math.random() * digits.length);
        referenceNumber += digits[randomIndex];
    }

    return referenceNumber;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}


module.exports = {
    initiatePayment,
    generateReferenceNumber,
    encrypt,
};


