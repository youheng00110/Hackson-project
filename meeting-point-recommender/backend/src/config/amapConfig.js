require('dotenv').config({ path: '../.env' });

module.exports = {
  serverKey: process.env.BMAP_SERVER_KEY,
  baseUrl: 'https://api.map.baidu.com'  // 百度地图 API 基础地址
};
