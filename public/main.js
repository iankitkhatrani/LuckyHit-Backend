const { io } = require('socket.io-client');
const logger = require('../logger');
// eslint-disable-next-line no-undef
$(function () {
  const socket = io();
  socket.on('connect', () => {
    alert('User Is Connect!');
    logger.info('Socket Is connected!!'); // false
  });
  socket.on('disconnect', function () {
    alert('User Is disconnect!');
    logger.info('Socket disconnect....!');
    // window.location.reload();
  });
  // eslint-disable-next-line no-unused-vars
  function FillData(en) {
    logger.info('FillData : en :', en);
    if (en === 'SP') {
      try {
        let mobileNumber = document.getElementById('mobileNumber').value;

        let data = {
          mobileNumber: mobileNumber,
        };
        socket.emit('req', {
          en: en,
          headers: {
            authorization: {
              accessToken:
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtb2JpbGVOdW1iZXIiOnsibW9iaWxlTnVtYmVyIjoiKzkxLTAwMDAwMDEzMTcifSwiaWF0IjoxNjMxNjk0MDA2LCJleHAiOjMwMDAwMTYzMTY5NDAwNn0.BmiyTcTA6zlohSB8UQ6BH4QU5bGU34m0dRjCWiGRs_w',
            },
          },
          data: data,
        });
      } catch (error) {
        logger.info('FillData error : ', error);
      }
    }
    if (en === 'testEvent') {
      try {
        let eventData = document.getElementById('eventData').value;
        logger.info('Test Event data : ', eventData);
        let data = eventData;
        let tdata = JSON.parse(data);
        tdata.headers = {
          authorization: {
            accessToken:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtb2JpbGVOdW1iZXIiOnsibW9iaWxlTnVtYmVyIjoiKzkxLTAwMDAwMDEzMTcifSwiaWF0IjoxNjMxNjk0MDA2LCJleHAiOjMwMDAwMTYzMTY5NDAwNn0.BmiyTcTA6zlohSB8UQ6BH4QU5bGU34m0dRjCWiGRs_w',
          },
        };
        socket.emit('req', tdata);
      } catch (error) {
        logger.info('FillData error : ', error);
      }
    }
  }
});
