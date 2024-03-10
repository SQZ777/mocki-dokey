// routes.js
const express = require('express');
const router = express.Router();
const { loadMockResponses, saveMockResponses } = require('../utils/mockResponsesHandler');
const axios = require('axios');

// 定義路由處理邏輯...
// 例如：router.post('/setup', (req, res) => { ... });

router.get('/', (req, res) => {
    res.send('Mock API Server is running!');
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
    }else{
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

router.use(async (req, res, next) => {
    const mockResponseKey = `${req.method} ${req.path}`;
    mockResponses = loadMockResponses();
    if (mockResponses[mockResponseKey]) {
        return res.status(mockResponses[mockResponseKey].status).send(mockResponses[mockResponseKey].body);
    }

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

                // 轉發回應頭部
                res.set(response.headers);
                // 轉發狀態碼
                res.status(response.status);
                // 將回應體轉發回客戶端
                response.data.pipe(res);
            } catch (error) {
                console.error(error);
                res.status(500).send('Error forwarding request');
            }
        } else {
            next();
        }
    }
});


module.exports = router;
