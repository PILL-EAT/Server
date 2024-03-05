const { socket } = require('server/router');
var db = require('./db');
var moment = require('moment');
require('moment-timezone');

// 날짜 생성 함수
function getCurrentDate() {
    moment.tz.setDefault("Asia/Seoul");
    return moment().format('YYYY-MM-DD');
}

module.exports = {
    enroll: (req, res) => {
        try {
            const takerId = req.params.userId;
            const enrollData = req.body;
    
            console.log(`takerId: ${takerId}, enroll: ${JSON.stringify(enrollData)}`);
            console.log(enrollData.date);
    
            const times = enrollData.time[0];
            const queryPromises = [];
    
            var date = getCurrentDate();

            // IoT 기기에 이미 등록된 약인지 확인
            db.query('SELECT pill_name from pill_alert where taker_id = ? and iotYN = 1', [takerId],
                async (err, iotcheck) => {
                    if (err) {
                        const errorResponse = {
                            isSuccess: false,
                            code: 600,
                            message: "요청에 실패하였습니다.",
                        };
                        return res.json(errorResponse);
                    }
    
                    if (enrollData.iot === 1 && iotcheck.length > 0 && enrollData.name !== iotcheck[0].pill_name) {
                        console.log("이미 기기에 등록된 약이 있습니다.")
                        const errorResponse = {
                            isSuccess: false,
                            code: 600,
                            message: "이미 기기에 등록된 약이 있습니다.",
                        };
                        return res.json(errorResponse);
                    }

                    for (let i = 0; i < enrollData.date; i++) {
                        console.log(times['time' + (i + 1)]);
            
                        // 각 쿼리를 Promise로 감싸고 배열에 추가
                        const queryPromise = new Promise((resolve, reject) => {
                            db.query(
                                'INSERT INTO pill_alert (taker_id, pill_name, pill_kind, alert_time, alert_day, iotYN) VALUES(?,?,?,?,?,?)',
                                [takerId, enrollData.name, enrollData.category, times['time' + (i + 1)], enrollData.day, enrollData.iot],
                                (err, result) => {
                                    if (err) {
                                        const errorResponse = {
                                            isSuccess: false,
                                            code: 600,
                                            message: "요청에 실패하였습니다.",
                                        };
                                        reject(errorResponse);
                                    } else {
                                        const pillAlertId = result.insertId;
                                        db.query('INSERT INTO pill_history (date, pill_alert_id, taker_id, pill_name, pill_kind, alert_time, alert_day, iotYN, is_taken) VALUES(?,?,?,?,?,?,?,?,?)',
                                                [date, pillAlertId, takerId, enrollData.name, enrollData.category, times['time' + (i + 1)], enrollData.day, enrollData.iot, 0], 
                                                (err, result2) => {
                                                if (err) {
                                                    const errorResponse = {
                                                        isSuccess: false,
                                                        code: 600,
                                                        message: "요청에 실패하였습니다.",
                                                    };
                                                    reject(errorResponse);
                                                } else {
                                                    resolve(result);
                                                }
                                            });
                                    }
                                }
                            );
                        });
            
                        queryPromises.push(queryPromise);
                    }
                    // 모든 Promise가 완료될 때까지 대기
                    Promise.all(queryPromises)
                    .then(results => {
                        const responseData = {
                            isSuccess: true,
                            code: 200,
                            message: "요청에 성공하였습니다.",
                            results: results,
                        };
                        res.json(responseData);
                    })
                    .catch(error => {
                        console.error(error);
                        const errorResponse = {
                            isSuccess: false,
                            code: 600,
                            message: "요청에 실패하였습니다.",
                        };
                        res.json(errorResponse);
                    });
                })
        } catch (error) {
            console.error(error);
            const errorResponse = {
                isSuccess: false,
                code: 600,
                message: "요청에 실패하였습니다.",
            };
            res.json(errorResponse);
        }
    },

    //등록한 약 목록 불러오기
    enrollList: (req, res) => {
        var takerId = req.params.userId;
    
        console.log(`enrollList, takerId: ${takerId}`)
    
        db.query('SELECT * FROM pill_alert WHERE taker_id = ? ORDER BY alert_time ASC;', [takerId], (err, result) => {
            if (err) {
                console.log(err)
                const responseData = {
                    isSuccess: false,
                    code: 600,
                    message: "요청에 실패하였습니다.",
                    result: null
                };
                return res.json(responseData);
            } else {
                if (result.length === 0) {
                    // 데이터가 없는 경우
                    const responseData = {
                        isSuccess: true,
                        code: 404,
                        message: "데이터가 없습니다.",
                        result: {
                            drugs: []
                        }
                    };
                    return res.json(responseData);
                }

                const drugs = result.map(resultItem => ({
                    drugId: resultItem.pill_alert_id,
                    name: resultItem.pill_name,
                    category: resultItem.pill_kind,
                    time: resultItem.alert_time,
                    day: resultItem.alert_day.split('').map(String), // 요일 데이터를 리스트 형태로 변환
                    iot: resultItem.iotYN
                }));
    
                const responseData = {
                    isSuccess: true,
                    code: 200,
                    message: "요청에 성공하였습니다.",
                    result: {
                        drugs: drugs
                    }
                };
                res.json(responseData);
            }
        });
    },

    //등록한 약 삭제 요청
    enrollDelete: (req,res) => {
        var drugId = req.params.drugId;
        var date = getCurrentDate();

        console.log(`enrollDelete, drugId: ${drugId}`)
        
        query1 = 'DELETE FROM pill_history WHERE pill_alert_id = ? AND date = ?;';
        query2 = 'DELETE FROM pill_alert WHERE pill_alert_id = ?;';
        
        // user 테이블에서 삭제
        db.query(query1+query2, [drugId, date, drugId, ], (err, result) => {
            if (err) {
                const responseData = {
                    isSuccess: false,
                    code: 600,
                    message: `요청에 실패하였습니다.`,
                };
                return res.json(responseData);
            }else{
                const responseData = {
                    isSuccess: true,
                    code: 200,
                    message: `요청에 성공하였습니다.`,
                };
                res.json(responseData);
            }
        });
    },

    // 복용 완료 여부 리스트 불러오기
    record:(req,res)=>{
        var takerId = req.params.takerId;
        var date = req.params.date;

        console.log(`drug-list takerId = ${takerId}, date = ${date}`)

        db.query(`SELECT * FROM pill_history WHERE taker_id = ? AND date = ? ORDER BY alert_time ASC;`, 
                [takerId, date], (err, result) => {
            if (err) {
                console.log(err)
                const responseData = {
                    isSuccess: false,
                    code: 600,
                    message: "요청에 실패하였습니다.",
                    result: null
                };
                return res.json(responseData);
            }else{
                const list= result.map(result => ({
                    userId: result.taker_id,
                    drugId: result.pill_alert_id,
                    name: result.pill_name,
                    time: result.alert_time,
                    finishYN : result.is_taken,
                    iot: result.iotYN
                  }));
                  console.log(list)
                const responseData = {
                    isSuccess: true,
                    code: 200,
                    message: "요청에 성공하였습니다.",
                    result: {
                        list: list
                      }
                };
                res.json(responseData);
            } 
        });
    },

    // 보호자 등록
    inputProtector: (req, res) => {
        var takerId = req.params.takerId;
        var inputData = req.body;
        console.log(`inputProtector ${takerId} ${inputData}`);

        // 전화번호 확인 - user 테이블
        db.query('SELECT * FROM user WHERE user_number = ?', [inputData.phone], (err, result) => {
            if (err) {
                console.log(err)
                // 에러 처리
                const responseData = {
                    isSuccess: false,
                    code: 2017,
                    message: "요청에 실패하였습니다.",
                };
                return res.json(responseData);
            }
            if (result.length === 0) {
                // 전화번호가 일치하는 유저가 없다면
                const responseData = {
                    isSuccess: false,
                    code: 2017,
                    message: "등록된 전화번호가 없습니다.",
                };
                return res.json(responseData);
            } else {
                if (result[0].user_type === "protector") {
                    // 회원 가입
                    db.query('UPDATE user SET protector_id = ? WHERE user_id = ?', [result[0].user_id, takerId], (err, updateResult) => {
                        if (err) {
                            throw err;
                        }
                        const responseData = {
                            isSuccess: true,
                            code: 1000,
                            message: "요청에 성공하였습니다.",
                        };
                        return res.json(responseData);
                    });
                } else {
                    // 유저의 type이 "protector"가 아니라면
                    const responseData = {
                        isSuccess: false,
                        code: 2017,
                        message: "해당 유저는 보호자가 아닙니다.",
                    };
                    return res.json(responseData);
                }
            }
        });
    },

    // ioT기기 등록
    inputIoT: (req, res) => {
        var takerId = req.params.takerId;
        var inputData = req.body;
        console.log(`inputIoT takerId = ${takerId} ${inputData}`);

        console.log(inputData.iotCode)

        // iot_code 확인
        db.query('SELECT * FROM iot WHERE iot_code = ?', [inputData.iotCode], (err, result) => {
            if (err) {
                console.log(err)
                // 에러 처리
                const responseData = {
                    isSuccess: false,
                    code: 2017,
                    message: "요청에 실패하였습니다.",
                };
                return res.json(responseData);
            }
            if (result.length === 0) {
                // code가 일치하지 않는다면
                const responseData = {
                    isSuccess: false,
                    code: 2017,
                    message: "올바른 code를 입력해주세요.",
                };
                return res.json(responseData);
            } else {
                // 해당 사용자에 iot 기기 등록
                    db.query('UPDATE user SET iot_id = ? WHERE user_id = ?', [result[0].iot_id, takerId], (err, updateResult) => {
                        if (err) {
                            throw err;
                        }
                        const responseData = {
                            isSuccess: true,
                            code: 1000,
                            message: "요청에 성공하였습니다.",
                        };
                        return res.json(responseData);
                    });
            }
        });
    }
}
