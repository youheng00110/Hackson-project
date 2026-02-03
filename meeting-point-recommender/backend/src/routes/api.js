/**
 * API 路由
 */

const express = require('express');
const router = express.Router();
const meetingPointController = require('../controllers/meetingPointController');

// 会面点计算
router.post('/meeting-point/calculate', (req, res) =>
    meetingPointController.calculate(req, res)
);

// 地理编码
router.post('/geocode', (req, res) =>
    meetingPointController.geocode(req, res)
);

// 逆地理编码
router.post('/reverse-geocode', (req, res) =>
    meetingPointController.reverseGeocode(req, res)
);

// POI 搜索
router.post('/poi/search', (req, res) =>
    meetingPointController.searchPOI(req, res)
);

module.exports = router;
