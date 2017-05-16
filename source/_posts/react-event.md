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
1. 所有事件都代理到当前组件的根节点；
2. 按照原生事件封装了标准事件的属性和方法；
3. 抹平了事件在IE和W3C标准上的差异；
4. 不能通过异步的方式访问SyntheticEvent；