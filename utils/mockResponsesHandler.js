// mockResponsesHandler.js
const fs = require('fs');
const mockResponsesFilePath = './mockResponses.json';

function loadMockResponses() {
  if (fs.existsSync(mockResponsesFilePath)) {
    const data = fs.readFileSync(mockResponsesFilePath, 'utf8');
    return JSON.parse(data);
  }
  return {};
}

function saveMockResponses(mockResponses) {
  fs.writeFileSync(mockResponsesFilePath, JSON.stringify(mockResponses, null, 2), 'utf8');
}

module.exports = { loadMockResponses, saveMockResponses };
