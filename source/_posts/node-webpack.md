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

全局使用ts，包括脚本，配置文件。脚本执行使用ts-node，配置文件都使用脚本来调用。

通过ts脚本调用webpack来执行启动开发环境，编译等操作。

准备2套webpack配置，一套用来开发，一套用来发布。

- 开发环境需要webpack打包源码，自动启动node，热更新代码。开发环境启动时build代码后启动node服务，node服务使用webpack中间件来加载前端代码，前端代码通过前端的webpack配置热更新，后端代码通过后端webpack热更新。本文主要实现后端代码热更新，前端代码的打包暂时不做详细介绍。
- 发布环境需要webpack将分别将前后端代码打包。

## webpack配置

### 公共配置

不管是开发环境和发布环境，都需要的配置，各种loader，target，resolve。具体的配置的说明写在注释中了。

webpack.server.base.conf.js

```javascript
// webpack.server.base.conf.js

const webpack = require('webpack');

module.exports = {
    
}

```

### server webpack配置

webpack.server.dev.conf.js，主要功能：设置mode为`development`，设置hmr配置，配置StartServerPlugin来自动启动编译结果。

```javascript
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
