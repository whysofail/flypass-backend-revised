const bodyParser = require('body-parser');
const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const cors = require('cors');

require('dotenv').config();

const routes = require('./routes/router');

const { PORT = 3000 } = process.env;
const app = express();

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
  }),
);

app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(routes);

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});
