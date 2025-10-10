# NocoBase Automation Plugin

> Enterprise-grade automation plugin framework for NocoBase - Trigger → Executor → Action

## 📋 Introduction

NocoBase Automation Plugin is a **"plugin for plugins system"** that provides complete automation extension capabilities for NocoBase through a trigger-based workflow system.

### Core Capabilities

- 🚀 **Action Trigger System** - Customizable action buttons for forms and tables that can trigger automation workflows
- 🎯 **Event Registration** - Component-level event registration system with onClick triggers
- 🔧 **Configuration Interface** - Visual automation configuration with custom title editing
- 🔌 **Open API** - Complete third-party plugin extension interface with `useAutomation` hook

### Design Philosophy

```
User Click/Event → Automation Trigger → Workflow Execution
       ↓                    ↓                   ↓
   Action Button    →   Event Handler    →   Automation
```

### Built-in Action Types

1. **Table Row Actions** - Automation triggers for table row operations
2. **General Form Actions** - Automation triggers for forms and general page actions

## 🚀 Quick Start

### Using Built-in Action Components

The plugin provides ready-to-use action components that can be added to forms and tables:

1. **Add to Forms**: Navigate to form design mode → Configure Actions → Select "Automation"
2. **Add to Tables**: Navigate to table design mode → Configure Actions → Select "Automation"  
3. **Customize Title**: Click the action button settings → Edit button title
4. **Configure Automation**: Click the action button settings → Configure automation workflow

### Custom Component Integration

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
      Custom Automation Trigger
    </button>
  );
};
```

### Registering Component Events

```jsx
import { registerAutomationEvents } from '@nocobase/plugin-automation';

// Register events for your component
registerAutomationEvents('MyComponent', [
  {
    key: 'onClick',
    label: 'On Click',
    description: 'Triggered when component is clicked'
  },
  {
    key: 'onSubmit', 
    label: 'On Submit',
    description: 'Triggered when form is submitted'
  }
]);
```

## 🏗️ Architecture Overview

The plugin follows a three-layer architecture:

### 1. Trigger Layer
- **Action Components**: `TableOpAction`, `GeneralAction` - Ready-to-use UI components
- **Event Registration**: `registerAutomationEvents()` for custom component integration
- **Trigger Hook**: `useAutomation()` provides the trigger function

### 2. Executor Layer  
- **Built-in Executors**: `EchoExecutor`, `HttpExecutor` for data processing
- **Base Class**: `BaseExecutor` for creating custom executors
- **Configuration**: Visual configuration interface for each executor

### 3. Action Layer
- **Built-in Actions**: `MessageAction`, `ConsoleAction`, `ModalAction`, `PopoverAction`, `FormValueSetterAction`
- **Base Class**: `BaseAction` for creating custom actions  
- **Execution**: Final step actions like UI updates, notifications, data operations

## 🔧 Custom Development

### Creating Custom Executors

```typescript
import { BaseExecutor } from '@nocobase/plugin-automation';
import { ExecutionContext } from '@nocobase/plugin-automation';
import React from 'react';

class MyCustomExecutor extends BaseExecutor {
  key = 'my-custom-executor';
  label = 'My Custom Executor';
  description = 'Custom data processing executor';
  
  // Core execution function - called internally by the plugin
  async execute(triggerParams: any, context: ExecutionContext): Promise<any> {
    console.log('Trigger Params:', triggerParams);
    console.log('Config:', context.config);
    
    // Your custom logic here
    const result = {
      processed: true,
      data: triggerParams,
      timestamp: Date.now()
    };
    
    return result;
  }
  
  // Optional configuration component - for users to configure this executor
  ConfigComponent = ({ value, onChange }) => (
    <div>
      <input 
        placeholder="Configuration value"
        value={value?.setting || ''}
        onChange={(e) => onChange({ ...value, setting: e.target.value })}
      />
    </div>
  );
}
```

### Creating Custom Actions

```typescript
import { BaseAction } from '@nocobase/plugin-automation';
import { ExecutionContext } from '@nocobase/plugin-automation';
import React from 'react';

class MyCustomAction extends BaseAction {
  key = 'my-custom-action';
  label = 'My Custom Action';
  description = 'Custom action implementation';
  
  // Core execution function - called internally by the plugin
  async execute(triggerParams: any, executorResult: any, context: ExecutionContext): Promise<void> {
    console.log('Trigger Params:', triggerParams);
    console.log('Executor Result:', executorResult);
    console.log('Action Config:', context.values);
    
    // Your custom action logic here
    // e.g., update UI, send notifications, modify data, etc.
  }
  
  // Optional configuration component - for users to configure this action
  ConfigComponent = ({ value, onChange }) => (
    <div>
      <input 
        placeholder="Action configuration"
        value={value?.message || ''}
        onChange={(e) => onChange({ ...value, message: e.target.value })}
      />
    </div>
  );
}
```

### Registering Custom Components

```typescript
// Register your custom executor
import { executorRegistry } from '@nocobase/plugin-automation';
executorRegistry.register(new MyCustomExecutor());

// Register your custom action
import { actionRegistry } from '@nocobase/plugin-automation';
actionRegistry.register(new MyCustomAction());
```

### Plugin Integration

To integrate the automation system into your NocoBase plugin:

```typescript
import { Plugin } from '@nocobase/client';
import { executorRegistry, actionRegistry } from '@nocobase/plugin-automation';

class MyPlugin extends Plugin {
  async load() {
    // Register custom executors and actions
    executorRegistry.register(new MyCustomExecutor());
    actionRegistry.register(new MyCustomAction());
    
    // Add automation actions to your schema initializers
    this.app.schemaInitializerManager.addItem(
      'myPlugin:configureActions',
      'automation',
      {
        name: 'automation',
        title: 'Automation',
        Component: 'GeneralActionInitializer', // or 'TableOpActionInitializer' for table actions
      }
    );
  }
}
```

## 📚 Built-in Components

### Executors
- **EchoExecutor**: Returns input data as-is (for testing)
- **HttpExecutor**: Makes HTTP requests with full configuration support

### Actions  
- **MessageAction**: Shows toast messages
- **ConsoleAction**: Logs to browser console
- **ModalAction**: Opens modal dialogs
- **PopoverAction**: Shows popover content
- **FormValueSetterAction**: Updates form field values

## 🔧 Advanced Features

### Variable Interpolation
The plugin supports variable interpolation in configurations using `{{variable}}` syntax:

```json
{
  "url": "{{context.baseUrl}}/api/users/{{triggerParams.userId}}",
  "message": "Hello {{triggerParams.username}}!"
} 
        placeholder="Email Subject"
        value={value?.subject || ''}
        onChange={(e) => onChange({ ...value, subject: e.target.value })}
      />
      <textarea 
        placeholder="Email Template (supports {{trigger.data}} {{executor.result}} variables)"
        value={value?.template || ''}
        onChange={(e) => onChange({ ...value, template: e.target.value })}
      />
    </div>
  );
}
```

## 📦 Built-in Components

### Action Components
- **TableOpAction**: Automation triggers for table row operations with customizable titles
- **GeneralAction**: Automation triggers for forms and general page actions with customizable titles

### Executors
- **EchoExecutor**: Returns input data as-is (for testing and debugging)
- **HttpExecutor**: Makes HTTP requests with full configuration support (URL, method, headers, params, body)

### Actions
- `ConsoleAction` - Console output
- `MessageAction` - Message notification
- `PopoverAction` - Popover display

## 🔌 External Integration

```javascript
// Get system status (for debugging and monitoring only)
const status = automation.getStatus();
console.log('Registered executors:', status.executors.keys);
console.log('Registered actions:', status.actions.keys);

// After registration, execution scheduling is handled internally by the automation plugin
// Users only need to configure workflows through UI, no programming calls required
```

## 🛠️ Best Practices

### Naming Conventions
- Executors: `{category}-{function}` (e.g., `http-request`)
- Actions: `{action}-{target}` (e.g., `send-email`)
- Triggers: `{source}-{event}` (e.g., `button-click`)

### Error Handling
```javascript
async execute(params, context) {
  try {
    // Parameter validation
    if (!params.url) throw new Error('URL cannot be empty');
    
    // Execution logic
    const result = await this.doWork(params);
    
    return result;
  } catch (error) {
    console.error(`${this.key} execution failed:`, error);
    throw error;
  }
}
```

## 💡 How It Works

1. **External Plugin Registration** - Provide executor/action implementations and configuration components
2. **User Configuration** - Configure workflows through unified UI (select trigger conditions, executors, actions)
3. **Automatic Execution** - When trigger conditions are met, the plugin internally auto-schedules execution of configured workflows
4. **Context Passing** - Trigger data → Executor processing → Action execution, complete data flow

External plugins **don't need to worry about scheduling logic**, just focus on providing quality executor and action implementations.

## 📚 Related Documentation

- [Detailed API Documentation](./docs/external-api.md)
- [Complete Usage Examples](./docs/external-api-examples.tsx)
- [NocoBase Plugin Development](https://docs.nocobase.com/development)

---

Making automation simple and powerful 🚀