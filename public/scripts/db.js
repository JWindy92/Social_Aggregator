const mysql = require('mysql');
const fs = require('fs');

db_creds = JSON.parse(fs.readFileSync('C:\\Users\\johnw\\OneDrive\\Documents\\Credentials\\RSS_Project_creds\\mysql_creds.json'));

let pool = mysql.createPool(db_creds)

pool.getConnection((err, conn) => {
    if (err) throw err;
    console.log('Connected to dev_db!')
    conn.query("CREATE DATABASE IF NOT EXISTS dev_db", (err, result) => {
        if (err) throw err;
    });
    conn.release();
})

function save_new_feed(url) {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, conn) => {
            if (err) return reject(err)
            sql = 'INSERT INTO feeds (url) VALUES (' + mysql.escape(url) + ')'
            console.log("New feed, saving to feeds table")
            conn.query(sql, (err, result) => {
                if (err) return reject(err)
                conn.release()
                console.log("# rows affected: " + result.affectedRows)
                return (resolve(result))
            })
        })
    })
}

function check_if_following(user_id, feed_id) {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, conn) => {
            if (err) return reject(err)
            sql = "SELECT * FROM user_feeds WHERE user_id = " + mysql.escape(user_id) + " AND feed_id = " + mysql.escape(feed_id)
            conn.query(sql, (err, result) => {
                if (err) return reject(err)
                if (result.length > 0) {
                    conn.release()
                    console.log("User already following: true")
                    return (resolve(true)) // if true, don't bother following
                } else {
                    console.log("User not following: false")
                    return (resolve(false)) // if false, follow
                }
            })
        })
    })
}

function follow_feed(user_id, feed_id) {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, conn) => {
            if (err) return reject(err)
            let sql = 'INSERT INTO user_feeds (user_id, feed_id) VALUES (?, ?)'
            conn.query(sql, [user_id, feed_id], (err, result) => {
                if (err) return reject(err)
                conn.release()
                return (resolve(result))
            })
        })
    })
}

module.exports = {
    "pool" : pool,
    "follow_feed" : follow_feed,
    "save_new_feed" : save_new_feed,
    "check_if_following" : check_if_following
}