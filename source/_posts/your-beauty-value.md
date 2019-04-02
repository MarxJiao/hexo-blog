---
title: 使用小程序云开发和百度云 AI 接口做了一个颜值测量小程序
date: 2019-04-03 00:43:03
tags: ['小程序']
---

使用小程序云开发功能和百度云 AI 接口做了一个颜值测量小程序。

> TL;DR: 上云，大势所趋。

<!-- more -->

微信云开发体验真的很好。云函数几行代码实现了一个 server，点几下鼠标就完成了部署。不用操心服务端环境搭建和部署，真的是解放生产力，助力前端成为全干工程师。

现阶段的微信小程序的云开发提供免费基础套餐，可创建2个云端环境，资源量较少，对于做个小项目玩玩来说再合适不过了。

百度云的 ai 接口功能也很强大，我这里使用的是人脸检测接口，注册后免费使用，不限调用次数，限制 qps 12。感觉这个是够良心的了。

## 小程序码

（logo 做的有点草率 😉。放心，扫码之后你会发现页面更草率 🙃）

![小程序码](https://7863-xcx-0b2817-1257953462.tcb.qcloud.la/gh_22508b216a19_258.jpg?sign=f9b0bdeafe8dbabd7b5f54632b8c5fa3&t=1554222908)

## 实现过程

非常简单，有兴趣可以直接看代码 [MarxJiao/your-beauty-value](https://github.com/MarxJiao/your-beauty-value)

使用 `wx.chooseImage` 选择图片，使用 `wx.cloud.uploadFile` 上传图片并获取到图片的 `fileID`，传给自己写的云函数`getImageData`。

云函数中使用 `cloud.getTempFileURL` 获取到图片 https 协议的临时路径，把图片路径传给百度云接口，获取到信息后返回给前端。


## 参考文档

- [云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [百度云人脸检测接口文档](http://ai.baidu.com/docs#/Face-Detect-V3/top)