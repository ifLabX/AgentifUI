# 北信大 SSO Ticket 处理与用户创建流程

本文档旨在说明 `app/api/sso/bistu/callback/route.ts` 如何处理来自北京信息科技大学 (BISTU) CAS 服务器的认证回调、解析 Ticket 返回的 XML 信息，并利用这些信息在系统中创建新用户。

## 核心流程

整个流程的核心在于 `casService.validateTicket` 方法，它负责与 CAS 服务器通信，验证 `ticket` 的有效性，并解析返回的用户信息。

### 1. 获取 Ticket

当用户在北信大 CAS 登录页面成功认证后，会被重定向回我们的应用。此时，回调 URL 的查询参数中会包含一个一次性 `ticket`。

```typescript
// app/api/sso/bistu/callback/route.ts
const ticket = requestUrl.searchParams.get('ticket');
```

### 2. 验证 Ticket 并获取用户信息

应用后端会调用 `casService.validateTicket(ticket, serviceUrl)` 方法。此方法向 CAS 服务器的 `/serviceValidate` 端点发起一个后端请求，请求中包含 `ticket` 和我们的服务地址 (`serviceUrl`)，用于验证 `ticket` 的合法性。

### 3. 解析 XML 响应

CAS 服务器验证成功后，会返回一个 XML 格式的响应。`validateTicket` 方法负责解析这个 XML。

一个成功的响应示例如下：

```xml
<cas:serviceResponse xmlns:cas='http://www.yale.edu/tp/cas'>
    <cas:authenticationSuccess>
        <cas:user>2022010001</cas:user>
        <cas:attributes>
            <cas:usertype>TEACHER</cas:usertype>
            <cas:name>张三</cas:name>
            <cas:gid>2022010001</cas:gid>
            <cas:username>zhangsan</cas:username>
        </cas:attributes>
    </cas:authenticationSuccess>
</cas:serviceResponse>
```

`validateTicket` 方法会从 XML 中提取关键信息，并组装成一个 `userInfo` 对象，其结构大致如下：

```typescript
{
  success: true,
  username: '2022010001', // <cas:user> 字段，通常是学工号
  employeeNumber: '2022010001', // <cas:gid> 字段，学工号
  attributes: {
    name: '张三',       // 真实姓名
    username: 'zhangsan', // 登录用户名
    // ... 其他属性
  },
  rawResponse: '<xml>...</xml>' // 原始XML响应，用于调试
}
```

### 4. 创建新用户

获取 `userInfo` 对象后，系统将执行以下操作来完成用户登录或注册：

#### a. 查找用户

使用从 XML 中解析出的 `employeeNumber` (学工号) 在本地数据库中查找是否已存在该用户。

```typescript
// app/api/sso/bistu/callback/route.ts
let user = await SSOUserService.findUserByEmployeeNumber(employeeNumberStr);
```

#### b. 准备新用户信息

如果用户不存在，系统将从 `userInfo` 对象中提取创建新用户所需的信息。特别地，它会优先使用 `userInfo.attributes.name` 作为用户的真实姓名 (`fullName`)。

```typescript
// app/api/sso/bistu/callback/route.ts
const realName = userInfo.attributes?.name || userInfo.username;
```

#### c. 调用创建服务

调用 `SSOUserService.createSSOUser` 方法，传入从 XML 解析出的信息（学工号、用户名、真实姓名等），在数据库中创建一条新的用户记录。

```typescript
// app/api/sso/bistu/callback/route.ts
user = await SSOUserService.createSSOUser({
  employeeNumber: employeeNumberStr,
  username: userInfo.username, // 通常是学工号
  fullName: realName, // 真实姓名
  ssoProviderId: ssoProvider.id,
});
```

## 流程总结

1.  **接收 Ticket**：从 CAS 服务器的回调 URL 中获取一次性 `ticket`。
2.  **后端验证**：应用后端携带 `ticket` 请求 CAS 服务器的验证接口。
3.  **解析 XML**：`bistu-cas-service` 服务解析 CAS 返回的 XML，提取出 `学工号`、`用户名` 和 `真实姓名` 等关键字段。
4.  **查找或创建用户**：
    - **查找**：使用 `学工号` 在本地数据库中查找用户。
    - **创建**：如果用户不存在，则利用从 XML 中解析出的信息自动创建新用户。
5.  **建立会话**：为找到的或新创建的用户建立应用内会话，完成整个 SSO 登录流程。

这个设计流程确保了用户身份的可靠验证，并实现了 CAS 系统用户数据向本应用数据库的自动同步。
