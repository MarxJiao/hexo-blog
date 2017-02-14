---
title: Vue单元测试case写法
date: 2017-01-11 14:41:39
---

书接上文，[karma+webpack搭建vue单元测试环境](http://marxjiao.com/2017/01/08/karma-webpack-vue-test/)介绍了vue单元测试环境搭建及查看源文件的测试覆盖覆盖率。今天来说一下vue单元测试思路和case的写法。测试框架使用jasmine，[语法参考](https://jasmine.github.io/2.0/introduction.html)。

<!-- more -->

> 代码地址：[https://github.com/MarxJiao/vue-karma-test/tree/spec-demo](https://github.com/MarxJiao/vue-karma-test/tree/spec-demo)

# 测试关注点

对于vue组件，单元测试测试主要关注以下几点：

- vue组件加载后，各数据模型是否符合预期
- 定义的方法是否可用
- filter是否可用
- 带有props的组件，数据能否正常传递
- 异步更新DOM的情况

# 组件加载后的状态
要测试组件加载后的状态，首先我们需要将vue组件生成实例。并检测挂载后实例的数据状态。下面是个示例：

我们来看下`src/app.vue`组件的代码：

```html
<template>
    <div>
        <h1>{{title}}</h1>
        <vc-message :message="message"></vc-message>
    </div>
</template>

<script>
    import child from './components/child.vue'
    export default {
        data() {
            return {
                title: '标题',
                message: '这是子组件'
            }
        },
        components: {
            'vc-message': child
        },
        mounted() {
            this.title = 'Hello world'
        },
        methods: {
            setMessage(msg) {
                this.message = msg;
            }
        }
    }
</script>
```

组件加载后title的值应该变成'Hello world'，所以我们这样来写测试代码

```javascript
// 引用vue
import Vue from 'vue';

// 引用要测试的组件
import app from '../../src/app.vue';

// 描述要测试的内容
describe('test app.vue', () => {
    
    // 描述要测试的最小单元
    it('组件加载后，title应该是Holle world', () => {

        // 这里将app生成vue实例，并使用 $mount() 模拟挂载状态
        let vm = new Vue(app).$mount();

        // 断言组件的title是否变为了'Hello world'
        expect(vm.title).toEqual('Hello world');
    });
});
```

执行`karma start`我们能看到测试通过。

# 测试组件里面的方法

我们知道vue将data和methods都挂在了vue实例的根节点下，所以测试vue组件中的方法也和上面测试状态一样，直接调用vm的方法就行了。我们来测试以下`setMessage`方法：

```javascript
// 引用vue
import Vue from 'vue';

// 引用要测试的组件
import app from '../../src/app.vue';

// 描述要测试的内容
describe('test app.vue', () => {
    
    // 描述要测试的最小单元
    it('设置message为『你好世界』', () => {

        // 这里将app生成vue实例，并使用 $mount() 模拟挂载状态
        let vm = new Vue(app).$mount();

        // 执行setMessage方法
        vm.setMessage('你好世界');

        // 断言组件的message是否变为了'你好世界'
        expect(vm.message).toEqual('你好世界');
    });
});
```

执行`karma start`，就会看到测试成功。如果刚才没有关闭karma的话，在watch模式下，测试会自动进行。

怎么样？有没有感觉vue单元测试非常简单，赶紧做起来吧。

# filter测试
filter的测试就更简单了。filter就是纯函数，有固定的输入输出，我们只需要执行函数看预期结果就好了。我们为组件添加一个转换大写的filter:

```html
<template>


    <h1>{{title | upperCase}}</h1>


</template>

<script>

// ...

    filters: {
        upperCase(str) {
            return str.toUpperCase();
        }
    }

// ...
</script>
```

测试这个filter

```javascript
// 引用要测试的组件
import app from '../../src/app.vue';

// 描述要测试的内容
describe('test app.vue', () => {

    it('upperCase过滤器能把app转换为APP', () => {

        // vue 组件export出来的是个对象，我们直接用这个对象的属性和方发就能调用到要测试的filter
        let appStr =  app.filters.upperCase('app');

        // 断言组件的appStr是为'APP'
        expect(appStr).toEqual('APP');
    });
})
```

# props测试

props依赖父组件，这个怎么测试呢。我们来看下[vue官方提供的方法](https://vuejs.org/v2/guide/unit-testing.html#Writing-Testable-Components)
使用Vue.extend()将组件挂载Vue构造器上，用propsData加入props数据，之后new一个Vue实例，这样就生成了一个独立的带props的vm和前面的实例一样，可以进行各种测试。
我们的child组件：

```html
<template>
    <div>
        <div>{{message}}</div>
    </div>
</template>

<script>
    export default {
        props: ['message']
    }
</script>
```

测试child组件

```javascript
// 引用vue
import Vue from 'vue';

// 引用要测试的组件
import child from '../../src/components/child.vue';

/**
 * 获取生成的vm
 *
 * @param {Object} Component 组件
 * @param {Object} propsData props数据
 * @return {Object} vue实例
 */
function getRenderedVm (Component, propsData) {
    const Ctor = Vue.extend(Component)
    const vm = new Ctor({ propsData }).$mount()
    return vm
}

// 描述要测试的内容
describe('test child.vue', () => {
    
    // 描述要测试的最小单元
    it('组件加载后，child组件的message应该是「这是子组件」', () => {
        let childvm = getRenderedVm(child, {
            message: '这是message'
        });

        // 断言组件的child组件的props是否生效
        expect(childvm.message).toEqual('这是message');
    });
});
```

是不是so easy.

# 异步更新DOM的情况
异步更新DOM的情况，参考[vue官网的示例](https://vuejs.org/v2/guide/unit-testing.html#Asserting-Asynchronous-Updates)
使用`Vue.nextTick`来查看异步数据更新后dom是否变化

```javascript
// 引用vue
import Vue from 'vue';

// 引用要测试的组件
import app from '../../src/app.vue';

// 描述要测试的内容
describe('test app.vue', () => {
    
    // 异步数据更新
    it('数据更新后，视图应该改变', done => {

        // 这里将app生成vue实例，并使用 $mount() 模拟挂载状态
        let vm = new Vue(app).$mount();

        // 挂载后改变title
        vm.title = 'APP';

        Vue.nextTick(() => {
            let title = vm.$el.getElementsByTagName('h1')[0]
            expect(title.textContent).toEqual('APP')
            done();
        })
    });
});
    

```

以上就是对vue组件单元测试的用例编写的介绍，例子举得比较简单，主要是介绍各种情况的测试方法。

# 相关链接

[karma+webpack搭建vue单元测试环境](http://www.jianshu.com/p/a515fbbdd1b2)

[Vue官网单元测试介绍](https://cn.vuejs.org/v2/guide/unit-testing.html)

[Jasmine introduction](https://jasmine.github.io/2.0/introduction.html)