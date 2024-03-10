// routes.js
const express = require('express');
const router = express.Router();
const { loadMockResponses, saveMockResponses } = require('../utils/mockResponsesHandler');

const { handleRequestForward, handleMockResponse } = require('../utils/requestHandler');
const axios = require('axios');

// 定義路由處理邏輯...
// 例如：router.post('/setup', (req, res) => { ... });

router.get('/', (req, res) => {
    res.send('Mock API Server is running!');
});

router.get('/rules', (req, res) => {
    res.send(loadMockResponses());
});

let mockResponses = loadMockResponses();

router.post('/setup', (req, res) => {
    const { path, method, response } = req.body;
    const key = `${method.toUpperCase()} ${path}`;
    mockResponses[key] = response;
    saveMockResponses(mockResponses); // 保存更改
    res.status(200).send({ message: 'Mock response setup successfully.' });
});

router.post('/set-forward', (req, res) => {
    const { path, forwardTo } = req.body;
    const key = `FORWARD ${path}`;
    mockResponses[key] = { forwardTo };
    saveMockResponses(mockResponses); // 保存更改
    res.status(200).send({ message: 'Proxy setup successfully.' });
});

router.get('/download-mock-responses', (req, res) => {
    const file = './mockResponses.json'; // 確保這個路徑指向你的mockResponses檔案
    res.download(file); // 提供檔案下載
});

router.delete('/delete-rule', (req, res) => {
    const { path, method } = req.body; // 假設用戶將要刪除的規則的方法和路徑作為請求體的一部分發送
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
