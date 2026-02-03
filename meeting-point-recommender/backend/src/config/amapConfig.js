require('dotenv').config();

module.exports = {
  serverKey: process.env.BMAP_SERVER_KEY,
  baseUrl: 'https://api.map.baidu.com'
};
