---
title: 使用angular + material 2 + flex-layout 开发项目
date: 2017-02-26 00:00:02
tags: [angular, material, flex-layout]
---

最近在学习angular（这里指的是2.0以上的版本，官方说法angular 1.x叫做angularjs， 2.0以上的版本叫angular），试用了下[material 2](https://material.angular.io)感觉官方文档中有些细节缺失。本文的旨在于记录搭建环境的过程和介绍一些官方未提到的细节。

<!-- more -->

> TL;DR: 使用angular-cli搭建开发环境，并配置scss处理样式。material官方教程中的图标字体使用的是google的字体服务器，国内访问不是很稳定，这里使用npm本地安装material-design-icons字体来解决该问题。使用flex-layout来做响应式布局，这个布局库要比material中的grid强大的多。 

下面我们开始进行。
# 1. 工具安装
这里我们选择angular-cli作为构建工具，angular-cli提供了环境搭建、代码生成、打包等一些列功能。[angular-cli文档](https://github.com/angular/angular-cli)。安装：

```shell
npm install -g @angular/cli
```
# 2. 新建项目
使用`ng new`命令新建项目，这里我新建一个叫angular-material-flex的项目

```
ng new angular-material-flex
```
# 3. 安装依赖
我们使用material 2作为样式库，flex-layout作为布局工具，所以需要安装这两个库和它们的依赖。material 2依赖hammerjs所以我们安装@angular/material、hammerjs和@angular/flex-layout

```shell
npm install --save @angular/material hammerjs @angular/flex-layout
```
# 4. 将material和flex-layout添加到项目中
修改src/app/app.mudole.ts
```typescript
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

// 引入material和hammer
import { MaterialModule } from '@angular/material';
import 'hammerjs';

// 引入flex-layout
import { FlexLayoutModule } from "@angular/flex-layout";

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    MaterialModule.forRoot(), // 为子组件引入Material
    FlexLayoutModule, // 为子组件引入FlexLayout
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

```

至此flex-layout已经可以使用了，但material的icon字体还不能用。官方介绍上是需要在src/index.html中加上

```html
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
```

显然国内的网络环境，使用google的字体服务器还是不那么稳定的。于是乎找到了字体源是[material-design-icons](https://github.com/google/material-design-icons)。下面是使用方法：
1. 安装 material-design-icons

```
npm install --save material-design-icons
```

2. 修改src/style.css

```css
@import '~@angular/material/core/theming/prebuilt/deeppurple-amber.css';

/* fallback */
@font-face {
  font-family: 'Material Icons';
  font-style: normal;
  font-weight: 400;
  src: url(../node_modules/material-design-icons/iconfont/MaterialIcons-Regular.woff2) format('woff2');
}

.material-icons {
  font-family: 'Material Icons';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-feature-settings: 'liga';
  -webkit-font-smoothing: antialiased;
}

```
# 其它
我习惯使用scss预处理css，所以修改.angular-cli.json，预处理为`scss`
```json
"defaults": {
    "styleExt": "scss",
    "component": {}
 }
```

至此整个环境搭建就完成了，可以按照[angular-cli文档](https://github.com/angular/angular-cli)、[material文档](https://material.angular.io/components)，[flex-layout文档](https://github.com/angular/flex-layout)进行开发了。

- 页面示例：[http://marxjiao.com/angular-material-flex/](http://marxjiao.com/angular-material-flex/)

- 代码地址：[https://github.com/MarxJiao/angular-material-flex](https://github.com/MarxJiao/angular-material-flex)