// load configuration data
const fs = (module.exports = require('graceful-fs'));
module.exports = require('https');
// const express = (module.exports = require('express'));
const express = require('express');
// const { REDIS_HOST } = require('./config')

const http = require('http');
const path = require('path');
const cors = require('cors');

GAMELOGICCONFIG = module.exports = require('./gamelogic.json')


require('./database/mongoDbConnection');

const modelsPath = './src/models';
const dirents = fs.readdirSync(modelsPath, { withFileTypes: true });

const filesNames = dirents.filter((dirent) => dirent.isFile()).map((dirent) => dirent.name);

filesNames.forEach((file) => {
  if (file.endsWith('.js')) {
    require(`${modelsPath}/${file}`);
  }
});

const SERVER_ID = (module.exports = 'HTTPServer');
const SERVER_PORT = (module.exports = process.env.PORT || 2828);

// const RDS_HOST = "127.0.0.1";
// const RDS_HOST = REDIS_HOST
const RDS_SELECT = 1
const redis = require('redis');
// logger.info('http.js \nSERVER_PORT', SERVER_PORT + ' \nSERVER_ID', SERVER_ID);


rclient = module.exports = redis.createClient(6379, "13.50.221.113", () => { });
rclient.auth("luckyhit123", function () { });

rclient1 = module.exports = redis.createClient(6379, "13.50.221.113", () => { });
rclient1.auth("luckyhit123", function () { });

rclient.select(10);
// eslint-disable-next-line no-console
rclient.on('error', (err) =>
  logger.info("Redis Client Error ", err));
rclient.on('connect', () => {
  logger.info('Redis Client connected')

});

rclient1.select(10);
// eslint-disable-next-line no-console
rclient1.on('error', (err) =>
  logger.info("Redis Client Error ", err));
rclient1.on('connect', () => {
  logger.info('Redis Client connected')

  //gamePlayActions.Redisbinding()

});



const socket = require('./src/controller/socket-server');
const logger = (module.exports = require('./logger'));

// server start configuration here.

const httpApp = (module.exports = express());
// binding all configuratio to app

httpApp.use(express.json());
httpApp.use(
  cors({
    origin: '*',
    methods: 'GET,PUT,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);


// New Routes
const admin = require('./src/routes/admin');
// const user = require('./src/routes/users');
// require("./src/routes/admin/upi")(httpApp, express);
require("./src/routes/index")(httpApp, express);

const morgan = require('morgan');
httpApp.use(morgan('combined'));


httpApp.use('/admin', admin);
// httpApp.use('/user', user);

httpApp.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

httpApp.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(httpApp);
server.listen(SERVER_PORT, () => {
  console.info('  Express server listening on port : ' + SERVER_PORT + ' date : ' + new Date());
  socket.init(server);
});

process.on('unhandledRejection', (reason, p) => {
  logger.info(reason, ' > Unhandled Rejection at Promise: ', p);
});

process.on('uncaughtException', (err) => {
  logger.info(err, '< Uncaught Exception thrown');
});
