const axios = require('axios');
const { loadMockResponses } = require('./mockResponsesHandler'); // 確保正確引入相關依賴

async function handleMockResponse(req, res, next) {
    const mockResponses = loadMockResponses();
    const mockResponseKey = `${req.method} ${req.path}`;

    if (mockResponses[mockResponseKey]) {
        return res.status(mockResponses[mockResponseKey].status).send(mockResponses[mockResponseKey].body);
    }

    next();
}

async function handleRequestForward(req, res, next) {
    const mockResponses = loadMockResponses();
    const forwardPrefix = Object.keys(mockResponses).find(key =>
      key.startsWith('FORWARD ') && req.path.startsWith(key.replace('FORWARD ', ''))
    );
  
    if (forwardPrefix) {
      const config = mockResponses[forwardPrefix];
      if (config && config.forwardTo) {
        try {
          const baseForwardPath = forwardPrefix.replace('FORWARD ', '');
          const pathSuffix = req.path.substring(baseForwardPath.length);
          const targetUrl = new URL(pathSuffix || '/', config.forwardTo).href;
  
          const response = await axios({
            method: req.method,
            url: targetUrl,
            data: req.body,
            headers: { ...req.headers, host: new URL(config.forwardTo).host },
            responseType: 'stream'
          });
  
          res.set(response.headers);
          res.status(response.status);
          response.data.pipe(res);
        } catch (error) {
          console.error(error);
          res.status(500).send('Error forwarding request');
        }
      } else {
        next();
      }
    } else {
      next();
    }
}

module.exports = { handleRequestForward, handleMockResponse };
