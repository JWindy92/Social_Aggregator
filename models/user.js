const crypto = require('crypto');

class User {
 
    constructor(email) {
        this.email = email;
        this.username = email.substr(0, email.indexOf('@'))
        this.is_authenticated = false;
    }

    save(conn) {
        let sql = `INSERT INTO Users (username, email, password_hash, salt, is_authenticated) VALUES (?, ?, ?, ?, ?)`
        let values = [
            this.username,
            this.email,
            this.password_hash,
            this.salt,
            this.is_authenticated,
        ]
        conn.query(sql, values, (err, result) => {
            if (err) throw err;
            console.log("# rows affected: " + result.affectedRows)
        })

        conn.release();
    }

    load(db_result, password) {
        if (this.checkPassword(password, db_result.salt, db_result.password_hash)) {
            this.username = db_result.username;
            this.email = db_result.email;
            this.salt = db_result.salt;
            this.password_hash = db_result.password_hash;
            this.is_authenticated = true;
            return true
        } else {
            console.log("Invalid username or password!")
            return false
        }
    }

    setPassword(password) {
        this.salt = crypto.randomBytes(16).toString('hex');
        this.password_hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, `sha512`).toString(`hex`);
    }

    checkPassword(password, salt, password_hash) {
        let hash = crypto.pbkdf2Sync(password, salt, 1000, 64, `sha512`).toString(`hex`);
        return password_hash === hash;
    }
}

module.exports = User