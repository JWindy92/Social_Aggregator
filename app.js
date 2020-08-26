const express = require('express');
const pug = require('pug');
const mysql = require('mysql');
const { body, validationResult } = require('express-validator/check');
const { sanitzeBody } = require('express-validator/filter');
const session = require('client-sessions');
const urlExists = require('url-exists');

const port = 3000;

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

const User = require('./models/user')
const feed = require('./public/scripts/feed')
const db = require('./public/scripts/db')

// MIDDLEWARE #######################
function protect_route(req, res, next) {
    if (!session.current_user || session.current_user.is_authenticated == false) {
        console.log('not logged in, denied')
        session.redirectTo = req.originalUrl
        res.redirect('/login')
    } else {
        next();
    }
}

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
    db.pool.getConnection((err, conn) => {
        conn.query(sql, [req.body.email], (err, result, fields) => {
            if (err) throw err;
            console.log(result[0])
            u = new User(result[0].username, result[0].email)
            let logged_in = u.load(result[0], req.body.password)
            if (logged_in) {
                console.log('Login successful')
                session.current_user = u;
                session.user_id = result[0].user_id
                if (session.redirectTo) {
                    res.redirect(session.redirectTo)
                    session.redirectTo = null
                } else {
                    res.redirect('/');
                }
            } else {
                console.log("Login failed")
                res.redirect('/login');
            }
        });
        conn.release();
    })
    
})

app.get('/logout', (req, res) => {
    session.current_user = null;
    res.redirect('/')
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
            db.pool.getConnection((err, conn) => {
                if (err) throw err;
                u.save(conn)
                
            })
            res.redirect('/')
        }
})

app.post('/follow_feed', (req, res) => {
    Promise.all(feed.check_for_feed(req.body.rss_url)).then(exists => {
        if (exists.some(feed.check_true)) {
            //* Check if feed exists in feed Table
            let sql = 'SELECT feed_id FROM feeds WHERE url = ' + mysql.escape(req.body.rss_url)
            db.pool.getConnection((err, conn) => {
                conn.query(sql, (err, result) => {
                    if (err) throw err;
                    //* If not
                    if (result.length < 1) {
                        //* Add feed to feeds
                        db.save_new_feed(req.body.rss_url).then((ret => {
                            db.follow_feed(session.user_id, ret.insertId).then((ret => {
                                console.log(ret)
                            }))
                        }))
                        res.redirect('/browse') //TODO: Decide whether to keep this here or move inside .then
                    //* If so
                    } else {
                        db.check_if_following(session.user_id, result[0].feed_id).then((ret => {
                            if (ret == true) {
                                console.log('Already following!')
                            } else {
                                db.follow_feed(session.user_id, result[0].feed_id).then((ret => {
                                    console.log('Followed Successfully')
                                }))
                            }
                        }))
                        res.redirect('/browse')
                    }
                })
                conn.release();
            }) 
        } else {
            console.log('invalid url')
            res.redirect('/browse')
        }
    }).catch(err => {
        throw err;
    })
//? res.redirect('/browse') redirecting here should be instant
//? but do I want that? might want to wait for promise to reload page
});


app.get('/validate', (req, res) => {
    res.render('validate')
});

// PROTECTED ROUTES 
app.get('/feed', [protect_route, feed.get_feed], (req, res) => {
    console.log(req.feed)
    res.render('feed', {feed: req.feed})
})

app.get('/test', feed.get_feed, (req, res) => {
    res.render('index')
})

app.get('/browse', protect_route, (req, res) => {
    res.render('browse');
})


app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));