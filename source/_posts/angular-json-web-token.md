---
title: angular使用Json Web Token进行用户验证
date: 2017-01-21 14:41:39
---
无状态认证很适合angular应用。Ryan Chenkie在博客中谈到利用JOSN Web Tokens实现这一点。——Victor Savkin

>TL;DR：像Angular开发的单页应用，在认证的时候遇到了一些挑战。大体来讲，传统的以session为基础的认证不适合利用接口传输数据的的单页应用，因为它需要服务端存在状态。在Angular应用（和一般的单页应用）中，使用JSON Web Tokens（简称JWTs）是一种很好的认证方式。继续阅读了解JWTs，或者查看Angular 2 Tour Secret Heroes，了解一个完整的Angular 2应用用户认证。

<!-- more -->

几乎所有的有价值的应用都需要一些方法来处理用户认证和授权。这在一个**往返的**应用中是很直接的。因为当用户登录时，先在数据库查询用户信息，储存一个session在服务器，返回cookie信息在浏览器，cookie信息会随着用户发送请求而发送到服务器，之后服务器检查session来验证用户身份。

这很适合传统的应用，但是不适合使用api传输数据的单页应用。应为spa是客户端应用，所以处理用户认证状态的概念也是有欺骗性的。基本上，我们需要用户的身份认证状态，尽管后端需要保持无状态。这在**往返的** 应用中不是一个问题，因为返回给用户的HTML和数据是在后端创建的，而后端能够检查用户是否是登录状态。但是，当我们使用rest full api的时候，使用session来追踪认证状态是一个坏实践。



## JSON Web Tokens——angular应用中的无状态认证
在angular应用中实现无状态认证的好方法是使用JSON Web Tokens(JWT)。JWT是一个开放的标准（RFC 7519），或许选择它作为认证机制最具有说服力的原因就是它可以被用来传输任意数据作为一个JSON 对象。因为JWTs在服务端注册了一个密钥，我们确信在Token里面的信息在任何时候都无法被篡改。如果JWT里面的**有效负载量**被篡改了，token就会无效，这也就意味着无法获取服务端上以往的数据。这就使得JWT成为用户传输信息的完美机制，它带给我们一个独特的优势：我们可以将所有我们的API要求的东西记入在内以确认用户是谁，以及他们需要多高级别的权限，在JWT到达之前API不需要知道他们的每一件事情。

JWT是什么样子的？下面就是个例子：

``` 
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ
```

JWTs包含三部分，每一个都附加`.`分隔符。这三部分是：

### Header
我们注册token算法和类型的地方

### Payload
JWT的本质。保持所有我们所有需要数据的JSON对象。所需数据包含注册在JWTs配置和我们想要的任意数据。

### Signature

Signature是签名动作发生的地方，为了得到签名，我们使用Base64URL编码头部，接着使用Base64URL编码payoad，然后把这段字符串和密钥一起使用哈希算法加密。token在服务端解码，需要以上信息。这就意味着如果谁想改变token中的信息，那将是很难做到的。
我们可以看下这个token在[Auth0's open source JWT debugger.
](https://jwt.io/)解码。


需要注意的是，虽然JWTs经过了数字注册，但是它们并没有被加密。尽管数字注册能够确保JWT内容不被篡改，但是他们不能被用来传递敏感信息，因为payload能够被类似jwt.io的调试工具轻松解码。

## 怎样在Angular应用中使用JWTs进行验证？

对于使用APIs数据接口的Angular应用，典型的场景如下：
1. 用户将自己的凭证发送到服务端，用数据库验证。如果所有信息都是对的，JWT就会被返回。
2. JWT以某种方式保存在用户的浏览器-local storage或cookie。
3. 如果JWT在浏览器中显示保存状态，这就说明用户目前是登录的。
4. JWT的过期时间不断被检查，以此保持在Angular应用的登录状态，从payload读取的用户详细信息展示在一些视图中，就像他们的profile。
5. 只有登录的用户才能进入受保护的前端路由，就像用户中心。
6. 当用户向API发起XHR请求获取被保护的资源，利用Bearer算法将JWT作为Authorization头发送，或者作为cookie发送。
7. 服务器中的中间件——配置了应用的密钥——检查JWT的有效性，如果有效，返回请求的资源。

幸运的是，已经有一些开源的库，帮助我们在Angular 1.x 和2中使用JWTs。这些库在功能上是不同的，但是他们有些功能能够：
* 解码JWT并读取它的payload
* 把JWT作为Authorization头附在XHR请求上
* 启动一个服务暴露方法来登录或者退出，并且检查当前用户的JWT是否到期。

### Angular 1.x
* angular-jwt by Auth0
* angular-jwt-auth by Spira
* Satellizer by Sahat Yalkabov

### Angular 2
* angular2-jwt by Auth0
* ng2-ui-auth by Ron Zeidman

也有很多用户验证的解决方案，能够为angular应用提供简单的设置用户登录和注册方法。这意味着我们不必再担心用户验证逻辑和为用户注册token。
* [Auth0 Lock](https://auth0.com/lock/?utm_source=angularjs_blog&utm_medium=gp&utm_campaign=angular_auth_done_right)
* [Firebase User Authentication](https://firebase.google.com/docs/auth/)

## 用户验证实践
现在我们知道了我们的Angular应用用户验证，但是在实践中会是怎么样的呢？让我们看一个在Angular 2应用中的例子吧。

# 为用户取回JWT并保存在local storage
为了取回用户JWT我们需要验证从数据库验证用户资格。如果所有事都检查过了，我们注册一个JWT并在请求中返回给前端。我们能用几乎所有的服务端语言或框架来完成这一任务。这有一些JWT库几乎涵盖了所有语言。

当注册token的逻辑设置好后，我们需要暴露出一个能发送验证请求的终点。做到这一点我们只需要发送一个常规的http请求。把这个逻辑放在一个能够注入的服务中，这样就能够在整个应用中重复使用。

```typescript
// auth.service.ts

import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';

@Injectable()
export class AuthService {

  constructor(private http: Http) {}

  login(credentials) {
    this.http.post('https://my-app.com/api/authenticate', credentials)
      .map(res => res.json())
      .subscribe(
        // We're assuming the response will be an object
        // with the JWT on an id_token key
        data => localStorage.setItem('id_token', data.id_token),
        error => console.log(error)
      );
  }
}
```

之后写个表单来输入用户信息，并且调用这个认证服务

```typescript
// login.component.ts

import { Component } from '@angular/core';
import { AuthService } from './auth.service';

interface Credentials {
  username: string,
  password: string
}
@Component({
  selector: 'login',
  template: `
    <form #f="ngForm" (ngSubmit)="onLogin(f.value)" *ngIf="!auth.loggedIn()">
      <input type="text" placeholder="username" ngControl="username">
      <input type="password" placeholder="password" ngControl="password">
      <button type="submit">Submit</button>    
    </form>
  `
})

export class LoginComponent {

  credentials: Credentials;

  constructor(private auth: AuthService) {}

  onLogin(credentials) {
    this.auth.login(credentials);
  }
}
```
当认证成功后，用户的JWT就会被保存在local storage里。

能看到我们在表单上设置了*ngIf条件，来监控认证服务里的`loggedIn`方法。让我们继续开看。

### 检查没过期的Token

在无状态的用户验证中，前端唯一关心的是用户的JWT有没有过期。毫无疑问前端要检查JWT有没有过期，并且是否可用。然而，做这种检查，前端需要知道注册JWT的密钥，然而我们并不想把密钥暴露出来。检查token是否可用是非常有用的，如果token无效了，那么将不能访问到受保护的api资源。

我们能从[angular2-jwt](https://github.com/auth0/angular2-jwt)的`tokenNotExpired`方法中获取一些帮助，来验证这个。

```shell
npm install angular2-jwt
```

```typescript
// auth.service.ts

import { tokenNotExpired } from 'angular2-jwt';

...

loggedIn() {
  return tokenNotExpired();
}

...
```
这个函数简单地检查了JWT是否过期，如果没过期的话就返回`true`。

### 限制认证用户的路由

我们已经知道了一些方法来为没有jwt或者jwt过期的用户隐藏一些链接低着和导航元素。
然而用户依然能够通过手动输入uri的方式进入那些链接，所以我们需要一些方法来限制用户路由。为了做到这点，我们需要设置一个`AuthGuard`服务来检查用户是否有权限进入某个路由。
我们需要通过在设置路由的时候的`CanActivate`方法，来验证用户权限。

```typescript
// auth-guard.service.ts

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivate } from '@angular/router';
import { Auth } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(private auth: Auth, private router: Router) {}

  canActivate() {
    if(this.auth.loggedIn()) {
      return true;
    } else {
      this.router.navigateByUrl('/unauthorized');
      return false;
    }
  }
}
```

当路由改变的时候，`AuthGuard`会调用`AuthService`去检查当前的JWT是否存在和是否有效，如果存在并且有效，才能进入路由。如果无效，就会跳转到'unauthorized'页面。

`AuthGuard`需要在确认路由是否为私有路由时调用，并且在旅游的配置中配置好。

```typescript
...

import { AuthGuard } from './auth-guard.service';

export const routes: RouterConfig = [
  { path: 'admin', component: AdminComponent, canActivate: [AuthGuard] },
  { path: 'unauthorized', component: UnauthorizedComponent }
];

...
```

### 发送认证请求
在应用中使用用户认证的最后一个大的步骤就是把用户的JWT作为认证信息通过http请求头发送出去。Angular 2不像Angular 1.x那样拦截http请求，所以我们只需要在每个请求的option里发送请求头，或者自动发送http请求。Angular2-jwt提供了`AuthHttp`方法来做后面的事情。

```typescript
// secure-stuff.component.ts

import { Component } from '@angular/core';
import { AuthHttp, tokenNotExpired } from 'angular2-jwt';
import 'rxjs/add/operator/map';

@Component({
  selector: 'secure-stuff',
  template: `
    <button (click)="getSecureStuff()">Get Secure Stuff!</button>
  `
})
export class SecureStuffComponent {

  stuff: [];

  constructor(private authHttp: AuthHttp) {}

  getSecureStuff() {
    this.authHttp.get('https://my-app.com/api/secure-stuff')
      .map(res => res.json())
      .subscribe(
        data =>  this.stuff = data.stuff,
        error => console.log(error)
      );
  }
}
```
> 所有使用JWT的应用都应该使用HTTPS协议来防止token被恶意拦截。

### 退出帐号

对于使用JWT的无状态验证，只需要删除local storage中的token就能使用户登出。

```typescript
// auth.service.ts

...

@Injectable()
export class AuthService {

  ...

  logout() {
    localStorage.removeItem('id_token'); 
  }
}
```

你可能会担心这样是否安全，我们只是把JWT从本地删除了，但它还能够在api中使用。我们使用两种方法来解决这个担忧：
1. 给jwt设置一个短的过期时间
2. 在服务端给jwt设置黑名单

短的过期时间能让jwt不会长期有效，加黑名单能使jwt访问到受保护资源的能力被吊销。


## 完整的例子：Angular 2 Tour of Secret Heroes

所有的这些都被应用到商业软件中是非常好的。为了这个，我fork了John Papa的Tour of Heroes app（在angular2的起步教程中使用的），起名叫做[Angular 2 Tour of Secret Heroes](https://github.com/auth0-blog/angular2-tour-of-heroes)。在这个应用里所有的英雄的原始数据，加上一个新的秘密英雄，已经被移动到了一个Express服务器里。身份验证使用[Auth0](https://auth0.com/signup/?utm_source=angularjs_blog&utm_medium=gp&utm_campaign=angular_auth_done_right)，并且使用angular2-jwt来保护路由和有条件的展示一些UI元素，和发送认证的http请求。

## 总结
无状态的身份验证相对于传统的基于session的身份验证有明显的优势。保持api无状态可以让我们方便地移植应用到其它平台，比如移动端或者桌面应用。使用像angular2-jwt这样的应用，我们能轻松检查token的有效性，和发送验证请求，只需要一些配置。

如果你对[adding authentication to an Angular 1.x app](https://auth0.com/blog/handling-jwts-on-angular-is-finally-easier/?utm_source=angularjs_blog&utm_medium=gp&utm_campaign=angular_auth_done_right)感兴趣，这里说的内容依然适用，只是要记住一些不同。例如，Angular 1.x有http拦截，能被用来在http请求头中加入验证信息，这样就不需要再封装&http请求服务了。

更多关于angular 1.x和angular 2 用户验证的文章或者教程，请查看[Auth0 blog](https://auth0.com/blog/?utm_source=angularjs_blog&utm_medium=gp&utm_campaign=angular_auth_done_right)。