const express = require('express');
const app = express();
const port = 3000;
const routes = require('./routes/app'); // 假設所有路由處理都在routes.js中

app.use(express.json()); // 用於解析JSON格式的請求體
app.use('/', routes); // 使用定義好的路由


app.listen(port, () => {
  console.log(`Mock API Server listening at http://localhost:${port}`);
});
