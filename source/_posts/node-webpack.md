---
title: 使用webpack搭建基于typescript的node开发环境
date: 2018-04-10 10:51:21
tags: [webpack, node, typescript]
---

正在学习node.js，这里介绍使用webpack来搭建基于typescript的node开发环境。

<!-- more -->

## 整个环境的必备功能

一套好的开发环境能让开发者专注于代码，而不必关系其它事情。这里先列出一些必要的条件。

1. 一个命令就能启动项目。
2. 一个命令能打包项目。
3. 开发时代码改动能够自动更新，最好是热更新，而不是重启服务，这里为后面和前端代码一起调试做准备。
4. 开发中能使用编辑器或者chrome调试，我本人习惯使用vscode。

## 基本搭建思路

全局使用ts，包括脚本，webpack配置文件。使用npm调用ts脚本，脚本使用ts-node执行，使用ts脚本调用webpack的api来打包编译文件。

> npm scipts -> start-dev.ts -> webpack(webpackConfig)

这里解释下为什么使用ts脚本来调用webpack而不是直接将webpack命令写在npm scripts里。我的想法是`All In Typescrpt`，尽量做到能用ts的就不用js，使用webpack的node api能轻松实现用ts写webpack配置。这样把做还有一个好处就是可以把webpack的配置写成动态的，根据传入参数来生成需要的配置。

## 选型

到这里项目的选型已经很明了了。

* `Typescript` 项目使用的主语言，为前端开发添加强类型支持，能在编码过程中避免很多问题。
* `Koa` 应用比较广泛。没有附加多余的功能，中间件即插即用。
* `Webpack` 打包工具，开发中热加载。
* `ts-node` 用来直接执行ts脚本。
* `start-server-webpack-plugin` 很关键的webpack插件，能够在编译后直接启动服务，并且支持signal模式的热加载，配合`webpack/hot/signal`很好用。

## 环境搭建

一般情况下需要准备2套webpack配置，一套用来开发，一套用来发布。前面已经说过了使用webpack的api来打包为动态创建webpack配置提供了可能。所以这里我们写一个`WebpackConfig`类，创建实例时根据参数，生成不同环境的配置。

### 开发环境和发布环境的区别

首先两个环境的mode是是不同的，开发环境是`development`，发布环境是`production`。关于mode的更多信息可查看[webpack文档](https://webpack.js.org/concepts/mode/)。

开发环境需要热加载和启动服务，entry里需要配置'webpack/hot/signal'，使用`webpack-node-externals`将'webpack/hot/signal'打包到代码里，添加HotModuleReplacementPlugin，使用`start-server-webpack-plugin`启动服务和开启热加载。

### 配置具体

在写webpack配置之前，我们先写下ts配置和babel配置。

#### typescript配置
这里写的是webpack编译代码用的配置，后面还会介绍ts-node跑脚本时使用的配置。我们新建`config/tsconfig.json`
```json
{
    "compilerOptions": {
        // module配置很重要，千万不能配置成commonjs，热加载会失效
        "module": "es2015",
        "noImplicitAny": true,
        "sourceMap": true,
        "moduleResolution": "node",
        "isolatedModules": true,
        "target": "es5",
        "strictNullChecks": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "inlineSources": false,
        "lib": ["es2015"]
    },
    "exclude": [
        "node_modules",
        "**/*.spec.ts"
    ]
}
```

#### babel配置

.babelrc，`"modules": false`很重要，`tree shaking`、`HMR`都靠它。
```json
{
  "presets": [["env", {"modules": false}]]
}
```

#### webpack配置

现在我们来写下webpack配置。重点写在注释中了。

新建文件`config/Webpack.config.ts`。

```typescript
import * as path from 'path';
import * as StartServerPlugin from "start-server-webpack-plugin";
import * as webpack from 'webpack';
import * as nodeExternals from 'webpack-node-externals';
import {Configuration, ExternalsElement} from 'webpack';

class WebpackConfig implements Configuration {
    // node环境
    target: Configuration['target'] = "node";
    // 默认为发布环境
    mode: Configuration['mode'] = 'production';
    // 入口文件
    entry = [path.resolve(__dirname, '../server/server.ts')];
    output = {
        path: path.resolve(__dirname, '../dist'),
        filename: "server.js"
    };
    // 这里为开发环境留空
    externals: ExternalsElement[] = [];
    // loader们
    module = {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    // tsc编译后，再用babel处理
                    {loader: 'babel-loader',},
                    {
                        loader: 'ts-loader',
                        options: {
                            // 加快编译速度
                            transpileOnly: true,
                            // 指定特定的ts编译配置，为了区分脚本的ts配置
                            configFile: path.resolve(__dirname, './tsconfig.json')
                        }
                    }
                ],
                exclude: /node_modules/
            },
            {
                test: /\.jsx?$/,
                use: 'babel-loader',
                exclude: /node_modules/
            }
        ]
    };
    resolve = {
        extensions: [".ts", ".js", ".json"],
    };
    // 留空，为开发环境添加配置准备
    plugins = [];
    constructor(mode: Configuration['mode']) {
        // 配置mode，production情况下用上边的默认配置就ok了。
        this.mode = mode;
        if (mode === 'development') {
            // 添加webpack/hot/signal,用来热更新
            this.entry.push('webpack/hot/signal');
            this.externals.push(
                // 添加webpack/hot/signal,用来热更新
                nodeExternals({
                    whitelist: ['webpack/hot/signal']
                })
            );
            const devPlugins = [
                // 用来热更新
                new webpack.HotModuleReplacementPlugin(),
                // 启动服务
                new StartServerPlugin({
                    // 启动的文件
                    name: 'server.js',
                    // 开启signal模式的热加载
                    signal: true,
                    // 为调试留接口
                    nodeArgs: ['--inspect']
                }),
            ]
            this.plugins.push(...devPlugins);
        }
    }
}

export default WebpackConfig;
```




### 公共配置

不管是开发环境和发布环境，都需要的配置，各种loader，target，resolve。具体的配置的说明写在注释中了。

webpack.server.base.conf.js

```javascript
// webpack.server.base.conf.js

const webpack = require('webpack');

module.exports = {
    
}

```

## typescript配置tsconfig.json

```json
{
    "compilerOptions": {
        "module": "commonjs",
        "noImplicitAny": true,
        "removeComments": true,
        "preserveConstEnums": true,
        "sourceMap": true,
        "moduleResolution": "node",
        "target": "esnext",
        "strictNullChecks": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "inlineSources": true,
    },
    "exclude": [
        "node_modules",
        "**/*.spec.ts"
    ]
}
```
## 开发脚本 start-dev.ts

使用ts-node执行 start-dev.ts来启动开发环境。start-dev.ts主要功能为，调用webpack的node api来执行编译。先用webpack(webpack-config)来生成一个compiler，使用compiler.watch(option, callback)来启动编译器，并监听文件变动。

## 发布打包脚本 build.ts
