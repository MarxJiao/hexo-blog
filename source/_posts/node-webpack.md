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

我们先用Koa写一个简单的web server，之后针对这个server来搭建环境。

### 项目代码

新建`server/app.ts`，这个文件主要用来创建一个koa app。

```typescript
import * as Koa from 'koa';

const app = new Koa();

app.use(ctx => {
    ctx.body = 'Hello World';
});

export default app;
```

我们需要另一个文件来启动server，并且监听`server/app.ts`的改变，来热加载项目。

新建`server/server.ts`

```typescript
import * as http from 'http';
import app from './app';

// app.callback() 会返回一个能够通过http.createServer创建server的函数，类似express和connect。
let currentApp = app.callback();
// 创建server
const server = http.createServer(currentApp);
server.listen(3000);

// 热加载
if (module.hot) {
    // 监听./app.ts
    module.hot.accept('./app.ts', () => {
        // 如果有改动，就使用新的app来处理请求
        server.removeListener('request', currentApp);
        currentApp = app.callback();
        server.on('request', currentApp);
    });
}
```

### 编译配置

在写webpack配置之前，我们先写下ts配置和babel配置。

#### typescript配置
这里写的是webpack编译代码用的配置，后面还会介绍ts-node跑脚本时使用的配置。我们新建`config/tsconfig.json`：
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

一般情况下需要准备2套webpack配置，一套用来开发，一套用来发布。前面已经说过了使用webpack的api来打包为动态创建webpack配置提供了可能。所以这里我们写一个`WebpackConfig`类，创建实例时根据参数，生成不同环境的配置。

##### 开发环境和发布环境的区别

首先两个环境的mode是是不同的，开发环境是`development`，发布环境是`production`。关于mode的更多信息可查看[webpack文档](https://webpack.js.org/concepts/mode/)。

开发环境需要热加载和启动服务，entry里需要配置'webpack/hot/signal'，使用`webpack-node-externals`将'webpack/hot/signal'打包到代码里，添加HotModuleReplacementPlugin，使用`start-server-webpack-plugin`启动服务和开启热加载。

##### webpack配置内容

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
    // 开发环境也使用NoEmitOnErrorsPlugin
    plugins = [new webpack.NoEmitOnErrorsPlugin()];
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

### 编译脚本

使用ts-node来启动脚本时需要使用新`tsconfig.json`，这个编译目标是在node中运行。

在项目根目录新建`tsconfig.json`:

```json
{
    "compilerOptions": {
        // 为了node环境能直接运行
        "module": "commonjs",
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

#### 开发脚本

启动开发脚本，`scripts/start-dev.ts`:

```typescript
import * as webpack from 'webpack';

import WebpackConfig from '../config/Webpack.config';

// 创建编译时配置
const devConfig = new WebpackConfig('development');
// 通过watch来实时编译
webpack(devConfig).watch({
    aggregateTimeout: 300
}, (err: Error) => {
    console.log(err);
});

```

在`package.json`中添加

```json
"scripts": {
    "dev": "rm -rf ./dist && ts-node ./scripts/start-dev.ts"
},
```

执行`yarn dev`，我们能看到项目启动了:
命令行输出：
![命令行输出](./start-output.png)
浏览器展示：
![浏览器展示](./started-view.png)

修改`server/app.ts`

```diff

import * as Koa from 'koa';

const app = new Koa();

app.use(ctx => {
-   ctx.body = 'Hello World';
+   ctx.body = 'Hello Marx';
});

export default app;

```

能看到命令行输出:
![更新代码后命令行输出](./updated-output.png)

刷新浏览器：
![浏览器展示](./updated-view.png)

可以看到热更新已经生效了。

#### 发布打包脚本

新建打包脚本`scripts/build.ts`：

```typescript
import * as webpack from 'webpack';

import WebpackConfig from '../config/Webpack.config';

const buildConfig = new WebpackConfig('production');

webpack(buildConfig).run((err: Error) => {
    console.log(err);
});

```

在`package.json`添加`build`命令：
```diff
"scripts": {
+   "build": "rm -rf ./dist && ts-node ./scripts/build.ts",
    "dev": "rm -rf ./dist && ts-node ./scripts/start-dev.ts"
},
```

执行`yarn build`就能看到`dist/server.js`。这个就是我们项目的产出。其中包含了`node_modules`中的依赖，这样做是否合理，还在探索中，欢迎讨论。

到此整个环境搭建过程就完成了。

完整项目代码[MarxJiao/webpack-node](https://github.com/MarxJiao/webpack-node)
## 总结

这个项目重点在于热加载和All In Typescript。

### 1. 为什么后端代码要热加载？

为了方便使用webpack中间件打包前端代码，这样不用重启后端服务就不用重新编译前端代码，重新编译是很耗时的。后续使用时，流程大概是这样的

> start-dev.ts -> server端的webpack -> server代码 -> webpack中间件 -> 前端代码

这样能保证开发时只需要一个入口来启动，前后端都能热加载。

### 2. 实现热加载的关键点

* webpack配置`mode: 'development'`，为了`NamedModulesPlugin`插件
* webpack配置entry: 'webpack/hot/signal'
* 将'webpack/hot/signal'打包进代码：nodeExternals({whitelist: ['webpack/hot/signal']})
* 使用`HotModuleReplacementPlugin`
* start-server-webpack-plugin配置`signal: true`
* babel配置`"modules": false`
* tsconfig.json配置`"module": "es2015"`
* 使用单独的文件来启动server，监听热加载的文件，`server/server.ts`

### 3. tsconfig

ts-node运行脚本的tsconfig和ts-loader打包代码时的tsconfig不同。

ts-node用的config直接将代码用tsc编译后在node运行，在node 8.x以下的版本中不能使用import，所以module要用`commonjs`。

webpack打包的代码要热加载，需要用es module，这里我们使用`es2015`。

## 参考资料
* [Hot reload all the things!](https://hackernoon.com/hot-reload-all-the-things-ec0fed8ab0)
* [How to HMR on server side?](https://github.com/webpack/docs/issues/45)
* [Node.js Web应用代码热更新的另类思路](http://fex.baidu.com/blog/2015/05/nodejs-hot-swapping/)
* [Don’t use nodemon, there are better ways!](https://codeburst.io/dont-use-nodemon-there-are-better-ways-fc016b50b45e)
* [Webpack 做 Node.js 代码热替换, 第一步](https://segmentfault.com/a/1190000003888845)
