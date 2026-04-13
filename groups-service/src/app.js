const express = require('express');
const cors = require('cors');

const groupRoutes = require('./routes/group.routes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const { buildResponse } = require('./utils/apiResponse');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json(
    buildResponse(200, 'SxGR000', {
      service: 'groups-service',
      message: 'Groups service running',
    })
  );
});

app.get('/health', (req, res) => {
  res.status(200).json(
    buildResponse(200, 'SxGR001', {
      status: 'ok',
    })
  );
});

app.use('/api/groups', groupRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
