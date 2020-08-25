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

function follow_feed(user_id, feed_id) {
    let sql = 'INSERT INTO user_feeds (user_id, feed_id) VALUES (?, ?)'
    console.log(`Inserting (${user_id}, ${feed_id}) into user_feeds`)
    pool.getConnection((err, conn) => {
        if (err) throw err;
        conn.query(sql, [user_id, feed_id], (err, result) => {
            if (err) throw err;
            console.log("# rows affected: " + result.affectedRows)
        })
        conn.release();
    })
    
}

module.exports = {"pool" : pool, "follow_feed" : follow_feed}