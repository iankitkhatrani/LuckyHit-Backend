const mongoose = require('mongoose');
const MongoID = mongoose.Types.ObjectId;
const paymentin = mongoose.model('paymentin');
const GameUser = mongoose.model('users');
const crypto = require('crypto');
const CryptoJS = require("crypto-js");
const axios = require('axios');
const commandActions = require('../helper/socketFunctions');
const CONST = require('../../constant');
const logger = require('../../logger');
const { log } = require('console');

const mid = '900000000000026';
const SecretKey = "scr2dHNWS5QYjb07vVmVOu9VGG3JhG1dPP5";
const SaltKey = "salNeSAWnEOmCd3UiEBQozhWoUny5GIZg";
const StaticSalt = "Asdf@1234";
const keyLen = 35;

async function initiatePayment(requestData, socket) {
    try {
        logger.info("\n Send Payment Request : ", requestData);

        let customerName = 'test';
        let emailId = 'anilnikam619@gmail.com';
        let mobileNo = '8128154143';
        let testAmount = 10;

        const orderNo = generateReferenceNumber();
        const formattedDate = formatDate(new Date().toISOString());
        logger.info("formattedDate ", formattedDate);

        let paisaAmount = testAmount * 100;
        logger.info("paisaAmount ", paisaAmount);
        let finalAmount = paisaAmount.toString();
        logger.info("finalAmount ", finalAmount);

        let dataSequence = [
            mid,
            orderNo,
            finalAmount,
            "INR",
            "S",
            "", "", "", "", "", "", "", "", "", "",
            emailId,
            mobileNo,
            "", "", "", "",
            "UPI",
            "", "", "", "", "",
            customerName, "",
            "intent"
        ].join(',');

        logger.info("data Sequence =>", dataSequence);

        const encryptReq = getEncrypt("TrnPayment", dataSequence, SecretKey, SaltKey, StaticSalt);
        logger.info("encryptReq =>", encryptReq);

        let transactionMethod = '';
        let vpa = '';
        let cardNumber = '';
        let expiryDate = '';
        let cvv = '';
        let bankCode = '';

        const checkSum = getCheckSum(SaltKey, orderNo, finalAmount, "UPI", bankCode, vpa, cardNumber, expiryDate, cvv);
        logger.info("checkSum =>", checkSum);

        let postData = {
            mid: mid,
            encryptReq: encryptReq,
            checkSum: checkSum,
        };

        logger.info("postData =>", postData);

        try {
            const response = await axios.post('https://payin.paymor.in/PaymentGateway/api/seamless/txnReq', JSON.stringify(postData), {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            logger.info('Response: =>', response);

            const responseData = response.data;
            logger.info('\n ResponseData: =>', responseData);

            const parsedData = JSON.parse(responseData.data)
            logger.info('\n parsedData 111111 =>', parsedData);
            logger.info('\n parsedData respData.respData 222222 =>', parsedData.respData);

            // const data = JSON.parse(responseData?.data);
            // const respData = data?.respData;
            // const checkSum = data?.checkSum;

            if (responseData.respCode === '0') {
                logger.info('Payment Successfull');
                let newData = parsedData?.respData;
                logger.info(' \n newData : =>', newData);

                let decryptedData = decrypt(newData, SecretKey);

                logger.info('Decrypted Response Data: =>', decryptedData);

                let finalResponse = decryptedData.split(",");
                logger.info('\n 1 Final Response Data: =>', finalResponse);

                logger.info("\n finalResponse[26] =>", finalResponse[26].split(" ").join())
                let upi = finalResponse[26].split(" ").join()

                logger.info("\n UPi string =>", upi)
                commandActions.sendDirectEvent(socket, CONST.PAYIN_SUCCESS, {
                    upi: upi,
                    orderNo: orderNo,
                    amount: testAmount,
                    transactionMethod: transactionMethod,

                });

            } else {
                logger.error('Error in response:', responseData.respMsg);
            }

            // let res = decrypt(responseData, SecretKey);

        } catch (error) {
            logger.error('Error: =>', error.response ? error.response.data : error.message);
        }

    } catch (error) {
        logger.error("Pay In Error -->", error);
    }
}

function getEncrypt(msg, context, secretKey, saltKey, staticSalt) {
    let hashVarsSeq = [];

    // Use context to get the sequences for TrnPayment and TrnStatus
    if (msg === "TrnPayment") {
        hashVarsSeq = context.split(",");
    } else if (msg === "TrnStatus") {
        hashVarsSeq = context.split(",");
    }

    let hashString = "";
    let count = hashVarsSeq.length;

    hashVarsSeq.forEach((hash_var, index) => {
        hashString += hash_var;
        if (index !== count - 1) {
            hashString += ",";
        }
    });

    return encrypt(hashString, secretKey);
}

function derivateKey(password, salt, iterations, keyLengthBits) {
    return CryptoJS.PBKDF2(password, salt, {
        keySize: keyLengthBits / 32,
        iterations: iterations,
        hasher: CryptoJS.algo.SHA256,
    });
}

function encrypt(hashString, key) {
    logger.info("\n encrypt hashString =>", hashString);
    logger.info("\n encrypt key =>", key);
    const iv = CryptoJS.lib.WordArray.create(16); // Generate random IV
    key = fixKey(key);
    key = derivateKey(key, StaticSalt, 65536, 256);
    const cipher = CryptoJS.AES.encrypt(hashString, key, {
        iv: iv,
        format: CryptoJS.format.OpenSSL,
    });
    return cipher.toString();
}

function decrypt(data, key) {
    try {
        logger.info("\nBefore decrypt data =>", data);
        // logger.info("\n decrypt key =>", key);

        // data = JSON.stringify(data);
        // logger.info("\nAfter decrypt data =>", data);

        const iv = CryptoJS.lib.WordArray.create(16);
        key = fixKey(key);
        key = derivateKey(key, StaticSalt, 65536, 256);
        const decryptedRespponse = CryptoJS.AES.decrypt(data, key, {
            iv: iv,
            format: CryptoJS.format.OpenSSL,
        });
        logger.info("\n decryptedRespponse =>", decryptedRespponse);

        return decryptedRespponse.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        logger.error("Error in decrypt function:", error);

    }

}

function fixKey(key) {
    logger.info("key =>", key);

    if (key.length < keyLen) {
        return key.padEnd(keyLen, '0');
    }

    if (key.length > keyLen) {
        return key.substring(0, keyLen);
    }

    return key;
}

function base64Encode(data) {
    // return Buffer.from(data, 'utf8').toString('base64');
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(data));
}

function getCheckSum(saltKey, orderNo, amount, transactionMethod, bankCode, vpa, cardNumber, expiryDate, cvv) {
    logger.info("\n saltKey =>", saltKey);
    logger.info("\n all data =>", orderNo, " + amount + ", amount, " + transactionMethod =>", transactionMethod, " + bankCode =>", bankCode, " + vpa =>", vpa, " + ", cardNumber, " + ", expiryDate, " + ", cvv);

    const dataString = `${orderNo},${amount},${transactionMethod},${bankCode},${vpa},${cardNumber},${expiryDate},${cvv}`;
    saltKey = base64Encode(saltKey);

    let hashValue = CryptoJS.HmacSHA512(dataString, saltKey);
    hashValue = CryptoJS.enc.Hex.stringify(hashValue);
    logger.info("hashValue =>", hashValue);
    return hashValue.toUpperCase();
}

function generateReferenceNumber() {
    const digits = '0123456789';
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
