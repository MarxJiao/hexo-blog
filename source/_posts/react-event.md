---
title: react事件介绍
date: 2017-05-11 17:01:43
tags: ['react']
---
在react中绑定事件和在html中类似，使用驼峰命名方式来绑定事件。事件接收的值不再是字符串而是一个函数。事件触发时执行这个函数。
```jsx
class MyComponent extends React.Component {

  handleClick(event) {
    console.log(event)
  }

  render() {
    return (
      <button onClick={this.handleClick}>
        点击事件
      </button>
    );
  }
}

ReactDOM.render(
  <MyComponent />,
  document.getElementById('root')
);
```

上边的的代码可以看到，onClick指向了一个函数，这个函数有个事件参数。这里接收的event参数并非原生事件，而是react封装的[SyntheticEvent](https://facebook.github.io/react/docs/events.html).

## SyntheticEvent
SyntheticEvent有以下特点：
1. [所有事件都代理到当前组件的根节点；](#事件代理)
2. [按照原生事件封装了标准事件的属性和方法；](#SyntheticEvent属性)
3. [抹平了事件在IE和W3C标准上的差异；](#IE和标准浏览器差异)
4. [不能通过异步的方式访问SyntheticEvent；](异步调用事件)

### 事件代理
react 事件自动使用了事件代理，所有事件都在当前组件的根节点监听。所以不用担心事件绑定带来的性能问题。

### SyntheticEvent属性

每个SyntheticEvent有以下属性
```
boolean bubbles
boolean cancelable
DOMEventTarget currentTarget
boolean defaultPrevented
number eventPhase
boolean isTrusted
DOMEvent nativeEvent
void preventDefault()
boolean isDefaultPrevented()
void stopPropagation()
boolean isPropagationStopped()
DOMEventTarget target
number timeStamp
string type
```

### IE和标准浏览器差异
在IE中也需要使用`stopPropagation()`和`preventDefault()`来阻止冒泡和默认事件。在react v0.14以后不能使用`return false`来阻止冒泡和默认事件。

### 异步调用事件
SyntheticEvent在当前组件中是公用的，当事件执行完毕，SyntheticEvent中的属性会被清空，等待下一次调用。所以在异步操作之后不能访问SyntheticEvent。如果想访问的话就需要使用e.persist()将事件单独提出来，这样事件就会一直存在。



欢迎转载，注明出处。原文地址：http://marxjiao.com/2017/05/11/react-event/