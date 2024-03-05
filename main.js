// index.js
const express = require('express');
const bodyParser = require('body-parser');
const webSocketSetup = require('./lib/socketEvents');
const schedulerSetup = require('./lib/scheduler');
var moment = require('moment');
require('moment-timezone');

const app = express();
const http = require('http');
const port = 60037;

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// db 정의 모듈
const db = require('./lib/db');

// 사용자 정의 모듈
var userRouter = require('./router/userRouter');
var takerRouter = require('./router/takerRouter');
var managerRouter = require('./router/managerRouter');

// 웹소켓 및 스케줄러 설정
webSocketSetup(app);
schedulerSetup();

// 서버 작동 확인용
app.get('/', (req, res) => {
    res.send('Your server is on');
});

// 라우터 설정
app.use('/user', userRouter);
app.use('/taker', takerRouter);
app.use('/manager', managerRouter);

// 서버 리스닝
app.listen(port,'0.0.0.0', () => {
    moment.tz.setDefault("Asia/Seoul");

    var date = moment().format('YYYY-MM-DD');
    var time = moment().format('HH:mm:ss');

    var dayOfWeek = moment().isoWeekday(); // 월요일은 1, 일요일은 7

    console.log(`현재 시간 ${date} ${time}`)
    console.log(`현재 날짜 ${dayOfWeek}`)
        
        db.query(`SELECT * FROM pill_history WHERE date = ?`,[date], (err, result)=>{
            if (err){
                throw(err)
            }
            if(result.length === 0){
                db.query(`INSERT INTO pill_history (date, pill_alert_id, taker_id, pill_name, pill_kind, alert_time, alert_day, iotYN, is_taken)
                SELECT '${date}' as date, pill_alert_id, taker_id, pill_name, pill_kind, alert_time, alert_day, iotYN, false as is_taken
                FROM pill_alert
                WHERE SUBSTRING(alert_day, '${dayOfWeek}', 1) = '1';`,
                (err,result)=>{
                    if (err){
                        throw(err)
                    }
                })
            }  
        })
    console.log(`Server is running at http://ceprj.gachon.ac.kr:${port}`);
});


