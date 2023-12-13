/**
 *	@description - Frequently used Application Utilities
 */
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { get } = require("lodash");

const { SECRET_KEY, TOKEN_EXPIRED_TIME, enableEncryption } = require("../../config");
const { UNAUTHORIZED, INTERNAL_SERVER_ERROR, BAD_REQUEST } = require("../../constant").STATUS;

const FileUtility = require("../helper/File");
const CrypticUtility = require("../helper/Cryptic");

const fileUtility = new FileUtility();
const crypticUtility = new CrypticUtility();

class CommonUtility {
  /**
   * 1. Returns String with Title Case
   * @param {string} string - String to Convert
   * @return {string} string - Converted String
   */
  async toTitleCase(string) {
    try {
      return string.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
    } catch (e) {
      console.log("!toTitleCase: Error converting String to Title Case!");
      return "";
    }
  }

  /**
   * 2. Returns Randomly generated String with Mentioned Length
   * @param {number} x - Length of String to be generated Randomly
   * @return {string} string - Randomly generated String
   */
  generateString(length) {
    let generatedString = "";
    while (generatedString.length < length && length > 0) {
      let randNum = Math.random();
      generatedString += randNum < 0.1 ? Math.floor(randNum * 100) : String.fromCharCode(Math.floor(randNum * 26) + (randNum > 0.5 ? 97 : 65));
    }
    return generatedString;
  }

  /**
   * 3. Return Token
   * @param {object} payload - JSON data to add in Token.
   */
  async createAuthToken(payload, expiryTime = TOKEN_EXPIRED_TIME) {
    return jwt.sign(payload, SECRET_KEY, {
      expiresIn: expiryTime,
    });
  }

  /**
   * 4. To verify if User is Logged In or not
   * @return {boolean}
   */
  async verifyUserAuth(req, res, next) {
    let token = req.header("Authorization");

    try {
      if (token) {
        try {
          token = crypticUtility.decryptString(token, false);
          const userDetails = jwt.verify(token, SECRET_KEY);

          req.user = userDetails;
          next();
        } catch (err) {
          return res.status(UNAUTHORIZED).json({ success: false, isInvalidToken: true, message: "Token Invalid" });
        }
      } else {
        return res.status(UNAUTHORIZED).json({ success: false, isInvalidToken: true, message: "Unauthorised Request" });
      }
    } catch (err) {
      return res.status(UNAUTHORIZED).json({ success: false, message: "Issue Processing Token" });
    }
  }

  /**
   * 5. To verify if Admin is Logged In or not
   * @return {boolean}
   */
  async verifyAdminAuth(req, res, next) {
    let token = req.header("Authorization");

    try {
      if (token) {
        try {
          token = crypticUtility.decryptString(token, false);
          const adminDetails = jwt.verify(token, SECRET_KEY);

          if (get(adminDetails, "role", "") === "admin") {
            req.admin = adminDetails;
            next();
          } else {
            return res.status(UNAUTHORIZED).json({ success: false, isInvalidToken: true, message: "Unauthorised Request" });
          }
        } catch (err) {
          console.log("err => ", err);

          return res.status(UNAUTHORIZED).json({ success: false, isInvalidToken: true, message: "Token Invalid" });
        }
      } else {
        return res.status(UNAUTHORIZED).json({ success: false, isInvalidToken: true, message: "Unauthorised Request" });
      }
    } catch (err) {
      return res.status(UNAUTHORIZED).json({ success: false, message: "Issue Processing Token" });
    }
  }

  /**
   * 6. Returns Randomly generated Number with Mentioned Length
   * @param {number} placeCount - place Count of Number to be generated Randomly
   * @return {string} string - Randomly generated String
   */
  generateNumber(placeCount) {
    let size = 1;
    for (let index = 1; index < placeCount; index++) {
      size *= 10;
    }
    return Math.floor(Math.random() * (9 * size)) + size;
  }

  /**
   * 7. Validate if Object is not empty/null/undefined
   * @param {Object} placeCount - place Count of Number to be generated Randomly
   * @return {Boolean} string - Randomly generated String
   */
  async isValidObject(testObject) {
    return testObject && typeof testObject === "object" && Object.keys(testObject).length;
  }

  /**
   * 8. Password Encrypt
   * @param {String} key - Password to be encrypted
   * @return {String} - Encrypted String
   */
  async encryptKeys(key) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(key, salt);
  }

  /**
   * 9. Validate key
   * @param {String} key - from user input
   * @param {String} existingKey - from Storage
   * @return {Boolean} - TRUE/FALSE
   */
  async validateKey(key, existingKey) {
    return await bcrypt.compare(key, existingKey);
  }

  /**
   * 10. Return Success Response
   * @param {String} message - message to be send as response
   * @param {Object} data - response to be send
   * @param {Object} additionalData - additional details to send
   * @param {Boolean} success - type of response
   */
  prepareSuccessResponse(message, data, additionalData = {}, success = true) {
    return {
      ...{ success, message, data },
      ...additionalData,
    };
  }

  /**
   * 11. Return Error Response
   * @param {object} errorObject - Error Object
   * @return {Object} - Error Response
   */
  prepareErrorResponse(errorObject) {
    fileUtility.logWriter("../logs/errors/", `Error:  ${errorObject}`);
    if (errorObject.name === "ValidationError") {
      const errors = {};
      const allErrors = errorObject.message.substring(errorObject.message.indexOf(":") + 1).trim();
      const allErrorsInArrayFormat = allErrors.split(",").map((err) => err.trim());
      allErrorsInArrayFormat.forEach((error) => {
        const [key, value] = error.split(":").map((err) => err.trim());
        errors[key] = value;
      });
      return {
        success: false,
        message: errorObject.name,
        errors: errors,
      };
    } else if (errorObject.name === "MongoServerError") {
      return {
        success: false,
        message: errorObject.name,
        error: errorObject.code === 11000 ? `${Object.keys(errorObject.keyPattern).join(",")} already registered` : errorObject.name,
      };
    } else {
      return {
        success: false,
        message: errorObject.name,
        error: errorObject.message,
      };
    }
  }

  /**
   * @description 12. Encrypting Password to Store
   * @param {String} password
   */
  async generatePassword(password) {
    try {
      const salt = await bcrypt.genSalt(10);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      console.log("error", error);
      return error;
    }

  }

  /**
   * @description 13. Validate password
   * @param {String} password
   */
  async validatePassword(password, existingPassword) {
    return await bcrypt.compare(password, existingPassword);
  }

  /**
   * @description 14. Verification of token for Reset password
   * @return {boolean}
   */
  async verifyPasswordToken(req, res, next) {
    let token = req.header("Authorization");

    try {
      if (token) {
        token = crypticUtility.decryptString(token, false);
        try {
          const userDetails = jwt.verify(token, SECRET_KEY);
          req.user = userDetails;
          next();
        } catch (err) {
          return res.status(UNAUTHORIZED).json({ success: false, isInvalidToken: true, message: "Password Token Invalid" });
        }
      } else {
        return res.status(UNAUTHORIZED).json({ success: false, isInvalidToken: true, message: "Unauthorised Password Token" });
      }
    } catch (err) {
      return res.status(UNAUTHORIZED).json({ success: false, message: "Issue Processing Password Token" });
    }
  }

  /**
   * @description 15. Verification of email verification token
   * @return {boolean}
   */
  async verifyEmailVerificationToken(req, res, next) {
    let token = req.header("Authorization");

    try {
      if (token) {
        token = crypticUtility.decryptString(token, false);
        try {
          const userDetails = jwt.verify(token, SECRET_KEY);
          req.user = userDetails;
          next();
        } catch (err) {
          return res.status(BAD_REQUEST).json({ success: false, isInvalidToken: true, message: "Token invalid, Try to resend email" });
        }
      } else {
        return res.status(BAD_REQUEST).json({ success: false, isInvalidToken: true, message: "Unauthorised Token" });
      }
    } catch (err) {
      return res.status(BAD_REQUEST).json({ success: false, message: "Issue Processing Token, Try to resend email" });
    }
  }

  /**
   * @description 16. decode token
   * @return {boolean}
   */
  async decodeToken(token, ignoreExpiration = true) {
    try {
      try {
        const userDetails = jwt.verify(token, SECRET_KEY, { ignoreExpiration });
        return userDetails;
      } catch (err) {
        throw err;
      }
    } catch (err) {
      throw err;
    }
  }

  /**
   * @description 17. Decrypt the body payload
   * @return {boolean}
   */
  async decryptBody(req, res, next) {
    try {
      if (enableEncryption && req?.body?.data) {
        req.body = crypticUtility.decryptString(req.body.data);
      }
      next();
    } catch (err) {
      return res.status(INTERNAL_SERVER_ERROR).json({ success: false, message: "Issue Processing Data" });
    }
  }
}

module.exports = CommonUtility;
