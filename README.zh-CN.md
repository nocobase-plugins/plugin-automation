# NocoBase 自动化插件

> 基于 NocoBase 的企业级自动化插件框架 - 触发器 → 执行器 → 动作器

## 📋 简介

NocoBase Automation Plugin 是一个**"插件的插件系统"**，通过基于触发器的工作流系统为 NocoBase 提供完整的自动化扩展能力。

### 核心能力

- 🚀 **动作触发系统** - 为表单和表格提供可自定义的动作按钮，触发自动化工作流
- 🎯 **事件注册机制** - 组件级别的事件注册系统，支持onClick等触发器
- 🔧 **配置界面** - 可视化自动化配置，支持自定义标题编辑
- 🔌 **开放API** - 通过 `useAutomation` Hook 提供完整的第三方插件扩展接口

### 设计理念

```
用户点击/事件 → 自动化触发 → 工作流执行
     ↓            ↓           ↓
   动作按钮   →   事件处理   →   自动化
```

### 内置动作类型

1. **表格行动作** - 用于表格行操作的自动化触发器
2. **通用表单动作** - 用于表单和通用页面操作的自动化触发器

## 🚀 快速上手

### 使用内置动作组件

插件提供了可直接使用的动作组件，可以添加到表单和表格中：

1. **添加到表单**：进入表单设计模式 → 配置操作 → 选择"自动化"
2. **添加到表格**：进入表格设计模式 → 配置操作 → 选择"自动化"  
3. **自定义标题**：点击动作按钮设置 → 编辑按钮标题
4. **配置自动化**：点击动作按钮设置 → 配置自动化工作流

### 自定义组件集成

```jsx
import { useAutomation } from '@nocobase/plugin-automation';

const MyCustomComponent = () => {
  const { trigger } = useAutomation();
  
  const handleClick = () => {
    trigger('onClick', { 
      rawEvent: event,
      customData: 'my-data' 
    });
  };
  
  return (
    <button onClick={handleClick}>
      自定义自动化触发器
    </button>
  );
};
```

### 注册组件事件

```jsx
import { registerAutomationEvents } from '@nocobase/plugin-automation';

// 为你的组件注册事件
registerAutomationEvents('MyComponent', [
  {
    key: 'onClick',
    label: '点击时',
    description: '当组件被点击时触发'
  },
  {
    key: 'onSubmit', 
    label: '提交时',
    description: '当表单被提交时触发'
  }
]);
```

## 🏗️ 架构概览

插件采用三层架构设计：

### 1. 触发器层
- **动作组件**: `TableOpAction`, `GeneralAction` - 即用型UI组件
- **事件注册**: `registerAutomationEvents()` 用于自定义组件集成
- **触发器钩子**: `useAutomation()` 提供触发函数

### 2. 执行器层  
- **内置执行器**: `EchoExecutor`, `HttpExecutor` 用于数据处理
- **基础类**: `BaseExecutor` 用于创建自定义执行器
- **配置界面**: 每个执行器的可视化配置接口

### 3. 动作器层
- **内置动作器**: `MessageAction`, `ConsoleAction`, `ModalAction`, `PopoverAction`, `FormValueSetterAction`
- **基础类**: `BaseAction` 用于创建自定义动作器  
- **执行**: 最终步骤动作如UI更新、通知、数据操作

## 🔧 自定义开发

### 创建自定义执行器

```typescript
import { BaseExecutor } from '@nocobase/plugin-automation';
import { ExecutionContext } from '@nocobase/plugin-automation';
import React from 'react';

class MyCustomExecutor extends BaseExecutor {
  key = 'my-custom-executor';
  label = '我的自定义执行器';
  description = '自定义数据处理执行器';
  
  // 核心执行函数 - 由插件内部调用
  async execute(triggerParams: any, context: ExecutionContext): Promise<any> {
    console.log('触发参数:', triggerParams);
    console.log('配置:', context.config);
    
    // 在这里编写你的自定义逻辑
    const result = {
      processed: true,
      data: triggerParams,
      timestamp: Date.now()
    };
    
    return result;
  }
  
  // 可选的配置组件 - 供用户配置此执行器
  ConfigComponent = ({ value, onChange }) => (
    <div>
      <input 
        placeholder="配置值"
        value={value?.setting || ''}
        onChange={(e) => onChange({ ...value, setting: e.target.value })}
      />
    </div>
  );
}
```

### 创建自定义动作器

```typescript
import { BaseAction } from '@nocobase/plugin-automation';
import { ExecutionContext } from '@nocobase/plugin-automation';
import React from 'react';

class MyCustomAction extends BaseAction {
  key = 'my-custom-action';
  label = '我的自定义动作器';
  description = '自定义动作器实现';
  
  // 核心执行函数 - 由插件内部调用
  async execute(triggerParams: any, executorResult: any, context: ExecutionContext): Promise<void> {
    console.log('触发参数:', triggerParams);
    console.log('执行器结果:', executorResult);
    console.log('动作配置:', context.values);
    
    // 在这里编写你的自定义动作逻辑
    // 例如：更新UI、发送通知、修改数据等
  }
  
  // 可选的配置组件 - 供用户配置此动作器
  ConfigComponent = ({ value, onChange }) => (
    <div>
      <input 
        placeholder="动作配置"
        value={value?.message || ''}
        onChange={(e) => onChange({ ...value, message: e.target.value })}
      />
    </div>
  );
}

```javascript
import { BaseAction } from '@nocobase/plugin-automation';
import React from 'react';

class EmailAction extends BaseAction {
  key = 'send-email';
  label = '发送邮件';
  description = '发送邮件通知';
  
  // 核心执行函数 - 由插件内部调用
  async execute(triggerParams, executorResult, context) {
    const { template, subject } = this.config; // 从用户配置读取
    const { recipient } = triggerParams; // 从触发器获取
    
    // 使用执行器结果生成邮件内容
    const content = this.renderTemplate(template, {
      trigger: triggerParams,
      executor: executorResult,
      context
    });
    
    await emailService.send({
      to: recipient,
      subject,
      html: content
    });
  }
  
  // 配置组件 - 供用户配置此动作器
  ConfigComponent = ({ value, onChange }) => (
    <div>
      <input 
        placeholder="邮件主题"
        value={value?.subject || ''}
        onChange={(e) => onChange({ ...value, subject: e.target.value })}
      />
      <textarea 
        placeholder="邮件模板 (支持 {{trigger.data}} {{executor.result}} 等变量)"
        value={value?.template || ''}
        onChange={(e) => onChange({ ...value, template: e.target.value })}
      />
    </div>
  );
}

// 注册你的自定义执行器
import { executorRegistry } from '@nocobase/plugin-automation';
executorRegistry.register(new MyCustomExecutor());

// 注册你的自定义动作器
import { actionRegistry } from '@nocobase/plugin-automation';
actionRegistry.register(new MyCustomAction());
```

### 插件集成

要将自动化系统集成到你的NocoBase插件中：

```typescript
import { Plugin } from '@nocobase/client';
import { executorRegistry, actionRegistry } from '@nocobase/plugin-automation';

class MyPlugin extends Plugin {
  async load() {
    // 注册自定义执行器和动作器
    executorRegistry.register(new MyCustomExecutor());
    actionRegistry.register(new MyCustomAction());
    
    // 将自动化动作添加到你的schema初始化器中
    this.app.schemaInitializerManager.addItem(
      'myPlugin:configureActions',
      'automation',
      {
        name: 'automation',
        title: '自动化',
        Component: 'GeneralActionInitializer', // 或使用 'TableOpActionInitializer' 用于表格操作
      }
    );
  }
}
```

## 📦 内置组件

### 动作组件
- **TableOpAction**: 用于表格行操作的自动化触发器，支持自定义标题
- **GeneralAction**: 用于表单和通用页面操作的自动化触发器，支持自定义标题

### 执行器
- **EchoExecutor**: 原样返回输入数据（用于测试和调试）
- **HttpExecutor**: 发送HTTP请求，支持完整配置（URL、方法、请求头、参数、请求体）

### 动作器
- **MessageAction**: 显示消息提示
- **ConsoleAction**: 控制台输出日志
- **ModalAction**: 打开模态对话框
- **PopoverAction**: 显示弹窗内容
- **FormValueSetterAction**: 更新表单字段值

## 🔌 外部集成

```javascript
// 获取系统状态（仅用于调试和监控）
const status = automation.getStatus();
console.log('已注册执行器:', status.executors.keys);
console.log('已注册动作器:', status.actions.keys);

// 注册完成后，执行调度由自动化插件内部处理
// 用户只需通过UI配置工作流，无需编程调用
```

## 🛠️ 最佳实践

### 命名规范
- 执行器: `{类别}-{功能}` (如: `http-request`)
- 动作器: `{动作}-{目标}` (如: `send-email`)
- 触发器: `{来源}-{事件}` (如: `button-click`)

### 错误处理
```javascript
async execute(params, context) {
  try {
    // 参数验证
    if (!params.url) throw new Error('URL不能为空');
    
    // 执行逻辑
    const result = await this.doWork(params);
    
    return result;
  } catch (error) {
    console.error(`${this.key} 执行失败:`, error);
    throw error;
  }
}
```

## � 工作原理

1. **外部插件注册** - 提供executor/action实现和配置组件
2. **用户配置** - 通过统一UI配置工作流（选择触发条件、执行器、动作器）
3. **自动执行** - 当触发条件满足时，插件内部自动调度执行配置的automation
4. **上下文传递** - 触发器数据 → 执行器处理 → 动作器执行，完整的数据流

外部插件**无需关心调度逻辑**，只专注于提供优质的执行器和动作器实现。

## �📚 相关文档

- [详细API文档](./docs/external-api.md)
- [完整使用示例](./docs/external-api-examples.tsx)
- [NocoBase插件开发](https://docs.nocobase.com/development)

---

让自动化变得简单而强大 🚀