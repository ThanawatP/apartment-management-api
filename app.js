const express = require('express');
const app = express();
const router = express.Router();
const userRouter = require('./routes/user');
const usersRouter = require('./routes/users');
const roomRouter = require('./routes/room');
const roomsRouter = require('./routes/rooms');
const rentalRouter = require('./routes/rental');
const rateRouter = require('./routes/rate');
const reportRouter = require('./routes/report');
const billPeriodRouter = require('./routes/bill_period');
const db = require('./db');
const mongoose = db.connect();
const cors = require('cors');

const UPLOAD_PATH = require('variables').UPLOAD_PATH;
const cleanFolder = require('utils').cleanFolder;
cleanFolder(UPLOAD_PATH);

const corsOptions = {
  origin: 'http://localhost',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204 
};

app.use(cors(corsOptions));

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
  extended: true
}));

app.use('/user', userRouter);
app.use('/users', usersRouter);
app.use('/room', roomRouter);
app.use('/rooms', roomsRouter);
app.use('/rental', rentalRouter);
app.use('/rate', rateRouter);
app.use('/report', reportRouter);
app.use('/bill_period', billPeriodRouter);

const port = 3001;
app.listen(port, () => console.log('Example app listening on port ' + port));