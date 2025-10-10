# 自动化编译系统使用指南

## 🎯 设计理念

这是一个类似NocoBase `compile`的通用工具函数，专门为自动化系统设计。它解决了一个普适需求：**在自动化系统的任何配置中都能使用变量替换**。

## 🔧 核心API

### compileAutomation(template, context)
编译单个模板字符串中的变量

### compileAutomationObject(obj, context) 
批量编译对象中所有字符串值的变量

### createAutomationCompileContext(triggerParams, executorResult, executionContext)
创建标准的编译上下文

## 📝 变量语法  

使用 `{{...}}` 包裹变量表达式：

```
{{$trigger.userId}}           // 触发器数据
{{$executor.response.data}}   // 执行器结果  
{{$context.user.name}}        // 执行上下文
{{$form.fieldName}}           // 表单数据
{{$utils.formatDate($trigger.date)}}  // 工具函数
```

## 🚀 使用场景

### 1. HTTP执行器配置

用户在配置HTTP执行器时，所有字段都支持变量：

**URL字段：**
```
https://api.example.com/users/{{$trigger.userId}}/profile
```

**请求头：**
```
Name: Authorization
Value: Bearer {{$trigger.token}}
```

**请求参数：**
```
Name: timestamp  
Value: {{$utils.formatDate($context.timestamp)}}
```

**请求体：**
```json
{
  "userId": "{{$trigger.userId}}",
  "action": "{{$trigger.action}}",
  "timestamp": "{{$system.timestamp}}"
}
```

### 2. Modal Action配置

**标题：**
```
{{$executor.success ? '操作成功' : '操作失败'}}
```

**内容：**
```
HTTP请求完成！

执行状态：{{$executor.success}}
响应状态：{{$executor.response.status}}
用户信息：{{$trigger.user.name}}
执行时间：{{$utils.formatDate($context.timestamp)}}

响应数据：
{{$executor.response.data}}
```

### 3. 其他Action/Executor配置

所有自定义的执行器和动作器都可以使用这个编译系统：

```typescript
// 在任何执行器/动作器中
const compileContext = createAutomationCompileContext(triggerParams, executorResult, context);
const compiledConfig = compileAutomationObject(context.config, compileContext);
```

## 🛠️ 实现示例

### HttpExecutor中的使用

```typescript
async execute(triggerParams: any, context: ExecutionContext): Promise<any> {
  // 创建编译上下文
  const compileContext = createAutomationCompileContext(triggerParams, null, context);
  
  // 编译整个配置对象
  const rawConfig = context.config || {};
  const config = compileAutomationObject(rawConfig, compileContext);
  
  // 现在config中的所有字符串都已经处理了变量替换
  const { method, url, headers, params, data } = config;
  
  // 直接使用编译后的值
  const requestConfig = {
    method: method.toUpperCase(),
    url: url,  // 已经处理过变量
    headers: this.buildHeaders(headers),  // headers中的值已处理过变量
    params: this.buildParams(params),     // params中的值已处理过变量
  };
}
```

### ModalAction中的使用

```typescript
private renderContent(content: string, type: string, triggerParams?: any, executorResult?: any, context?: ExecutionContext) {
  // 创建编译上下文
  const compileContext = createAutomationCompileContext(triggerParams, executorResult, context);
  
  // 编译内容
  const compiledContent = compileAutomation(content, compileContext);
  
  return <div>{compiledContent}</div>;
}
```

## 🎨 优势特性

### 1. 普适性
- **HTTP执行器**：URL、请求头、参数、请求体都支持变量
- **Modal动作**：标题、内容都支持变量  
- **自定义执行器/动作**：任何配置字段都可以支持变量

### 2. 类型安全
```typescript
interface AutomationCompileContext {
  $trigger?: any;      // 触发器数据
  $executor?: any;     // 执行器结果
  $context?: any;      // 执行上下文
  $form?: any;         // 表单数据
  $custom?: any;       // 自定义数据
  $user?: any;         // 用户数据
  $system?: any;       // 系统数据
}
```

### 3. 工具函数支持
```typescript
$utils: {
  formatDate: (date, format?) => string,
  formatJSON: (obj, space?) => string,
  isNull: (value) => boolean,
  isUndefined: (value) => boolean,
  isEmpty: (value) => boolean
}
```

### 4. 安全执行
- 使用Function构造器创建安全沙盒
- 只暴露安全的全局对象（Math、Date、JSON等）
- 错误时优雅降级，返回原始表达式

## 📊 实际应用场景

### 场景1：动态API调用
```
触发器：表单提交，携带 { userId: 123, action: 'update' }
HTTP执行器配置：
  URL: https://api.example.com/users/{{$trigger.userId}}/{{$trigger.action}}
  方法: POST
  请求体: {"timestamp": "{{$system.timestamp}}"}
```

### 场景2：条件化响应显示
```
执行器返回：{ success: true, data: { message: "操作成功" } }
Modal动作配置：
  标题: {{$executor.success ? '成功' : '失败'}}
  内容: 操作结果：{{$executor.data.message}}
         执行时间：{{$utils.formatDate($context.timestamp)}}
```

### 场景3：复杂数据处理
```
触发器：{ user: { name: "张三", id: 123 }, filters: { status: "active" } }
HTTP执行器配置：
  URL: https://api.example.com/users
  参数:
    - name: user_id, value: {{$trigger.user.id}}  
    - name: status, value: {{$trigger.filters.status}}
    - name: timestamp, value: {{$utils.formatDate(new Date())}}
```

这个设计让整个自动化系统具有了强大的动态配置能力，用户可以在任何地方使用变量，实现真正灵活的自动化流程！🎉