---
title: Vuex源码阅读
date: 2017-12-19 16:40:29
tags:
---

对复杂的Vue项目，我们可以使用Vuex来进行状态管理。今天和大家一起来看下Vuex的源码，探索下Vuex是怎么管理状态的。

<!-- more -->

## 初始化

new Vuex.Store()的时候如果没有Vue.use(Vuex)的话，就执行install(window.Vue);

获取参数中的plugins和strict
```javascript
const {
    plugins = [],
    strict = false
} = options
```
初始化基本信息
```javascript
// store internal state
this._committing = false
this._actions = Object.create(null)
this._actionSubscribers = []
this._mutations = Object.create(null)
this._wrappedGetters = Object.create(null)
```

初始化this._modules
```javascript
this._modules = new ModuleCollection(options)
```

这里会先将基本信息新建Module，并赋给this.root;

之后递归modules属性，每个都新建个Module;

之后初始化
```javascript
this._subscribers = []
this._watcherVM = new Vue()
```

可以看到this._watcherVM就是个Vue实例。

之后将dispatch和commit绑定到实例上。这样做的目的是不管在什么地方调用dispatch和commit，里面的this都是指向当前实例，而不是外部的运行环境。

#### installModule

之后安装module，从root module开始，执行installModule

将mutation包裹一层放在store._mutations[type]

将actions包裹一层放在store._actions[type]，这里每个action都返回Promise对象。

将getter都放在store._wrappedGetters[type]

之后递归子module，对每一个module都执行installModule

#### resetStoreVM(this, state)

将state初始化为Vue的data的$$state，getter初始化为computed

#### 安装插件

遍历插件，一个个对store执行

如果有devtool就初始化

devtool在初始化时emit init事件

如果监听到vuex:travel-to-state，就替换state

之后订阅state的改变，每次改变都emit vuex:mutation，把mutation和state传递出去。

## commit

先获取参数，如果提交的type是object，就整理下，拿到type，payload，option。

设置mutation变量，供subscriber使用

拿到所有当前type的mutation，一个一个执行

之后把所有subscriber都执行一边

## dispatch

和commit一样的拿参数的方式。

设置action变量，后边触发_actionSubscribers用。

拿到当前type的所有actions

this._actionSubscribers挨个执行

如果如有多个就return Promise.all()如有只有1个就return那个。

## 总结

以上就是vuex的初始化过程和基本工作原理。
