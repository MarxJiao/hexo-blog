---
title: 开发webpack mock server插件
date: 2017-06-02 17:19:22
tags: [webpack, mock, webpack plugin]
---
对于前后端开发的项目，大部分的情况是先约定好接口格式，前端使用本地mock数据进行开发，开发后使用后端接口联调。webpack-dev-server提供了proxy配置，我们可以在开发中将接口代理到本地服务。mock数据使用json文件能最方便的进行开发，然而在webpack-dev-server 1.6以后的版本并不支持将接口代理到json文件。webpack-dev-server的proxy使用的是http-proxy-middleware，这个[issue](https://github.com/chimurai/http-proxy-middleware/issues/63)说明了原因。

所以在开发过程中我们需要搭建服务器，来将接口指向json文件。我开发了一个webpack插件，是起一个express服务来serve这些接口，并根据配置指向相应的json文件。

本文介绍插件开发细节，算是开发文档。如果只是想使用插件的话可以查看[readme](https://github.com/MarxJiao/mock-webpack-plugin/blob/master/readme-zh.md)。

<!-- more -->

# 选型
webpack dev server使用的express启动本地服务器，所以这里的mock server也选用express开发。

# 设计思路
- webpack初始化插件时，将需要的配置信息传递给插件
- 插件启动express
- 使用express中间件处理请求，如果请求的接口匹配配置信息，就读取对应的json文件，将内容返回

# 开发
先写一个用来启动express服务的函数。调用函数时启动一个express server。

```javascript
var express = require('express');
// 这里是处理请求的中间件
var returnData = require('./returnData.js');

module.exports = function({config, port = 3000}) {
    // 判断配置信息存在
    if (config) {
        const mockPort = port || 3000;
        // 新建express应用
        var app = express();

        // 使用中间件将配置信息放在请求对象里，方便后边的中间件使用
        app.use((req, res, next) => {
            req.config = config;
            next();           
        })

        // 用中间件处理所有请求
        app.use(returnData);

        // 启动server
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

处理请求的中间件returnData.js。从请求中读取配置信息，如果请求的接口在配置中，则读取对应的文件，如果不在，返回提示信息。这里使用promise封装了fs.readFile方便使用async/await调用。

```javascript
const fs = require('fs');

module.exports = async function(req, res, next) {
    const config = req.config;
    // 判断请求的接口在配置中
    if (config[req.path]) {
        // 读取对应的json文件
        const data = await fsRead(config[req.path].path);
        // 返回json文件
        res.send(JSON.parse(data));
    }else {
        // 如果接口没在配置中，返回错误信息
        res.send({errno: -1, msg: 'No such proxy: ' + req.path});
    }
    next();
}


// 使用promise封装fs.readFile，方便使用async/await
function fsRead(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err, data) => {
            if (err) {
                if (err.syscall === 'open') {
                    console.log('Open "' + err.path +'" fail!')
                }
                reject(err);
            }
            resolve(data.toString())
        })
    })
}
```

server相关的代码就写好了，下面只需要写一个webpack插件，再插件调用时启动express就好了。
```javascript
const server = require('./server.js');

function MockWebpackPlugin({config, port = 3000}) {

    // 将config和port放在属性里，方便apply方法调用
    this.config = config;
    this.port = port;
}

MockWebpackPlugin.prototype.apply = function (compiler) {
    // 调用启动express的函数
    server({config: this.config, port: this.port});

    // 注册一个webpack插件
    compiler.plugin("emit", (compilation, callback) => {
        callback();
    });
}

```

到这里插件就开发完了。如何使用请看[这里](https://github.com/MarxJiao/mock-webpack-plugin/blob/master/readme-zh.md)

项目源码：[https://github.com/MarxJiao/mock-webpack-plugin](https://github.com/MarxJiao/mock-webpack-plugin)