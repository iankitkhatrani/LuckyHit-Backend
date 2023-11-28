require('dotenv').config({});
module.exports = Object.freeze({
  DATABASE: process.env.MONGO_URL,

  // REDIS_HOST: process.env.REDIS_HOST,
  ENCRYPTION_TYPE: 'aes-256-cbc',
  ENCRYPTION_ENCODING: 'base64',
  BUFFER_ENCRYPTION: 'utf-8',

  AES_KEY: 'A60A5770FE5E7AB200BA9CFC94E4E8B0',
  AES_IV: '1234567887654321',


  OBJECT_ID: require('mongoose').Types.ObjectId,

  // HTTP Status
  OK_STATUS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  MEDIA_ERROR_STATUS: 415,
  VALIDATION_FAILURE_STATUS: 417,
  DATABASE_ERROR_STATUS: 422,
  INTERNAL_SERVER_ERROR: 500,

  MIME_TYPES: {
    image: ['image/png', 'image/jpeg', 'image/jpg', 'image/bmp', 'image/gif'],
  },

  // jwt
  SECRET_KEY: process.env.SECRET_KEY || 'gamz360',
  EXPIRED_TIME: '7d',

  SOCKET_CONNECT: 'http://localhost:2828/',

  MAIL_SERVICE: '',
  MAIL_ID: '',
  PASSWORD: '',
});
