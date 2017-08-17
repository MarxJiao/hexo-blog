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

除了使用自定义样式外，我们也可以使用自定义组件来渲染特定的内容。为了支持自定义富文本的灵活性，Draft.js提供了一个`decrator`系统。Decorator基于扫描给定`ContentBlock`的内容，找到满足与定义的策略匹配的文本范围，然后使用指定的React组件呈现它们。

可以使用`CompositeDecorator`类定义所需的装饰器行为。 此类允许你提供多个`DraftDecorator`对象，并依次搜索每个策略的文本块。

Decrator 保存在`EditorState`记录中。当新建一个`EditorState`对象时，例如使用`EditorState.createEmpty()`，可以提供一个decorator。

新建一个Decorator类似这个样子：
```javascript
const HandleSpan = (props) => {
    return (
        <span
            style={styles.handle}
            data-offset-key={props.offsetKey}
            >
            {props.children}
        </span>
    );
};
const HashtagSpan = (props) => {
    return (
        <span
            style={styles.hashtag}
            data-offset-key={props.offsetKey}
            >
            {props.children}
        </span>
    );
};
const compositeDecorator = new CompositeDecorator([
    {
        strategy: function (contentBlock, callback, contentState) {
            // 这里可以根据contentBlock和contentState做一些判断，根据判断给出要使用对应组件渲染的位置执行callback
            // callback函数接收2个参数，start组件包裹的起始位置，end组件的结束位置
            // callback(start, end);
        },
        component: HandleSpan
    },
    {
        strategy: function (contentBlock, callback, contentState) {},
        component: HashtagSpan
    }
]);

export default  class extends React.Component {
    constructor() {
        super();
        this.state = {
            editorState: EditorState.createEmpty(compositeDecorator),
        };
        // ...
    }
    render() {
        return (
            <div style={styles.root}>
                <div style={styles.editor} onClick={this.focus}>
                    <Editor
                        editorState={this.state.editorState}
                        onChange={this.onChange}
                    />
                </div>
            </div>
        );
    }
}
```

[在线示例](https://marxjiao.com/draft-demo/#/tweet)

[示例源码](https://github.com/MarxJiao/draft-demo/blob/master/src/components/Tweet/index.js)

# Entity

对于一些特殊情况，我们需要在文本上附加一些额外的信息，比如超链接中，超链接的文字和对应的链接地址是不一样的，我们就需要对超链接文字附加上链接地址信息。这个时候就需要`entity`来实现了。

`contentState.createEntity`可以新建entity。

```javascript
const contentState = editorState.getCurrentContent();
const contentStateWithEntity = contentState.createEntity(
    'LINK',
    'MUTABLE',
    {url: 'http://www.zombo.com'}
);

// 要把entity和内容对应上，我们需要知道entity的key值
const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
```
`contentState.createEntity`接收三个参数：
* `type`: 指示了entity的类型，例如：'LINK'、'MENTION'、'PHOTO'等。
* `mutability`: 可变性。不要将不可变性和immutable.js混淆，此属性表示在编辑器中编辑文本范围时，使用此Enity对象对应的一系列文本的行为。 这在下面更详细地讨论。
* `data`: 一个包含了一些对于当前enity可选数据的对象。例如，'LINK' enity包含了该链接的href值的数据对象。

## mutability

### IMMUTABLE

如果不移除文本上的entity，文本不能被改变。当文本改变时，entity自动移除，当删除字符的时候整个entity连同上边携带的文字也会被删除。

### MUTABLE

如果设置Mutability为MUTABLE，被加了enity的文字可以随意编辑。比如超链接的文字是可以随意编辑的，一般超链接的文字和链接的指向是没有关系的。

### SEGMENTED

设置为「SEGMENTED」的entity和设置为「IMMUTABLE」很类似，但是删除行为有些不同，比如一段带有entity的英文文本(因为英文单词间都有空格)，按删除键，只会删除当前光标所在的单词，不会把当前entity对应的文本都删除掉。

[这里](https://codepen.io/Kiwka/embed/wgpOoZ?height=265&theme-id=0&slug-hash=wgpOoZ&default-tab=js%2Cresult&user=Kiwka&embed-version=2&pen-title=Entity%20Editor%20-%20Draft.js%20example)可以直观体会三种entity的区别。

我们使用`RichUtils.toggleLink`来管理entity和内容。

```javascript
toggleLink(
    editorState: EditorState,
    targetSelection: SelectionState,
    entityKey: string
): EditorState
```

下面通过一个能够编辑超链接的编辑器来了解entity的使用。

首先我们新建一个Link组件来渲染超链接。

```javascript
const Link = (props) => {
    // 这里通过contentState来获取entity，之后通过getData获取entity中包含的数据
    const {url} = props.contentState.getEntity(props.entityKey).getData();
    return (
        <a href={url}>
            {props.children}
        </a>
    );
};
```

新建decorator，这里面`contentBlock.findEntityRanges`接收2个函数作为参数，如果第一个参数的函数执行时返回true，就会执行第二个参数函数，同时会将匹配的字符的起始位置和结束位置传递给第二个参数。

```javascript
const decorator = new CompositeDecorator([
    {
        strategy: function (contentBlock, callback, contentState) {

            // 这个方法接收2个函数作为参数，如果第一个参数的函数执行时返回true，就会执行第二个参数函数，同时会将匹配的字符的起始位置和结束位置传递给第二个参数。
            contentBlock.findEntityRanges(
                (character) => {
                    const entityKey = character.getEntity();
                    return (
                        entityKey !== null &&
                        contentState.getEntity(entityKey).getType() === 'LINK'
                    );
                },
                function () {
                    callback(...arguments);
                }
                
            );
        },
        component: Link
    }
]);
```

下面来新建编辑器组件

```javascript
class LinkEditor extends Component {
    constructor(props) {
        super(props);

        this.state = {
            // 新建editor时加入上边建的decorator
            editorState: EditorState.createEmpty(decorator),
            url: ''
        };
        this.onChange = editorState => {
            this.setState({editorState});
        };
        this.addLink = this.addLink.bind(this);
        this.urlChange = this.urlChange.bind(this);
    }

    /**
     * 添加链接
     */
    addLink() {
        const {editorState, url} = this.state;
        // 获取contentState
        const contentState = editorState.getCurrentContent();
        // 在contentState上新建entity
        const contentStateWithEntity = contentState.createEntity(
            'LINK',
            'MUTABLE',
            {url}
        );
        // 获取到刚才新建的entity
        const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
        // 把带有entity的contentState设置到editorState上
        const newEditorState = EditorState.set(editorState, { currentContent: contentStateWithEntity });
        // 把entity和选中的内容对应
        this.setState({
            editorState: RichUtils.toggleLink(
                newEditorState,
                newEditorState.getSelection(),
                entityKey
            ),
            url: '',
            }, () => {
            setTimeout(() => this.refs.editor.focus(), 0);
        });
    }

    /**
     * 链接改变
     *
     * @param {Object} event 事件
     */
    urlChange(event) {
        const target = event.target;
        this.setState({
            url: target.value
        });
    }

    render() {
        return (
            <div>
                链接编辑器
                <div className="tools">
                    <Input value={this.state.url} onChange={this.urlChange}></Input>
                    <Button className="addlink" onClick={this.addLink}>addLink</Button>
                </div>
                <div className="editor">
                    <Editor
                        editorState={this.state.editorState}
                        onChange={this.onChange}
                        ref="editor"/>
                </div>
            </div>
        )
    }
}

```

[在线示例](https://marxjiao.com/draft-demo/#/linkEditor)

[示例代码](https://github.com/MarxJiao/draft-demo/blob/master/src/components/LinkEditor/index.js)

# 总结

draft.js提供了很多丰富的功能，还有自定义块级组件渲染，快捷键等功能本文没有提及。在使用过程中，感觉主要难点在decorator和entity的理解上。希望本文能够对你使用draft.js有所帮助。

开发了一些简单的demo供参考：https://marxjiao.com/draft-demo/

demo源码：https://github.com/MarxJiao/draft-demo

# 相关链接

[Draft.js官方文档](https://draftjs.org/docs/overview.html#content)

[Draft.js 在知乎的实践](https://zhuanlan.zhihu.com/p/24951621)