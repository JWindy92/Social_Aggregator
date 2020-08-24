const mysql = require('mysql');
const fs = require('fs');

db_creds = JSON.parse(fs.readFileSync('C:\\Users\\johnw\\OneDrive\\Documents\\Credentials\\RSS_Project_creds\\mysql_creds.json'));

let con = mysql.createConnection(db_creds)

con.connect((err) => {
    if (err) throw err;
    console.log('Connected to dev_db!')
    con.query("CREATE DATABASE IF NOT EXISTS dev_db", (err, result) => {
        if (err) throw err;
    });
})

//* https://stackoverflow.com/questions/31775177/nodejs-and-mysql-wait-for-query-result
function executeQuery(sql, callback) {
    if (con) {
        con.query(sql, (err, result, fields) => {
            if (err) {
                return callback(err, null);
            }
            return callback(null, result);
        })
    } else {
        return callback(true, "No Connection")
    }
}

function check_for_feed(req, res, next) {
    let sql = 'SELECT feed_id FROM feeds WHERE url = ' + mysql.escape(req.body.rss_url)
    let user = req.session.current_user;
    con.query(sql, (err, result) => {
        if (err) throw err;
        if (result.length < 1) {
            console.log('not found')
            //TODO: validate url, add to db, then subscribe
        } else {
            console.log('FOUND')
            console.log(user)
            subscribe(result[0].feed_id, user);
        }
    })
    next();
}

function check_for_user(user_id, callback) {
    let sql = 'SELECT * FROM users WHERE user_id = ' + mysql.escape(user_id)
    con.query(sql, (err, result) => {
        if (err) throw err;
        if (!(result.length < 1)) {
            return callback(true)
        } else {
            return callback(false)
        }
    })
    
}

function test_callback(test_var) {
    return true;
}
// function subscribe(feed_id, user_id) {
    
//         sql = 'INSERT INTO user_feeds (user_id, feed_id) VALUES (?, ?)'
//         let values = [
//             user.id,
//             feed_id
//         ]
//         con.quert(sql, values, (err, result) => {
//             if (err) throw err;
//             console.log("# rows affected: " + result.affectedRows)
//         })
//     }


module.exports = {"con" : con, "check_for_user" : check_for_user}