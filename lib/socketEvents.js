// webSocketSetup.js
const expressWs = require('express-ws');
const db = require('./db');
var moment = require('moment');
require('moment-timezone');

// 클라이언트 소켓을 저장하는 Map 객체 생성
const clients = new Map();

// 웹 소켓 설정 함수
function setupWebSocket(app) {
    expressWs(app);

    // '/ws' 엔드포인트에 웹 소켓 이벤트 핸들러 등록
    app.ws('/ws', (ws, req) => {
        console.log('클라이언트가 연결되었습니다.');

        // 클라이언트 메시지 수신 이벤트 핸들러 등록
        ws.on('message', (rawMessage) => {
            handleMessage(ws, rawMessage);
        });

        // 웹 소켓 연결 종료 이벤트 핸들러 등록
        ws.on('close', () => {
            handleWebSocketClose(ws);
        });
    });
}



// 클라이언트 메시지 처리 함수
function handleMessage(ws, rawMessage) {
    try {
        // JSON 형식의 메시지 파싱
        const message = JSON.parse(rawMessage);
        console.log(message);

        // 메시지 타입에 따라 분기하여 처리
        switch (message.type) {
            case 'login':           // 사용자 로그인
                handleLogin(ws, message);
                break;
            case 'raspberryLogin':  // 라즈베리파이 로그인
                handleRaspberryLogin(ws, message);
                break;
            case 'raspberry-finish': // iot기기를 통해 복용 완료
                handleRaspberryFinish(ws, message);
                break;
            case 'finish':          // 앱을 통해 복용 완료
                handleFinish(ws, message);
                break;
            case 'finish-no':       // 사용자가 약을 먹지 않음
                handleFinishNo(ws, message);
                break;
            case 'timeToPill':      // 약 복용 시간 메시지 iot로 전달
                handleTimeToPill(ws, message);
                break;
            case 'takePill':        // 약 추출 메시지 전달
                handleTakePill(ws, message);
                break;
            default:
                console.log('알 수 없는 메시지 타입:', message.type);
                break;
        }
    } catch (error) {
        console.error('메시지 파싱 중 오류:', error);
    }
}

//날짜 생성 함수
function getCurrentDate() {
    moment.tz.setDefault("Asia/Seoul");
    return moment().format('YYYY-MM-DD');
}

// 클라이언트 로그인 처리 함수
function handleLogin(ws, message) {
    const clientId = message.clientId;

    // userId를 clientId로 부여
    clients.set(clientId, ws);
    console.log(`클라이언트 로그인, clientId: ${clientId}`);

    // 클라이언트 로그인 메시지 반환
    const responseMessage = {
        type: 'login',
        message: `클라이언트 로그인, clientId: ${clientId}`
    };

    const clientSocket = clients.get(clientId);
    clientSocket.send(JSON.stringify(responseMessage));
}

// 라즈베리파이 로그인 처리 함수
function handleRaspberryLogin(ws, message) {
    const raspberryId = message.raspberryId;

    // raspberryId 부여
    clients.set(raspberryId, ws);
    console.log(`라즈베리파이 로그인, clientId: ${raspberryId}`);

    // 로그인 메시지 반환
    const loginMessage = {
        type: 'login',
        message: `라즈베리파이 로그인, clientId: ${raspberryId}`
    };

    const raspberrySocket = clients.get(raspberryId);
    raspberrySocket.send(JSON.stringify(loginMessage));
}

// 라즈베리파이에서 복용 완료 메시지 처리 함수
function handleRaspberryFinish(ws, message) {
    console.log(`복용자 iot기기 통해서 복용 완료, clientId ${message.raspberryId}, alert_id ${message.drugId}`);

    const date = getCurrentDate();

    // raspberryId를 통해 복용자의 id select
    db.query('SELECT * FROM user LEFT JOIN iot ON user.iot_id = iot.iot_id WHERE iot_code = ?', [message.raspberryId], (err, user) => {
        if (err) {
            console.error('쿼리 오류:', err);
            return;
        }

        // pill_history 테이블에 is_taken 속성을 1로 업데이트
        db.query('UPDATE pill_history SET is_taken = 1 WHERE pill_alert_id = ? and date = ?', [message.drugId, date], (err, result) => {
            if (err) {
                console.error('쿼리 오류:', err);
                return;
            }
            console.log(user[0].user_id);

            db.query('SELECT * FROM pill_alert WHERE pill_alert_id = ?', [message.drugId], (err, result3) => {
                if (err) {
                    console.error('쿼리 오류:', err);
                    return;
                }

                // 복용자에게 메시지 전달
                const takerSocket = clients.get(user[0].user_id);
                const takerMessage = {
                    type: 'finish',
                    message: `기기를 통해 ${result3[0].alert_time} ${result3[0].pill_name}을 복용했습니다!`
                };
                takerSocket.send(JSON.stringify(takerMessage));

                // 복용자의 보호자를 select
                db.query('SELECT protector_id FROM user WHERE user_id = ?', [user[0].user_id], (err, result2) => {
                    if (err) {
                        console.error('쿼리 오류:', err);
                        return;
                    }

                    // 보호자가 있다면 소켓 메시지 전달
                    if (result2.length > 0) {
                        const userId = result2[0].protector_id;
                        const clientSocket = clients.get(userId);

                        if (clientSocket) {
                            const responseMessage = {
                                type: 'finish',
                                message: `복용자가 기기를 통해 ${result3[0].alert_time} ${result3[0].pill_name}을 복용했습니다!`
                            };

                            clientSocket.send(JSON.stringify(responseMessage));
                        } else {
                            // 보호자가 있지만 보호자가 소켓 연결이 되어있지 않을 경우
                            console.log(`소켓에서 userId = ${userId}를 찾을 수 없습니다.`);
                        }
                    } else {
                        // 보호자가 없는 경우
                        console.log(`등록된 보호자가 없습니다. ${user[0].user_id}`);
                    }
                });
            });
        });
    });
}



// 앱을 통한 복용 완료 메시지 처리 함수
function handleFinish(ws, message) {
    console.log(`복용자 약 복용 완료, clientId: ${message.clientId}, alert_id: ${message.drugId}`);

    const date = getCurrentDate()
    // pill_history 테이블에 is_taken 속성을 1로 업데이트
    db.query('UPDATE pill_history SET is_taken = 1 WHERE pill_alert_id = ? and date = ?', [message.drugId, date], (err, result) => {
        if (err) {
            console.error('쿼리 오류:', err);
            return;
        }

        // 복용자의 보호자를 select
        db.query('SELECT protector_id FROM user WHERE user_id = ?', [message.clientId], (err, result2) => {
            if (err) {
                console.error('쿼리 오류:', err);
                return;
            }

            // 보호자가 있다면 소켓 메시지 전달
            if (result2.length > 0) {
                const userId = result2[0].protector_id;
                const clientSocket = clients.get(userId);

                if (clientSocket) {
                    db.query('SELECT * FROM pill_alert WHERE pill_alert_id = ?', [message.drugId], (err, result3) => {
                        if (err) {
                            console.error('쿼리 오류:', err);
                            return;
                        }

                        const responseMessage = {
                            type: 'finish',
                            message: `복용자가 ${result3[0].alert_time} ${result3[0].pill_name}을 복용했습니다!`
                        };

                        clientSocket.send(JSON.stringify(responseMessage));
                    });
                } else {
                    // 보호자가 있지만 보호자가 소켓 연결이 되어있지 않을 경우
                    console.log(`소켓에서 userId = ${userId}를 찾을 수 없습니다.`);
                }
            } else {
                // 보호자가 없는 경우
                console.log(`등록된 보호자가 없습니다. ${message.clientId}`);
            }
        });
    });
}


// 복용하지 않은 상태 메시지 처리 함수
function handleFinishNo(ws, message) {
    console.log(`복용자가 아직 약을 복용하지 않았습니다. clientId ${message.raspberryId}, alert_id ${message.drugId}`);

    // raspberryId를 통해 복용자의 id select
    db.query('SELECT * FROM user LEFT JOIN iot ON user.iot_id = iot.iot_id WHERE iot_code = ?', [message.raspberryId], (err, user) => {
        if (err) {
            console.error('쿼리 오류:', err);
            return;
        }
            // 복용자의 보호자를 select
            db.query('SELECT protector_id FROM user WHERE user_id = ?', [user[0].user_id], (err, result2) => {
                if (err) {
                    console.error('쿼리 오류:', err);
                    return;
                }

                // 보호자가 있다면 소켓 메시지 전달
                if (result2.length > 0) {
                    const userId = result2[0].protector_id;
                    const clientSocket = clients.get(userId);
                    
                    if (clientSocket) {
                        db.query('SELECT * FROM pill_alert WHERE pill_alert_id = ?', [message.drugId], (err, result3) => {
                            if (err) {
                                console.error('쿼리 오류:', err);
                                return;
                            }
                            const responseMessage = {
                                type: 'finish-no',
                                message: `복용자가 ${result3[0].alert_time} ${result3[0].pill_name}을 아직 복용하지 않았습니다.`
                            };

                            clientSocket.send(JSON.stringify(responseMessage));
                        });
                    } else {
                        // 보호자가 있지만 보호자가 소켓 연결이 되어있지 않을 경우
                        console.log(`소켓에서 userId = ${userId}를 찾을 수 없습니다.`);
                    }
                } else {
                    // 보호자가 없는 경우
                    console.log(`등록된 보호자가 없습니다. ${user[0].user_id}`);
                }
            });
        });
}

// 약 복용 시간 메시지 처리 함수
function handleTimeToPill(ws, message) {
    console.log("복용자 약 먹을 시간");

    // 기기에 등록된 약인지 확인
    db.query('SELECT * FROM pill_alert where pill_alert_id = ?', [message.drugId], (err,result)=>{
        if (err) {
            console.error('쿼리 오류:', err);
            return;
        }
        if (result[0].iotYN === 1) {
            // 복용자에게 등록된 raspberrypi_code 찾기
            db.query('SELECT * FROM iot LEFT JOIN user ON iot.iot_id = user.iot_id WHERE user.user_id = ?', [message.clientId], (err, iot) => {
                if (err) {
                    console.error('쿼리 오류:', err);
                    return;
                }
                if (iot.length > 0) {
                    const raspberryId = iot[0].iot_code;
                    const raspberrySocket = clients.get(raspberryId);
                    
                    if (raspberrySocket) {
                        const responseMessage = {
                            type: 'timeToPill',
                            message: `약 먹을 시간`,
                            drugId : message.drugId
                        };
    
                        raspberrySocket.send(JSON.stringify(responseMessage));
                    } else {
                        // 기기가 소켓에 연결되어 있지 않은경우
                        console.log(`소켓에서 resberryId = ${iot[0].iot_code}를 찾을 수 없습니다.`);
                    } 
                }
                else {
                    // 등록된 iot기기가 없을 경우
                    console.log(`등록된 기기가 없습니다. ${message.clientId}`);
                }
                
            })
        }
        else {
            // 기기에 등록된 약이 아닐 경우
            console.log(`기기에 등록된 약이 아닙니다. ${message.clientId}`);
        }
    })
}

// 약 추출 기능
function handleTakePill(ws, message) {
    console.log("복용자 약 추출");

    // 복용자에게 등록된 raspberrypi_code 찾기
    db.query('SELECT * FROM iot LEFT JOIN user ON iot.iot_id = user.iot_id WHERE user.user_id = ?', [message.clientId], (err, iot) => {
        if (err) {
            console.error('쿼리 오류:', err);
            return;
        }
        // 등록된 기기가 있다면 
        if (iot.length > 0){
            const raspberryId = iot[0].iot_code;
            const raspberrySocket = clients.get(raspberryId);

            const raspberryMessage = {
                type: 'takePill',
                message: `약 추출`,
            };
            raspberrySocket.send(JSON.stringify(raspberryMessage));


            // 복용자의 보호자를 select
            db.query('SELECT protector_id FROM user WHERE user_id = ?', [message.clientId], (err, result2) => {
                if (err) {
                    console.error('쿼리 오류:', err);
                    return;
                }

                // 보호자가 있다면 소켓 메시지 전달
                if (result2.length > 0) {
                    const userId = result2[0].protector_id;
                    const clientSocket = clients.get(userId);
                    
                    if (clientSocket) {
                        db.query('SELECT * FROM pill_alert WHERE pill_alert_id = ?', [message.drugId], (err, result3) => {
                            if (err) {
                                console.error('쿼리 오류:', err);
                                return;
                            }
                            const appMessage = {
                                type: 'takePill',
                                message: `복용자가 약을 수동으로 추출하였습니다.`
                            };

                            clientSocket.send(JSON.stringify(appMessage));
                        });
                    } else {
                        // 보호자가 있지만 보호자가 소켓 연결이 되어있지 않을 경우
                        console.log(`소켓에서 userId = ${userId}를 찾을 수 없습니다.`);
                    }
                } else {
                    // 보호자가 없는 경우
                    console.log(`등록된 보호자가 없습니다. ${message.clientId}`);
                }
            });
        }
        else{
            // 등록된 iot기기가 없을 경우
            console.log(`등록된 기기가 없습니다. ${message.clientId}`);
            return
        }
    })
}

function handleWebSocketClose(ws) {
    const clientId = findClientIdByWebSocket(ws);
    if (clientId) {
        clients.delete(clientId);
        console.log(`Client ${clientId} disconnected`);
    }
}

// clientId를 찾는 함수
function findClientIdByWebSocket(webSocket) {
    for (const [clientId, clientSocket] of clients.entries()) {
        if (clientSocket === webSocket) {
            return clientId;
        }
    }
    return null;
}


// 모듈로 내보내기
module.exports = setupWebSocket;
