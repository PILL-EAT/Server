// schedulerSetup.js
const schedule = require('node-schedule');
const db = require('./db');
var moment = require('moment');
require('moment-timezone');

function setupScheduler() {
    const Schedule = schedule.scheduleJob('0 0 * * *', () => {
        moment.tz.setDefault("Asia/Seoul");

        var date = moment().format('YYYY-MM-DD');
        var dayOfWeek = moment().isoWeekday(); // 월요일은 1, 일요일은 7

        console.log(date)
        console.log(dayOfWeek)

        db.query(`INSERT INTO pill_history (date, pill_alert_id, taker_id, pill_name, pill_kind, alert_time, alert_day, iotYN, is_taken)
                SELECT '${date}' as date, pill_alert_id, taker_id, pill_name, pill_kind, alert_time, alert_day, iotYN, false as is_taken
                FROM pill_alert
                WHERE SUBSTRING(alert_day, '${dayOfWeek}', 1) = '1';`,
            (err, result) => {
                if (err) {
                    throw (err);
                }
                console.log("pill_history UPDATE")
                db.query('select * from pill_history', (err, result) => {
                    console.log(result)
                })
            })
    });
}

module.exports = setupScheduler;
