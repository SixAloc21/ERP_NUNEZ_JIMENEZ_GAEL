const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const { buildResponse } = require('./utils/apiResponse');
const {
  errorHandler,
  notFoundHandler,
} = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json(
    buildResponse(200, 'SxUS000', {
      service: 'user-service',
      message: 'User service running',
    })
  );
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
