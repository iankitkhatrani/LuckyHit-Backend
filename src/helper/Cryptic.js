/**
 *	@description - Utility to Encrypt/Decrypt String OR Object
 */
const CryptoJS = require('crypto-js');
const { crypto_secret, enableEncryption, socketObjJSON } = require('../../config');

class CrypticUtility {
  /**
   * 1. Encrypt String
   * @param {string} toEncrypt - String to Encrypt
   * @return {string} Encrypted String
   */
  encryptString(toEncrypt, stringify = true) {
    try {
      if (enableEncryption) {
        if (stringify) {
          toEncrypt = JSON.stringify(toEncrypt);
        }
        return CryptoJS.AES.encrypt(toEncrypt, crypto_secret).toString();
      }

      return toEncrypt;
    } catch (e) {
      console.log('!encryptString: Error Encrypting String!');
      return toEncrypt;
    }
  }

  /**
   * 2. Decrypt String
   * @param {string} toDecrypt - String to Encrypt
   * @return {string} Encrypted String
   */
  decryptString(toDecrypt, parseToJson = true) {
    try {
      if (enableEncryption) {
        const decrypted = CryptoJS.AES.decrypt(toDecrypt, crypto_secret).toString(CryptoJS.enc.Utf8);
        return parseToJson ? JSON.parse(decrypted) : decrypted;
      }
      return toDecrypt;
    } catch (e) {
      console.log('!decryptString: Error decryptString String!');
      return toDecrypt;
    }
  }

  /**
  * 3. Encrypt Object
  * @param {object} toEncrypt - Object to Encrypt
  * @return {object} Encrypted Object
  */
  encryptObject(toEncrypt) {
    try {
      if (enableEncryption) {
        Object.keys(toEncrypt).forEach((key) => {
          toEncrypt[key] = toEncrypt[key] + ''
          toEncrypt[key] = CryptoJS.AES.encrypt(toEncrypt[key], crypto_secret).toString()
        })
      }
    } catch (e) {
      console.log('!encryptString: Error Encrypting Object!', e);
    }
    return socketObjJSON ? JSON.stringify(toEncrypt) : toEncrypt;
  }

  /**
   * 4. Decrypt Object
   * @param {object} toDecrypt - Object to Encrypt
   * @return {object} Encrypted Object
   */
  decryptObject(toDecrypt) {
    try {
      if (enableEncryption) {
        Object.keys(toDecrypt).forEach((key) => {
          toDecrypt[key] = CryptoJS.AES.decrypt(toDecrypt[key], crypto_secret).toString(CryptoJS.enc.Utf8);
        })
      }
    } catch (e) {
      console.log('!decryptString: Error decryptString Object!', e);
    }
    return toDecrypt;
  }

}

module.exports = CrypticUtility;
