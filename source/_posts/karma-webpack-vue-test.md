---
title: karma+webpack搭建vue单元测试环境
date: 2017-01-08 18:44:30
---
最近做了一次关于vue组件自动化测试的分享，现在将vue组件单元测试环境搭建过程整理一下。这次搭建的测试环境和开发环境隔离，所以理论上适用所有使用vue的开发环境。

<!-- more -->

## 准备

这篇文章的重点在于搭建测试环境，所以我随便写了个webpack的vue开发环境。

代码地址：https://github.com/MarxJiao/vue-karma-test

目录结构如下

![img](http://upload-images.jianshu.io/upload_images/3831128-e7b49b33f8a86bcb.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


目录结构
app.vue和child.vue代码

app.vue
![app.vue](http://upload-images.jianshu.io/upload_images/3831128-506b31264b73446b.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

child.vue
![child.vue](http://upload-images.jianshu.io/upload_images/3831128-5dc1d79acaf3239d.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

运行效果如下：

![效果](http://upload-images.jianshu.io/upload_images/3831128-b8592a825d030e46.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)


## 测试环境搭建

### 安装karma

因为karma是要在命令中运行的，所以先安装karma-cli：npm install -g karma-cli

安装karma：npm install karma --save-dev

在项目根目录执行：karma init

这时会提示使用的测试框架，我们可以使用键盘的上下左右来选择框架，有jasmine、mocha、qunit、nodeunit、nunit可供选择，如果想用其他框架也可以自己填写。这里我们使用jasmine作为测试框架，jasmine自带断言库，就不用引入其它的库了。
![选择框架](http://upload-images.jianshu.io/upload_images/3831128-160411920f274170.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

之后提示是否使用require.js，这里我们不使用。
![use require.js](http://upload-images.jianshu.io/upload_images/3831128-dd60ed17c80c6341.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

选择浏览器，可以多选。单元测试只需要能运行js的环境就好了，不需要界面，所以我们选择PhantomJS。注意PhantomJS需要提前安装在电脑上，phantomjs安装包。嫌麻烦的话选择chrome最方便了。
![选择浏览器](http://upload-images.jianshu.io/upload_images/3831128-f3e7994f0f80324a.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

填写测试脚本存放位置，支持通用匹配。我们放在test/unit目录下，并以.spec.js结尾。
![脚本文件](http://upload-images.jianshu.io/upload_images/3831128-dd9a7a50527c8b13.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

这时会提示没有匹配的文件，因为我们还没开始写测试用例，所以先忽略。
![提示没匹配到文件](http://upload-images.jianshu.io/upload_images/3831128-64a01e724ed5867a.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

是否有需要排除的符合前面格式的问文件？直接跳过。
![排除文件](http://upload-images.jianshu.io/upload_images/3831128-6262ccdac14ccad1.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

是否让karma监控所有文件，并在文件修改时自动执行测试。因为是搭环境阶段，我们先选no。
![是否开启watch](http://upload-images.jianshu.io/upload_images/3831128-7b3ad26be3e1df4e.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

之后按回车，我们就能看到在项目根目录已经生成了karma的配置文件karma.conf.js。
![目录](http://upload-images.jianshu.io/upload_images/3831128-e71f6639b74240af.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

### 安装依赖

执行上面的操作可以看到karma为我们安装了如下依赖，karma-jasmine是karma的jasmine插件，karma-phantomjs-launcher是打开phantomjs的插件
![karma自己安装的依赖](http://upload-images.jianshu.io/upload_images/3831128-be4ab1a6a53f3d65.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

测试框架选择jasmine，安装jasmine-core

使用webpack打包vue组件，需要安装webpack、karma-webpack、vue-loader、vue-template-compiler、css-loader

使用bable处理ES6语法，安装babel-core、babel-loader、babel-preset-es2015

执行：npm install --save-dev jasmine-core webpack karma-webpack vue-loader vue-template-compiler css-loader babel-core babel-loader babel-preset-es2015

### 修改配置文件

先在karma.conf.js顶部引用webpack
![karma.conf.js](http://upload-images.jianshu.io/upload_images/3831128-04e7f449ffa875cc.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

在配置项中加入webpack配置
![karma.conf.js](http://upload-images.jianshu.io/upload_images/3831128-1e41d4d6c3a8c531.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

在预处理选项中添加webpack处理的文件。这里我们用webpack处理测试用例。
![karma.conf.js](http://upload-images.jianshu.io/upload_images/3831128-e43b46f6bbf1e2de.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

### 编写第一个测试

编写一个测试用例来运行，我们先测试下app.vue文件加载后title值是否符合预期。新建test文件夹，test文件夹下建立unit文件夹，unit文件夹下建立app.spec.js文件。目录结构如下：
![目录](http://upload-images.jianshu.io/upload_images/3831128-cefe3d260f1c8984.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

app.spec.js内容如下
![test/unit/app.spec.js](http://upload-images.jianshu.io/upload_images/3831128-92ac1fb5fdd77d26.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

在当前目录打开命令行，输入karma start，这时karma会启动一个服务来监听测试。


karma start
不要关闭当前命令窗口，再打开一个命令窗口，输入karma run，这时我们会看到测试通过的提示。
![karma run](http://upload-images.jianshu.io/upload_images/3831128-27e693ef2384321c.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

### 查看测试覆盖率

单元测试属于白盒测试，测试覆盖率也是测试指标之一。karma提供了karma-coverage来查看测试覆盖率。

安装karma-coverage：npm install karma-coverage --save-dev

配置覆盖率，在预处理的文件上加coverage
![karma.conf.js](http://upload-images.jianshu.io/upload_images/3831128-e8b05aaa4e8ad4e4.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

在报告中使用coverage
![karma.conf.js](http://upload-images.jianshu.io/upload_images/3831128-371448bc1fee76e3.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

配置覆盖率报告的查看方式
![karma.conf.js](http://upload-images.jianshu.io/upload_images/3831128-dc4a1a85e941a103.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

再次执行karma start和karma run，我们能看到生成了覆盖率查看文件夹
![目录](http://upload-images.jianshu.io/upload_images/3831128-b114377c43f0677f.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

在浏览器中打开上图中的index.html我们能看到覆盖率已经生成。
![index.html](http://upload-images.jianshu.io/upload_images/3831128-ee43d2dad45dd408.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

点击「unit/」我们看到app.spec.js代码有3036行，测试覆盖率是打包之后文件的覆盖率，
![unit/index.html](http://upload-images.jianshu.io/upload_images/3831128-3d2e5c32c28382de.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

点开文件，果然是打包之后的代码。这个覆盖率显然不是我们想要测试的源文件的覆盖率。
![unit/app.spec.js](http://upload-images.jianshu.io/upload_images/3831128-fa0ef54d77600081.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

怎么办呢？想想开发时浏览器打开的也是编译后的文件，我们怎么定位源码呢？

Bingo! sourcemap。

当然这里只用sourcemap是不够的，测试覆盖率神器isparta闪亮登场。

安装：npm install --save-dev isparta isparta-loader

修改vue的js loader
![karma.conf.js](http://upload-images.jianshu.io/upload_images/3831128-5c0b446eec237c9a.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

再次执行karma start和karma run，我们能看到测试覆盖率文件已经能找到源文件了，并且覆盖率只有js代码，并不包括无关的template和style，简直太好用了有没有。
![index.html](http://upload-images.jianshu.io/upload_images/3831128-e4c3a2f7844efeab.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![src/index.html](http://upload-images.jianshu.io/upload_images/3831128-2180d634fcdac02c.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![src/app.vue.html](http://upload-images.jianshu.io/upload_images/3831128-c5674e8db4629fa0.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

等等，怎么还有那个3000多行的文件，这个覆盖率没有用，能去掉吗？答案是肯定的。我们只需要把karma.conf.js中preprocessors的coverage去掉即可。
![karma.conf.js](http://upload-images.jianshu.io/upload_images/3831128-a994479a0e88d7d3.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

再次执行karma start和karma run，我们能看到覆盖率的文件变成这样了。
![index.html](http://upload-images.jianshu.io/upload_images/3831128-88cd8a643e603ccd.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

最后我们可以把karma的watch模式打开，之后只需要运行karma start就能监控文件变动并自动执行测试了。
![karma.conf.js](http://upload-images.jianshu.io/upload_images/3831128-c8d0a530e2c443a7.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

至此karma+webpack搭建的vue单元测试环境就已经ready了。

文章图片较多，略显拖沓，不妥之处欢迎吐槽，欢迎拍砖。

关于如何写测试脚本，请看这篇文章Vue单元测试case写法。

## 相关链接

[Vue单元测试case写法](http://marxjiao.com/2017/01/11/write-vue-unit-test-case/)

[Karma官网](http://karma-runner.github.io/1.0/index.html)

[Vue Unit Testing](http://%20https//vuejs.org/v2/guide/unit-testing.html)

[isparta loader](https://github.com/deepsweet/isparta-loader/blob/master/README.md)

