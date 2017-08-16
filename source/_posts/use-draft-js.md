---
title: 使用draft.js开发富文本编辑器
date: 2017-08-14 19:37:23
tags: [react]
---
Draft.js是Facebook开源的开发React富文本编辑器开发框架。和其它富文本编辑器不同，draft.js并不是一个开箱即用的富文本编辑器，而是一个提供了一系列开发富文本编辑器的工具。本文通过开发一些简单的富文本编辑器，来介绍draft.js提供的各种能力。
<!-- more -->
# draft.js解决的问题

1. 统一html标签contenteditable="true"，在编辑内容时，不同浏览器下产生不同dom结构的问题;
2. 给html的改变赋予onChange时的监听能力;
3. 使用不可变的数据结构，每次修改都生成新的状态，保证里历史记录的可回溯;
4. 可以结构化存储富文本内容，而不需要保存html片段。

# 不可变的数据结构

这里要介绍下不可变的数据，draft.js使用[immutable.js](http://facebook.github.io/immutable-js/)提供的数据结构。draft.js中所有的数据都是不可变的。每次修改都会新建数据，并且内存中会保存原来的状态，方便回到上一步，这里很符合react的单向数据流的设计思路。

# Editor组件

Draft.js提供了一个`Editor`组件。Editor组件是内容呈现的载体。我们先看一个基础编辑器。[在线示例](https://marxjiao.com/draft-demo/#/basicEditor)

```javascript
import React, {Component} from 'react';
import {Editor, EditorState} from 'draft-js';

export default class extends Component {
    constructor(props) {
        super(props);
        this.state = {
            editorState: EditorState.createEmpty()
        };
        this.onChange = editorState => {
            this.setState({editorState});
        };
    }
    render() {
        return (
            <div className="basic">
                基础编辑器
                <div className="editor">
                    <Editor
                        editorState={this.state.editorState}
                        onChange={this.onChange}/>
                </div>
            </div>
        )
    }
}
```

这里的Editor组件接收2个props：`editorState`是整个编辑器的状态，类似文本框的`value`；`onChange`监听状态改变并把新的状态传给对应的函数。初始化的时候我们使用了`EditorState`提供的createEmpty方法，根据语意我们很容易知道这个是生成一个没有内容的`EditorState`对象。

# 富文本样式

提到富文本编辑器，当然避免不了各种丰富的样式。富文本样式包含两种，行内样式和块级样式。行内样式是在段落中某些字段上添加的样式，如粗体、斜体、文字加下划线等等。块级样式是在整个段落上加的样式，如段落缩进、有序列表、无需列表等。Draft.js提供了[RichUtils](https://draftjs.org/docs/api-reference-rich-utils.html#content)模块来处理富文本样式。

## 行内样式

`RichUtils.toggleInlineStyle`方法可以切换光标所在位置的行内样式。该函数接收2个参数。第一个是editorState，在editorState中已经包含了光标选中内容的信息。第二个参数是样式名，draft.js提供了'BOLD', 'ITALIC', 'UNDERLINE','CODE'这几个默认的样式名。

```
toggleInlineStyle(
    editorState: EditorState,
    inlineStyle: string
): EditorState
```

点击「Bold」按钮使选中字体变粗的例子：

```javascript
import React, {Component} from 'react';
import {Editor, EditorState, RichUtils} from 'draft-js';

export default class extends Component {
    constructor(props) {
        super(props);
        this.state = {
            editorState: EditorState.createEmpty()
        };
        this.onChange = editorState => {
            this.setState({editorState});
        };
        this.toggleInlineStyle = this.toggleInlineStyle.bind(this);
    }
    toggleInlineStyle(inlineStyle) {
        this.onChange(
            RichUtils.toggleInlineStyle(
                this.state.editorState,
                inlineStyle
            )
        );
    }
    render() {
        return (
            <div className="basic">
                <button onClick={() => {this.toggleInlineStyle('BOLD')}}>Bold</button>
                <div className="editor">
                    <Editor
                        editorState={this.state.editorState}
                        onChange={this.onChange}/>
                </div>
            </div>
        )
    }
}
```

除此之外还可以为`Editor`提供`customStyleMap`prop来自定义行内样式。

```javascript

// ...
const styleMap = {
    'RED': {
        color: 'red'
    }
}

class MyEditor extends React.Component {
    // ...
    render() {
        return (
            <div className="basic">
                <button onClick={() => {this.toggleInlineStyle('BOLD')}}>Bold</button>
                <!-- 点击之后会在styleMap里查找「RED」对应的样式 -->
                <button onClick={() => {this.toggleInlineStyle('RED')}}>Red</button>
                <div className="editor">
                    <Editor
                        customStyleMap={styleMap}
                        editorState={this.state.editorState}
                        onChange={this.onChange}/>
                </div>
            </div>
        )
    }
}
```

[在线示例](https://marxjiao.com/draft-demo/#/inlineStyle)

## 块级样式

Draft.js的块级样式是写在css文件中的，要使用默认样式需要引用`draft-js/dist/Draft.css`。下面是一些标签对应的样式名
![block type](./block-type.png)
<!-- | html标签        | block类型          | 
| -------------  |-------------|
| \<h1/>         | header-one | 
| \<h2/>         | header-two     | 
| \<h3/>         | header-three     |
| \<h4/>         | header-four     |
| \<h5/>         | header-five     |
| \<h6/>         | header-six     |
| \<blockquote/> | blockquote    |
| \<pre/>        | code-block|
| \<figure/>     | atomic|
| \<li/>	     | unordered-list-item,ordered-list-item|
| \<div/>        | unstyled| -->


可以使用`RichUtils.toggleBlockType`来改变block对应的类型。

```javascript
toggleBlockType(
    editorState: EditorState,
    blockType: string
): EditorState
```

`Editor`的`blockStyleFn`prop可以方便自定义样式。

```javascript
import 'draft-js/dist/Draft.css';
import './index.css';
import React, {Component} from 'react';
import {Editor, EditorState, RichUtils} from 'draft-js';

export default class extends Component {
    constructor(props) {
        super(props);
        this.state = {
            editorState: EditorState.createEmpty()
        };
        this.onChange = editorState => {
            this.setState({editorState});
        };
        this.toggleBlockType = this.toggleBlockType.bind(this);
    }
    toggleBlockType(blockType) {
        this.onChange(
            RichUtils.toggleBlockType(
                this.state.editorState,
                blockType
            )
        );
    }
    render() {
        return (
            <div className="basic">
                <button onClick={() => {this.toggleBlockType('header-one')}}>H1</button>
                <button onClick={() => {this.toggleBlockType('blockquote')}}>blockquote</button>
                <div className="editor">
                    <Editor
                        blockStyleFn={getBlockStyle}
                        editorState={this.state.editorState}
                        onChange={this.onChange}/>
                </div>
            </div>
        )
    }
}
function getBlockStyle(block) {
    switch (block.getType()) {
        case 'blockquote': return 'RichEditor-blockquote';
        default: return null;
    }
}
```

在css文件中，可以自定义`.RichEditor-blockquote`的样式。

```css
.RichEditor-blockquote {
    border-left: 5px solid #eee;
    color: #666;
    font-family: 'Hoefler Text', 'Georgia', serif;
    font-style: italic;
    margin: 16px 0;
    padding: 10px 20px;
}
```

[在线示例](https://marxjiao.com/draft-demo/#/blockStyle)

我们可以使用`editorState.getCurrentContent()`获取`contentState`对象，`contentState.getBlockForKey(blockKey)`可以获取到`blockKey`对应的`contentBlock`。`contentBlock.getType()`可以获取到当前contentBlock对应的类型。

# Decorator