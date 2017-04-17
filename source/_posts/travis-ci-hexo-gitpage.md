---
title: 使用hexo + travis-ci搭建可自动部署的github博客
date: 2017-03-29 13:41:20
tags: hexo
---

我搭建hexo博客的过程：
1. 新建github repo
2. 安装hexo
3. 使用travis-ci实现自动发布
4. 使用disqus添加留言功能

# 新建github repo
在github新建repository，repository名称规则是：`用户名 + .github.io`。我的用户名是MarxJiao，这里新建名为marxjiao.github.io的repository。

新建gh-pages分支，在setting中将source设置为gh-pages branch，这样即可以用这个repository来存放源码，又能将页面发布到这个repository。

克隆代码库到本地。

# 安装hexo

安装node.js，之后执行

```shell
npm install hexo-cli -g
```

命令行进入到刚克隆的文件夹，执行
```
hexo init
```
执行完毕后，hexo就添加到了项目中。
执行
```
hexo generate
```
生成静态文件。
执行`hexo serve`之后的打开`http://localhost:4000/`能看到生成的页面的样式。

# 配置hexo
在_config.yml中找到deploy项，修改为：

```yml
# Deployment
## Docs: https://hexo.io/docs/deployment.html
deploy:
  type: git  # 这里是发布的方式
  repo: https://github.com/MarxJiao/marxjiao.github.io.git # 发布的仓库地址
  branch: gh-pages # 发布的分支
  # message: [message] # 提交信息
  name: MarxJiao # git用户名
  email: marxjiao@gmail.com # git帐号的邮箱
  extend_dirs:  # 排除的文件夹
```

之后执行`hexo deploy`，就能看到页面已经发布。

# 使用travis-ci实现自动发布
在https://travis-ci.org/ 注册帐号，使用github帐号注册即可。
点击添加按钮，可以看到自己的github仓库都关联到了travis-ci中。点击博客仓库前端的开关按钮，将travic-ci设置为开发状态。

在github中新建Personal access token，打开https://github.com/settings/tokens，点击'Generate new token'按钮。

token description 可以顺便填。

select scropes 选repo和user

之后点击`Generate token`按钮。
可以看到token已经生成，离开这个页面token就看不到了，一定要将token复制出来。

在回到travic-ci，点击刚才新添加的repo，点击`More options`，点击setting。添加Environment Variables，name写要使用的变量名，全部大写，我这里使用「GIT」,value中填入刚才申请的git token。

在本地项目文件中添加`.travis.yml`，内容如下：
```yml
language: node_js
node_js:
  - "6"
before_script:
  - npm install hexo-cli -g
  - 
script:
  - hexo generate

deploy:
  provider: pages
  local_dir: public
  repo: MarxJiao/marxjiao.github.io
  skip_cleanup: true
  github_token: $GIT
  on:
    branch: master
  target_branch: gh-pages
```
写文章后，将代码push到仓库，就能看见travis-ci已经在构建页面了，构建之后就会发布到仓库。就能在 http://marxjiao.github.io 查看了。

# 添加评论
这里使用disqus作为评论插件，在https://disqus.com/ 注册帐号，添加shortname，添加网站名称，添加网站地址。

保存后回到_config.yml文件，添加一行

```yml
disqus_shortname: marxjiao
```
push代码，ci结束后就能看到页面中已经添加好了评论模块。