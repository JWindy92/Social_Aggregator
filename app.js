const express = require('express');
const pug = require('pug');
const mysql = require('mysql');
const { body, validationResult } = require('express-validator/check');
const { sanitzeBody } = require('express-validator/filter');
const session = require('client-sessions');
const fs = require('fs');
const Parser = require('rss-parser');
const parser = new Parser();

const User = require('./models/user')

const port = 3000;
// C:\Users\johnw\OneDrive\Documents\Credentials\RSS_Project_creds\mysql_creds.json
db_creds = JSON.parse(fs.readFileSync('C:\\Users\\johnw\\OneDrive\\Documents\\Credentials\\RSS_Project_creds\\mysql_creds.json'));

let con = mysql.createConnection(db_creds)

con.connect((err) => {
    if (err) throw err;
    console.log('Connected to dev_db!')
    con.query("CREATE DATABASE IF NOT EXISTS dev_db", (err, result) => {
        if (err) throw err;
    });
})

const app = express();
app.set('view engine', 'pug')
app.use(express.static(__dirname + "/public"))
app.use(express.urlencoded())
app.use(session({
    cookieName: 'session',
    secret: 'random_string_goes_here',
    duration: 30 * 60 * 1000, // active for 30 min
    activeDuration: 5 * 60 * 1000, // if expiresIn < activeDuration, session extended by activeDuration
}));

// MIDDLEWARE #######################
function protect_route(req, res, next) {
    if (!session.current_user || session.current_user.is_authenticated == false) {
        console.log('not logged in, denied')
        res.redirect('/')
    } else {
        next();
    }
}

// function get_feed(req, res, next) {
//     let feed = await parser.parseURL('http://feeds.feedburner.com/ScottHanselman')
//     console.log(feed)
// }

async function get_feed(req, res, next) {

    let feed = await parser.parseURL('https://www.reddit.com/.rss');
    if(feed){
        // console.log(feed)
        req.feed = feed;
        next();
    } else {
        // handle unforseen error
        console.log("Feed not found")
    }
};


// ROUTES #######################
app.get('/', (req, res) => {
    res.render('index', {title: 'Home', message: 'Hello World!', current_user: session.current_user})
    if (!session.current_user) {
        console.log("No current user")
    } else {
        console.log(session.current_user)
    }
});

app.get('/login', (req, res) => {
    res.render('login', {title: 'Login', message: 'Login Page'})
});

app.post('/login', (req, res) => {
    let sql = `SELECT * FROM Users WHERE email = ?`;
    con.query(sql, [req.body.email], (err, result, fields) => {
        if (err) throw err;
        console.log(result[0])
        u = new User(result[0].username, result[0].email)
        let logged_in = u.load(result[0], req.body.password)
        if (logged_in) {
            console.log('Login successful')
            session.current_user = u;
            res.redirect('/');
        } else {
            console.log("Login failed")
            res.redirect('/login');
        }
    });
})

app.get('/register', (req, res) => {
    res.render('register', {title: 'Sign Up', message: 'Register Page'})
});

app.post('/register', [
    body('email').isEmail(),
    body('password').isLength({ min: 5 }),
    body('password2').custom((value, {req}) => (value === req.body.password))
    ], (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log(errors.array())
            res.render('register', {title: 'Sign Up', message: 'Register Page'})
        } else {
            let u = new User(req.body.email)
            u.setPassword(req.body.password)
            u.save(con)
            res.redirect('/')
        }
})

app.get('/validate', (req, res) => {
    res.render('validate')
});

// PROTECTED ROUTES 
app.get('/feed', get_feed, (req, res) => {
    console.log(req.feed.title)
    res.render('feed', {feed: req.feed})
})


app.get('/test', get_feed, (req, res) => {
    res.render('index')
})


app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));