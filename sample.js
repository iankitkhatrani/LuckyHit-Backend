
const axios = require('axios');
const CryptoJS = require('crypto-js');

const mid = '900000000000026';
const SecretKey = "scr2dHNWS5QYjb07vVmVOu9VGG3JhG1dPP5";
const SaltKey = "salNeSAWnEOmCd3UiEBQozhWoUny5GIZg";
const StaticSalt = "Asdf@1234";

// Fix key to make sure it has the correct length
function fixKey(key) {
    return CryptoJS.enc.Hex.parse(CryptoJS.MD5(key).toString());
}

// Derive key using PBKDF2
function derivateKey(key, saltKey, iterations, keySize) {
    return CryptoJS.PBKDF2(key, CryptoJS.enc.Utf8.parse(saltKey), {
        keySize: keySize / 32,
        iterations: iterations
    });
}

// Encrypt function using CryptoJS
function encrypt(hashString, secretKey, saltKey, staticSalt) {
    const iv = CryptoJS.lib.WordArray.create(16); // Create a 16-byte IV
    let key = fixKey(secretKey + staticSalt);
    key = derivateKey(key, saltKey, 65536, 256);

    const cipher = CryptoJS.AES.encrypt(hashString, key, {
        iv: iv,
        format: CryptoJS.format.OpenSSL,
    });
    return cipher.toString();
}

function calculateChecksum(data, secretKey) {
    return CryptoJS.HmacSHA256(data, secretKey).toString(CryptoJS.enc.Hex);
}

async function sendPaymentRequest(requestData, socket) {
    try {
        logger.info("\n Send Payment Request : ", requestData);
        const { playerId, customerName, amount, currency, txnReqType, emailId, mobileNo, transactionMethod, optional1 } = requestData;

        const orderNo = generateReferenceNumber();
        const formattedDate = formatDate(new Date().toISOString());
        logger.info("formattedDate ", formattedDate);

        const paymentindata = await paymentin.create({
            userId: playerId,
            transactionId: orderNo,
            name: customerName,
            email: emailId,
            phone: mobileNo,
            amount: amount,
            paymentStatus: "Pending"
        });

        if (paymentindata) {
            logger.info("payload paymentindata =>", paymentindata);

            const dataSequence = [
                mid,
                orderNo,
                amount,
                "INR",
                "S",
                "", "", "", "", "", "", "", "", "",
                emailId,
                mobileNo,
                "", "", "", "",
                "UPI",
                "", "", "", "", "",
                customerName,
                "",
                "intent"
            ].join(',');

            logger.info("dataSequence =>", dataSequence);

            const encryptReq = encrypt(dataSequence, SecretKey, SaltKey, StaticSalt);
            logger.info("encryptReq =>", encryptReq);

            const checkSum = calculateChecksum(dataSequence, SecretKey);
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
                logger.error('Error: =>', error);
            }
        } else {
            logger.info("Data Not Insert");
            commandActions.sendEvent(socket, CONST.PAY_IN, {}, false, 'Something Went Wrong Please try again');
        }
    } catch (error) {
        logger.error("Pay In Error -->", error);
    }
}

const paymentParams = {
    playerId: "playerIdExample",
    customerName: "John Doe",
    amount: "25000",
    currency: "INR",
    txnReqType: "S",
    emailId: "abc@xyz.com",
    mobileNo: "9876543210",
    transactionMethod: "UPI",
    optional1: "intent"
};

// Example call to sendPaymentRequest
sendPaymentRequest(paymentParams, null); // Pass the appropriate socket instead of null
