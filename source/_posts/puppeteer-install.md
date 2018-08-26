---
title: 手动下载 Chrome，解决 puppeteer 无法使用问题
date: 2018-08-26 21:45:19
tags:
---


因为网络原因，国内安装 `puppeteer` 的时候会报网络超时。这里使用 `puppeteer-core` 之后使用手动下载的 `Chrome` 进行操作。思路很简单，安装一个不带浏览器的 `puppeteer`，再使用的时候将浏览器地址指向一个可执行的 `Chrome` 浏览器文件。

<!-- more -->

## 安装

安装`puppeteer-core`。

```
yarn add puppeteer-core
```

## 找到 puppeteer 中对应的浏览器并下载

在 `node_modules/puppeteer-core/lib/BrowserFetcher.js` 中找到各平台 `Chrome` 下载地址。其中`%s` 替换为 `DEFAULT_DOWNLOAD_HOST` 的值，`%d` 替换为版本号。

![地址](./url.png)

在 `node_modules/puppeteer-core/packages.json` 中找到版本号

![版本号](./revision.png)


替换后得到下载地址

https://storage.googleapis.com/chromium-browser-snapshots/Mac/579032/chrome-mac.zip

下载后解压，放在项目目录中，这里我放在 chrome 下。

## 使用

这样就可以使用了。

使用代码

```javascript
const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({
        // 这里注意路径指向可执行的浏览器。
        // 各平台路径可以在 node_modules/puppeteer-core/lib/BrowserFetcher.js 中找到
        // Mac 为 '下载文件解压路径/Chromium.app/Contents/MacOS/Chromium'
        // Linux 为 '下载文件解压路径/chrome'
        // Windows 为 '下载文件解压路径/chrome.exe'
        executablePath: path.resolve('./chrome/Chromium.app/Contents/MacOS/Chromium')
    });
    const page = await browser.newPage();
    await page.setViewport({
        width: 375,
        height: 667,
        deviceScaleFactor: 1,
        isMobile: true
    })
    await page.goto('https://marxjiao.com/');
    await page.screenshot({path: 'marx-blog.png'});
    await browser.close();
})();

```

执行文件

```
node index.js
```

执行后可看到，图片已经截图出来了

![marx-blog.png](./marx-blog.png)

代码地址： https://github.com/MarxJiao/puppeteer-test
