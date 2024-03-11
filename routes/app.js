// routes.js
const express = require('express');
const router = express.Router();
const { loadMockResponses, saveMockResponses } = require('../utils/mockResponsesHandler');

const { handleRequestForward, handleMockResponse } = require('../utils/requestHandler');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
    res.send('Mock API Server is running!');
});

router.get('/rules', (req, res) => {
    res.send(loadMockResponses());
});

let mockResponses = loadMockResponses();

router.post('/setup', (req, res) => {
    let { path, method, response } = req.body;
    const key = `${method.toUpperCase()} ${path}`;
    response.ruleId = uuidv4();
    
    mockResponses[key] = {response};
    saveMockResponses(mockResponses);
    res.status(200).send({ message: 'Mock response setup successfully.' });
});

router.post('/set-forward', (req, res) => {
    const { path, forwardTo } = req.body;
    const key = `FORWARD ${path}`;
    mockResponses[key] = { forwardTo };
    saveMockResponses(mockResponses);
    res.status(200).send({ message: 'Proxy setup successfully.' });
});

router.get('/download-mock-responses', (req, res) => {
    const file = './mockResponses.json';
    res.download(file);
});

router.delete('/delete-rule', (req, res) => {
    const { path, method } = req.body;
    let keyToDelete;
    if (method) {
        keyToDelete = `${method.toUpperCase()} ${path}`;
    } else {
        keyToDelete = `FORWARD ${path}`;
    }
    if (mockResponses[keyToDelete]) {
        delete mockResponses[keyToDelete];
        res.send({ message: `${keyToDelete} rule deleted successfully.` });
    } else {
        res.status(404).send({ message: `${keyToDelete} Rule not found.` });
    }
    saveMockResponses(mockResponses);
});

router.use((req, res, next) => {
    handleMockResponse(req, res, next);
});

router.use((req, res, next) => {
    handleRequestForward(req, res, next);
});

module.exports = router;
