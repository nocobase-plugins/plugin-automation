# Automation Plugin - External API Documentation

## 概述

NocoBase Automation Plugin 提供了一个完整的自动化框架，允许其他插件通过标准API扩展触发器、执行器和动作器功能。

## 核心设计理念

- **插件的插件系统**: 作为微型插件框架，为自动化功能提供统一的扩展接口
- **开放性**: 通过 `usePlugin` hook 让外部插件无缝集成
- **可扩展性**: 标准化的抽象接口，支持各种自定义实现
- **协调调度**: 统一管理整个自动化流程的执行

## 快速开始

### 在外部插件中使用

```typescript
import { Plugin, usePlugin } from '@nocobase/client';
import { PluginAutomation } from '@nocobase/plugin-automation';

export class MyPlugin extends Plugin {
  async load() {
    // 获取自动化插件实例
    const automationPlugin = this.app.getPlugin(PluginAutomation);
    
    if (automationPlugin) {
      // 现在可以使用所有自动化API
    }
  }
}
```

### 在组件中使用

```typescript
import { usePlugin } from '@nocobase/client';
import { PluginAutomation } from '@nocobase/plugin-automation';

const MyComponent = () => {
  const automationPlugin = usePlugin(PluginAutomation);
  
  // 使用自动化API
};
```

## API 参考

### AutomationManager

核心管理器，提供所有自动化功能的访问入口。

#### 属性

- `triggers`: 触发器管理API
- `executors`: 执行器管理API  
- `actions`: 动作器管理API

#### 方法

- `getStatus()`: 获取系统状态（用于调试和监控）

#### 注意事项

外部插件**不能直接调用工作流执行方法**。所有的工作流执行都由系统内部的 `useAutomation` hook 根据用户配置自动调度。外部插件只需要：

1. 注册自己的触发器、执行器、动作器实现
2. 触发相应的自动化事件
3. 让系统根据用户配置自动处理执行流程

### 触发器 API (triggers)

#### 注册触发器
```typescript
automationPlugin.triggers.register({
  key: 'my-trigger',
  displayName: 'MyTrigger', 
  getSupportedEvents: () => [...]
});
```

#### 其他方法
- `unregister(key)`: 取消注册
- `get(key)`: 获取触发器
- `getAll()`: 获取所有触发器
- `has(key)`: 检查是否存在

### 执行器 API (executors)

#### 注册执行器
```typescript
class MyExecutor extends BaseExecutor {
  key = 'my-executor';
  label = '我的执行器';
  
  async execute(triggerParams, context) {
    // 执行逻辑
    return result;
  }
}

automationPlugin.executors.register(new MyExecutor());
```

#### 执行执行器
```typescript
const result = await automationPlugin.executors.execute(
  'my-executor', 
  triggerParams, 
  context
);
```

#### 其他方法
- `unregister(key)`: 取消注册
- `get(key)`: 获取执行器
- `getAll()`: 获取所有执行器
- `has(key)`: 检查是否存在

### 动作器 API (actions)

#### 注册动作器
```typescript
class MyAction extends BaseAction {
  key = 'my-action';
  label = '我的动作器';
  
  async execute(triggerParams, executorResult, context) {
    // 动作逻辑
  }
}

automationPlugin.actions.register(new MyAction());
```

#### 执行动作器
```typescript
await automationPlugin.actions.execute(
  'my-action',
  triggerParams,
  executorResult, 
  context
);
```

#### 批量执行
```typescript
await automationPlugin.actions.executeMultiple(
  ['action1', 'action2'],
  triggerParams,
  executorResult,
  context
);
```

#### 其他方法
- `unregister(key)`: 取消注册
- `get(key)`: 获取动作器
- `getAll()`: 获取所有动作器
- `has(key)`: 检查是否存在

### 自动化工作流

自动化系统的工作流程：触发器 → 执行器 → 动作器

**重要说明**: 外部插件**不能直接调用工作流执行**。正确的使用方式是：

1. **注册阶段**: 插件注册自己的触发器、执行器、动作器
2. **配置阶段**: 用户通过UI配置工作流（选择组合）
3. **执行阶段**: 当触发事件发生时，系统自动根据配置执行工作流

```typescript
// ❌ 错误：外部插件不应该直接调用执行方法
// const result = await automationPlugin.executeWorkflow({...});

// ✅ 正确：外部插件只负责注册和触发事件
// 系统内部会根据用户配置自动执行相应的工作流
```

### 系统状态

获取当前系统中注册的所有组件信息：

```typescript
const status = automationPlugin.getStatus();
// {
//   triggers: { total: 5, keys: ['...'] },
//   executors: { total: 3, keys: ['...'] },
//   actions: { total: 8, keys: ['...'] }
// }
```

## 扩展开发指南

### 创建自定义执行器

```typescript
import { BaseExecutor, ExecutionContext } from '@nocobase/plugin-automation';

export class HttpRequestExecutor extends BaseExecutor {
  key = 'http-request';
  label = 'HTTP请求';
  description = '发送HTTP请求';

  async execute(triggerParams: any, context: ExecutionContext) {
    const { url, method, data } = triggerParams;
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  }
}
```

### 创建自定义动作器

```typescript
import { BaseAction, ExecutionContext } from '@nocobase/plugin-automation';

export class EmailAction extends BaseAction {
  key = 'send-email';
  label = '发送邮件';
  description = '发送邮件通知';

  async execute(triggerParams: any, executorResult: any, context: ExecutionContext) {
    const { recipient, subject, template } = triggerParams;
    
    // 使用执行器结果动态生成邮件内容
    const content = this.renderTemplate(template, executorResult);
    
    await this.sendEmail({
      to: recipient,
      subject,
      content
    });
  }

  private renderTemplate(template: string, data: any): string {
    // 模板渲染逻辑
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }
}
```

### 创建自定义触发器组件

```typescript
import { withTriggerEvents } from '@nocobase/plugin-automation';

const CustomButton = withTriggerEvents(
  ({ children, onCustomClick, ...props }) => {
    return (
      <button 
        onClick={onCustomClick}
        {...props}
      >
        {children}
      </button>
    );
  },
  [
    {
      key: 'onClick',
      label: '点击时',
      description: '按钮被点击时触发'
    }
  ]
);
```

## 最佳实践

### 1. 命名约定
- 执行器key: `{category}-{function}` (如: `http-request`, `data-transform`)
- 动作器key: `{action}-{target}` (如: `send-email`, `update-record`)
- 组件key: `{plugin}-{component}` (如: `workflow-button`, `custom-input`)

### 2. 错误处理
```typescript
async execute(triggerParams: any, context: ExecutionContext) {
  try {
    // 执行逻辑
    return result;
  } catch (error) {
    console.error(`Executor ${this.key} failed:`, error);
    throw new Error(`执行失败: ${error.message}`);
  }
}
```

### 3. 参数验证
```typescript
async execute(triggerParams: any, context: ExecutionContext) {
  if (!triggerParams.url) {
    throw new Error('URL参数不能为空');
  }
  
  // 继续执行...
}
```

### 4. 插件生命周期管理
```typescript
export class MyAutomationPlugin extends Plugin {
  private registeredComponents: string[] = [];

  async load() {
    const automationPlugin = this.app.getPlugin(PluginAutomation);
    
    if (automationPlugin) {
      // 注册组件
      const executor = new MyExecutor();
      automationPlugin.executors.register(executor);
      this.registeredComponents.push(executor.key);
    }
  }

  async remove() {
    // 清理注册的组件
    const automationPlugin = this.app.getPlugin(PluginAutomation);
    if (automationPlugin) {
      this.registeredComponents.forEach(key => {
        automationPlugin.executors.unregister(key);
      });
    }
  }
}
```

## 相关链接

- [基础类型定义](./src/client/core/types.ts)
- [使用示例](./docs/external-api-examples.tsx)
- [NocoBase 插件开发指南](https://docs.nocobase.com/development/your-fisrt-plugin)