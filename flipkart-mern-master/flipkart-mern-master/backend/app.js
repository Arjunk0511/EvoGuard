const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');

const errorMiddleware = require('./middlewares/error');
const securityMiddleware = require('./middlewares/securityMiddleware');

const app = express();


// config

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({
        path: 'backend/config/config.env'
    });
}


// Body parsing

app.use(express.json());

app.use(cookieParser());

app.use(
    bodyParser.urlencoded({
        extended: true
    })
);

app.use(fileUpload());


// -----------------------------------------
// Honeypot static files
// -----------------------------------------

app.use(
    '/honeypot',
    express.static(
        path.join(__dirname, 'honeypot')
    )
);


// -----------------------------------------
// EvoGuard IDS + Deception
// -----------------------------------------

app.use(securityMiddleware);


// -----------------------------------------
// Routes
// -----------------------------------------

const user = require('./routes/userRoute');

const product = require('./routes/productRoute');

const order = require('./routes/orderRoute');

const payment = require('./routes/paymentRoute');

const honeypot = require('./routes/honeypotRoute');


app.use('/api/v1', user);

app.use('/api/v1', product);

app.use('/api/v1', order);

app.use('/api/v1', payment);

app.use('/api/v1', honeypot);


// -----------------------------------------
// Error middleware
// -----------------------------------------

app.use(errorMiddleware);


module.exports = app;