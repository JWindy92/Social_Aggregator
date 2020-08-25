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

function follow_feed(user_id, feed_id) {
    let sql = 'INSERT INTO user_feeds (user_id, feed_id) VALUES (?, ?)'
    console.log(`Inserting (${user_id}, ${feed_id}) into user_feeds`)
    db.con.query(sql, [user_id, feed_id], (err, result) => {
        if (err) throw err;
        console.log("# rows affected: " + result.affectedRows)
    })
}


module.exports = {"con" : con, "follow_feed" : follow_feed}