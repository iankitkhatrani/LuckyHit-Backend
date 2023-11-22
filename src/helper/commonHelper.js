const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const crypto = require('crypto');
const config = require('../../config');
const logger = require('../../logger');

const commonHelper = {};

commonHelper.sign = async (plainObject) => {
  try {
    const data = await jwt.sign(plainObject, config.SECRET_KEY, {
      expiresIn: config.EXPIRED_TIME,
    });

    return data;
  } catch (error) {
    logger.error('Common Helper sign function error =>', error);
    return error;
  }
};



commonHelper.strToMongoDb = (str) => {
  try {
    return mongoose.Types.ObjectId(str);
  } catch (error) {
    return '';
  }
};

commonHelper.find = async (model, condition = { isDeleted: 0 }) => {
  try {
    const data = await model.find(condition).lean();
    if (data) {
      return { status: 1, message: 'Data found', data };
    } else {
      return { status: 0, message: 'Data Not found' };
    }
  } catch (error) {
    logger.error('Common Helper find function error =>', error);
    return { status: 0, message: 'No data found' };
  }
};

commonHelper.insert = async (Model, newData) => {
  try {
    const newObj = new Model(newData);
    const data = await newObj.save();
    if (data) {
      return {
        status: 1,
        message: 'record added',
        data: JSON.parse(JSON.stringify(data)),
      };
    } else {
      return { status: 0, message: 'record not added', data: null };
    }
  } catch (error) {
    logger.error('Common Helper insert function error =>', error);
    return { status: 0, message: 'No data found', error };
  }
};

commonHelper.update = async (model, condition, newData) => {
  try {
    const data = await model.findOneAndUpdate(condition, newData, {
      new: true,
    });

    if (data) {
      return { status: 1, message: 'Data updated', data };
    } else {
      return { status: 0, message: 'Data not updated' };
    }
  } catch (error) {
    logger.error('Common Helper update function error =>', error);
    return { status: 0, message: 'No data updated' };
  }
};

commonHelper.findOne = async (model, condition = {}) => {
  try {
    const data = await model.findOne(condition).lean();
    if (data !== null) {
      return { status: 1, message: 'Data found', data };
    } else {
      return { status: 0, message: 'No data found' };
    }
  } catch (error) {
    logger.error('Common Helper findOne function error =>', error);
    return { status: 0, message: 'No data found' };
  }
};

commonHelper.findOneAndUpdate = async (model, condition = {}) => {
  try {
    const data = await model.findOneAndUpdate(condition);
    if (data !== null) {
      return { status: 1, message: 'Data found', data };
    } else {
      return { status: 0, message: 'No data found' };
    }
  } catch (error) {
    logger.error('Common Helper findOneAndUpdate function error =>', error);
    return { status: 0, message: 'No data found' };
  }
};

commonHelper.deleteOne = async (model, condition = {}) => {
  try {
    const data = await model.deleteOne(condition).lean();
    if (data !== null) {
      return { status: 1, message: 'Data Deleted', data };
    } else {
      return { status: 0, message: 'No data Deleted' };
    }
  } catch (error) {
    logger.error('Common Helper deleteOne function error =>', error);
    return { status: 0, message: 'No data found' };
  }
};

commonHelper.encrypt = (jsonObject) => {
  try {
    const val = JSON.stringify(jsonObject);
    const key = Buffer.from(config.AES_KEY, config.BUFFER_ENCRYPTION);
    const iv = Buffer.from(config.AES_IV, config.BUFFER_ENCRYPTION);
    const cipher = crypto.createCipheriv(config.ENCRYPTION_TYPE, key, iv);

    let encrypted = cipher.update(val, config.BUFFER_ENCRYPTION, config.ENCRYPTION_ENCODING);
    encrypted += cipher.final(config.ENCRYPTION_ENCODING);
    return encrypted;
  } catch (error) {
    logger.error('Common Helper encrypt function error =>', error);
    return null;
  }
};

commonHelper.decrypt = (base64String) => {
  try {
    const buff = Buffer.from(JSON.stringify(base64String), config.ENCRYPTION_ENCODING);

    const key = Buffer.from(config.AES_KEY, config.BUFFER_ENCRYPTION);
    const iv = Buffer.from(config.AES_IV, config.BUFFER_ENCRYPTION);
    const decipher = crypto.createDecipheriv(config.ENCRYPTION_TYPE, key, iv);
    const deciphered = decipher.update(buff) + decipher.final();

    return deciphered;
  } catch (error) {
    logger.error('Common Helper decrypt function error =>', error);
    return null;
  }
};

module.exports = commonHelper;
