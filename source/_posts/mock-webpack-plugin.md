---
title: mock-webpack-plugin
date: 2017-06-02 17:19:22
tags: [webpack, mock, webpack plugin]
---
对于前后端开发的项目，大部分的情况是先约定好接口格式，前端使用本地mock数据进行开发，开发后使用后端接口联调。webpack-dev-server提供了proxy配置，我们可以在开发中将接口代理到本地服务。mock数据使用json文件能最方便的进行开发，然而在webpack-dev-server 1.6以后的版本并不支持将接口代理到json文件。webpack-dev-server的proxy使用的是http-proxy-middleware，这个[issue](https://github.com/chimurai/http-proxy-middleware/issues/63)说明了原因。

所以在开发过程中我们需要搭建服务器，来将接口指向json文件。我开发了一个webpack插件，是起一个express服务来serve这些接口，并根据配置指向相应的json文件。

本文介绍插件开发细节，算是开发文档。如果只是想使用插件的话可以查看[readme](https://github.com/MarxJiao/mock-webpack-plugin/blob/master/readme-zh.md)。

<!-- more -->

# 选型
webpack dev server使用的express启动本地服务器，所以mock server我也选用express开发。

# 设计思路
- webpack初始化插件时，将需要的配置信息传递给插件
- 插件启动express
- 使用express中间件处理请求，如果请求的接口匹配配置信息，就读取对应的json文件，将内容返回

# 开发
先写一个用来启动express服务的函数。

```javascript
var express = require('express');
var returnData = require('./returnData.js');

module.exports = function({config, port = 3000}) {
    if (config) {
        const mockPort = port || 3000;
        var app = express();
        app.use((req, res, next) => {
            req.config = config;
            next();           
        })
        app.use(returnData);

        var server = app.listen(mockPort, function () {
            var host = server.address().address;
            var port = server.address().port;
            console.log('Mock server listening at http://%s:%s', host, port);
        });
    }
    else {
        console.log('No Config File!')
    }
}
```
