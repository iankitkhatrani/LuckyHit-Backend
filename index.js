// load configuration data
const fs = (module.exports = require('graceful-fs'));
module.exports = require('https');
const express = (module.exports = require('express'));
// const { REDIS_HOST } = require('./config')

const http = require('http');
const path = require('path');
const cors = require('cors');


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
const SERVER_PORT = (module.exports = process.env.PORT || 3000);

// const RDS_HOST = "127.0.0.1";
// const RDS_HOST = REDIS_HOST
// const RDS_SELECT = 1
const redis = require('redis');
// logger.info('http.js \nSERVER_PORT', SERVER_PORT + ' \nSERVER_ID', SERVER_ID);

(async () => {
  const rClient = (module.exports = redis.createClient());
  // eslint-disable-next-line no-console
  rClient.on('error', (err) => logger.info('Redis Client Error', err));
  rClient.on('connect', () => {
    // logger.info('Redis Client connected')
  });
})();

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
  logger.info('Server ID : => ' + SERVER_ID + ' - Express server listening on port : ' + SERVER_PORT + ' date : ' + new Date());
  socket.init(server);
});

process.on('unhandledRejection', (reason, p) => {
  logger.info(reason, ' > Unhandled Rejection at Promise: ', p);
});

process.on('uncaughtException', (err) => {
  logger.info(err, '< Uncaught Exception thrown');
});
