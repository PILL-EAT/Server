const express = require('express');
var router = express.Router()

var taker = require('../lib/taker');


// 등록한 약 목록 불러오기
router.get('/drug/enroll-list/:userId', (req, res) => {
    taker.enrollList(req, res);
});

// 복용할 약 등록
router.post('/drug/enroll/:userId', (req, res) => {
    taker.enroll(req, res);
});

// 등록한 약 삭제 요청
router.delete('/drug/enroll-delete/:drugId', (req, res) => {
    taker.enrollDelete(req,res);
});

// 복용 완료 여부 리스트 불러오기
router.get('/record/:takerId/:date', (req, res) => {
    taker.record(req,res);
});

// 보호자 등록
router.post('/input-protector/:takerId', (req, res) => {
    taker.inputProtector(req, res);
});

// 기기 등록
router.post('/input-iot/:takerId', (req, res) => {
    taker.inputIoT(req, res);
});

module.exports = router;