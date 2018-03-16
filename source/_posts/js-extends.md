---
title: javascript继承方式对比
date: 2018-03-16 15:12:42
tags:
---

本文对比三种常用的js继承方式。组合式继承、原型式继承和ES6中class的`extends`。对比方式简单粗暴，写出这几种继承，之后看继承后的类的实例。

<!-- more -->

## 代码

直接上代码：

```javascript
// 基类
function Parent() {
    this.a = 1;
}
Parent.prototype.getA = function () {
    console.log(this.a);
    return this.a;
}

// 组合式继承
function Child1() {
    this.b = 2;
    // 先借用构造函数
    Parent.call(this);
}
Child1.prototype = new Parent();
Child1.prototype.constructor = Child1;

// 原型式继承
function Child2() {
    this.c = 3;
    // 先借用构造函数
    Parent.call(this);
}
Child2.prototype = Object.create(Parent.prototype);
Child2.prototype.constructor = Child2;

// es6继承
class Child3 extends Parent {
    constructor () {
        super(Parent)
        this.d = 4;
    }
}

console.log(new Child1());
console.log(new Child2());
console.log(new Child3());

```

## 运行结果：

![result](./result.png)

## 总结

可以看到组合式继承和原型式继承最主要的区别是组合式继承的子类原型上有父类构造函数中的属性。原型式继承和es6的extends继承方式基本没什么差别，只是constructor类型一个是函数，一个是class。