require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const morgan = require('morgan');

const mongoose = require('./db/mongoose');

const userController = require('./controllers/userController');
const taskController = require('./controllers/taskController');

const errorMiddleware = require('./middlewares/errorMiddleware');


process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(xss());
app.use(mongoSanitize());
app.use(hpp({ whitelist: [] }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use('/api/v1/users', userController);
app.use('/api/v1/tasks', taskController);

app.use([errorMiddleware.defaultError, errorMiddleware.processError]);

app.listen(process.env.PORT);