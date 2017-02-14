---
title: Vue iscroll指令开发
date: 2017-02-06 18:00:39
---
最近开发的Vue项目中遇到了滑动手势，选用iscroll作为滑动库，因为iscroll直接操作dom，于是封装为Vue的指令来使用。本来想着开发过程会很顺利，但还是遇到了一些问题。在这里记录下问题和解决思路。其中有一些有悖Vue开发实践的地方，目前还在学习思考中，希望大家多多指点。

<!-- more -->

代码地址：https://github.com/MarxJiao/vue-iscroll-directive

## Vue指令中包含的钩子函数和函数参数：

Vue指令包含以下钩子函数

- bind: 只调用一次，指令第一次绑定到元素时调用，用这个钩子函数可以定义一个在绑定时执行一次的初始化动作。
- inserted: 被绑定元素插入父节点时调用（父节点存在即可调用，不必存在于 document 中）。
- update: 被绑定元素所在的模板更新时调用，而不论绑定值是否变化。通过比较更新前后的绑定值，可以忽略不必要的模板更新（详细的钩子函数参数见下）。
- componentUpdated: 被绑定元素所在模板完成一次更新周期时调用。
- unbind: 只调用一次， 指令与元素解绑时调用。

钩子函数被赋予了以下参数：
- **el**: 指令所绑定的元素，可以用来直接操作 DOM 。
- **binding**: 一个对象，包含以下属性：
 - **name**: 指令名，不包括 v-
 前缀。
 - **value**: 指令的绑定值， 例如： v-my-directive="1 + 1", value 的值是 2。
 - **oldValue**: 指令绑定的前一个值，仅在 update 和 componentUpdated钩子中可用。无论值是否改变都可用。
 - **expression**: 绑定值的字符串形式。 例如 v-my-directive="1 + 1"， expression 的值是 "1 + 1"。
 - **arg**: 传给指令的参数。例如 v-my-directive:foo， arg 的值是 "foo"。
 - **modifiers**: 一个包含修饰符的对象。 例如： v-my-directive.foo.bar, 修饰符对象 modifiers 的值是 { foo: true, bar: true }。
- **vnode**: Vue 编译生成的虚拟节点，查阅 [VNode API(https://cn.vuejs.org/v2/api/#VNode接口) 了解更多详情。
- **oldVnode**: 上一个虚拟节点，仅在 update 和 componentUpdate 钩子中可用。

[Vue官方文档](https://cn.vuejs.org/v2/guide/custom-directive.html#钩子函数参数)上有一条这样的提醒
> 除了 el之外，其它参数都应该是只读的，尽量不要修改他们。如果需要在钩子之间共享数据，建议通过元素的 [dataset](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset) 来进行。

# 封装思路

了解了Vue指令的基本组成，我一开始的开发思路是这样的：因为指令不提供钩子间数据共享的功能，先用bind钩子在el上new一个iscroll实例，在update的时候再在el上新建iscroll实例。

```javascript
import IScroll from 'iscroll'

const VIScroll = {
    install(Vue, options) {
        Vue.directive('iscroll', {
            bind(el, binding, vnode, oldVnode) {

                // 判断输入参数
                let vtype = binding.value ? [].toString.call(binding.value) : undefined;

                // 设置iscorll属性的参数
                let iscrollOptions  = vtype === '[object Object]' ? binding.value : options;

                // 阻止touchmove默认事件
                el.addEventListener('touchmove', event => {
                    event.preventDefault();
                })

                // 建立新的iscroll
                new IScroll(el, iscrollOptions);
            },
            update(el, binding, vnode, oldVnode) {

                  // 判断输入参数
                let vtype = binding.value ? [].toString.call(binding.value) : undefined;

                // 设置iscorll属性的参数
                let iscrollOptions  = vtype === '[object Object]' ? binding.value : options;

                // 阻止touchmove默认事件
                el.addEventListener('touchmove', event => {
                    event.preventDefault();
                })

                // 建立新的iscroll
                new IScroll(el, iscrollOptions);
            },
            unbind(el, binding, vnode, oldVnode) {

                /**
                 * 解除绑定时要把iscroll销毁
                 */
                vnode.scroll = oldVnode.scroll;
                vnode.scroll.destroy();
                vnode.scroll = null;
            }
        })
    }
}

export default VIScroll;
```

这样做的结果是滑动效果没问题，数据更新后iscroll能够识别新的dom结构，但在点击按钮发送请求的时候，新建了多少个iscroll实例，就请求多少次，出现了重复请求的问题。

Vue官方推荐使用dataset来在钩子间共享数据，既然是封装，显然dataset是不好维护的。我们需要解决的问题是跨钩子的数据共享和指令在多个地方使用时的数据隔离。

iscroll提供了refresh方法来处理dom改变时刷新iscroll的状态。Vue指令钩子中还有vnode和oldVnode参数，虽然官方不推荐修改它们，但在它们里面添加属性是可行的。

于是乎有了另外的设计思路：在binding钩子中新建iscroll实例，并添加到vnode里，在update时，将oldVnode里面的iscroll属性赋值给新的vnode，这样实现了一个iscroll实例的跨钩子数据传递，在update钩子中使用iscroll的refresh方法进行刷新，这样就保证了一次指令调用只使用一个iscroll实例，解决了多次触发事件的问题。最后在指令销毁时销毁iscroll实例。

```javascript
import IScroll from 'iscroll'

const VIScroll = {
    install(Vue, options) {
        Vue.directive('iscroll', {
            bind(el, binding, vnode, oldVnode) {

                // 判断输入参数
                let vtype = binding.value ? [].toString.call(binding.value) : undefined;

                // 设置iscorll属性的参数
                let iscrollOptions  = vtype === '[object Object]' ? binding.value : options;

                // 阻止touchmove默认事件
                el.addEventListener('touchmove', event => {
                    event.preventDefault();
                })

                // 使用vnode绑定iscroll是为了让iscroll对象能够夸状态传递，避免iscroll重复建立
                vnode.scroll = new IScroll(el, iscrollOptions);
            },
            update(el, binding, vnode, oldVnode) {

                // 将scroll绑定到新的vnode上
                vnode.scroll = oldVnode.scroll;

                // 使用settimeout让refresh跳到事件流结尾，保证refresh时数据已经更新完毕
                setTimeout(() => {
                    vnode.scroll.refresh();
                }, 0)
            },
            unbind(el, binding, vnode, oldVnode) {

                /**
                 * 解除绑定时要把iscroll销毁
                 */
                vnode.scroll = oldVnode.scroll;
                vnode.scroll.destroy();
                vnode.scroll = null;
            }
        })
    }
}

export default VIScroll;
```

## 使用方法

代码已经上传到npm，下面是使用方法

### 安装

```
npm install viscroll
```
### 使用

```html
<template>
    <!-- 使用iscroll指令，这里的iscroll实例使用Vue.use初始化指令时的参数-->
    <div v-iscroll>
        <!-- content -->
    </div>

    <!-- 也可以在使用的时候设置iscroll的参数 -->
    <div v-iscroll="iscrollConf">
        <!-- content -->
    </div>
</template>

<script>

import VIscroll from 'viscroll';

// 可以在use的时候设置iscroll的参数
Vue.use(VIscroll, {
    mouseWheel: true,
    click: false,
    preventDefault: true,
    tap: false,
    bounce: false,
    disableTouch: true
});

export {
    data() {
        return {
            iscrollConf: {
                mouseWheel: true,
                vScrollbar: true,
                click: true,
                preventDefault: true,
                tap: true,
                bounce: false,
                disableTouch: true
            }
        }
    }
}

</script>
```