---
title: 在威联通 NAS 上使用 Docker
date: 2019-11-03 10:35:10
tags: [Cloud, Docker, Life]
---

最近想折腾下家里的 NAS，想把它变成一个开发机。在开发机上运行服务，首先想到的就是使用 Docker。Docker 的优点有一大堆，我看中的就是隔离性，一致性和快速部署。
 
<!-- more -->

下面我们来看怎么在威联通 NAS 上安装和运行 Docker。本文主要介绍以下过程：

1. NAS 上 Docker 环境安装
2. NAS 上搭建私有 Docker 仓库
3. 本地开发并 push 镜像到私有仓库
4. 在 NAS 上运行私库中的镜像

## NAS 上 Docker 环境安装

安装非常简单，登录 NAS 后台在应用中心安装 `Container Station` 就行了。

![Container Station 图标](container-station-icon.png)

打开 `Container Station` 我们能看到正在运行的 Containers 。我这里已经安装好了 `registry`，就是接下来要介绍的私库搭建。

![Container Station 界面](overview.png)

## 安装私库

私库也是一键安装的。在 Container Station 中点击创建，我们可以看到所有的可以创建的容器。在列表中找到 `Registry` 点击安装即可。

![安装 Registry](install-registry.png)

安装完成后我们可以到 `Containers` 菜单中看到安装好的私库容器。在操作选项中点击编辑图标即可看到生成容器的 Docker Compose YAML 配置文件。在文件中我们可以看到私库的端口，我这里是 `6088` ，所以私库地址就是`192.168.50.51:6088`。

![配置文件](registry-yaml.png)

## 开发程序并 push 镜像到私有仓库

我们简单写一个 node server。

```javascript
// content of index.js
const http = require('http')
const port = 3000

const requestHandler = (request, response) => {
  console.log(request.url)
  response.end('Hello Node.js Server!')
}

const server = http.createServer(requestHandler)

server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})
```

package.json


```json
{
  "name": "test-docker",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "author": "",
  "license": "ISC"
}

```

Dockerfile

```Dockerfile
FROM node:10.16.3-alpine

WORKDIR /app

COPY package.json /app/package.json
COPY index.js /app/index.js

EXPOSE 3000

CMD npm start
```

在项目目录执行下面的命令来完成等镜像的构建，打 tag 和上传。

```
# 编译镜像
docker build -t my-node-server .

# 给镜像加 tag
docker tag my-node-server 192.168.50.51:6088/my-node-server:1.0.0  

# push 镜像到私有仓库
docker push 192.168.50.51:6088/my-node-server:1.0.0
```

## 在 NAS 上运行私库中的镜像

### 图形化操作运行 Docker 镜像

我们可以在 Container Station 中使用图形化的方式运行程序。

先来设置镜像仓库地址。进入 Container Station 的 `属性` 菜单。切到 `Registry服务器` 页面。点击 `新增` 按钮。输入我的私库信息。

![添加镜像仓库](add-registry.png)

进入 Container Station 的 Containers 菜单。点击拉取，输入刚才上传的镜像。

![拉取镜像](pull-image.png)

之后就能看到我们的镜像已经在列表中了。

![镜像列表](images-list.png)

点击操作选项里的 `+` 按钮，进入创建容器配置。

![创建容器](add-container.png)

点击高级选项可以配置容器的环境，网络，设备和挂载的目录。这里我们映射端口 40000 到 3000

![高级选项](advanced-settings.png)

配置好后我们进入 Containers 菜单，能看到刚才创建的容器已经运行起来了。

![容器列表](containers-list.png)

访问 `http://192.168.50.51:40000` 能看到程序运行正常。

![运行结果](ui-result.png)


### 使用命令运行 Docker 镜像

威联通 NAS 系统基于 Linux 开发，可以 ssh 登录到 nas，执行各种命令就行了。

```
# pull 镜像
docker pull 192.168.50.51:6088/my-node-server:1.0.0

# 运行镜像
docker run -p 40001:3000 192.168.50.51:6088/my-node-server:1.0.0
```

访问 `http://192.168.50.51:40001/`，看到我们的程序已经运行起来了

![访问程序地址](docker-run.png)

## 总结

以上是在 NAS 上安装使用 Docker 的简单示例。过程不重要，重要的是家里的 NAS 不再只是一个下电影，存照片的工具，可以当成一个云开发机，折腾各种东西了。
