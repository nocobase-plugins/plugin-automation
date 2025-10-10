/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 外部插件扩展自动化功能的使用示例
 */

import { Plugin, usePlugin } from '@nocobase/client';
import { PluginAutomation, BaseExecutor, BaseAction, withTriggerEvents } from '@nocobase/plugin-automation';
import React from 'react';

// ================================
// 示例1: 在外部插件中注册自定义执行器
// ================================

/**
 * 自定义HTTP请求执行器
 */
class HttpRequestExecutor extends BaseExecutor {
  key = 'http-request';
  label = 'HTTP请求';
  description = '发送HTTP请求并返回响应';

  async execute(triggerParams: any, context: any) {
    const { url, method = 'GET', headers = {}, body } = triggerParams;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    return await response.json();
  }
}

/**
 * 自定义邮件发送动作器
 */
class EmailAction extends BaseAction {
  key = 'send-email';
  label = '发送邮件';
  description = '发送邮件通知';

  async execute(triggerParams: any, executorResult: any, context: any) {
    const { to, subject, content } = triggerParams;
    
    // 实际的邮件发送逻辑
    console.log('发送邮件:', {
      to,
      subject,
      content,
      data: executorResult,
    });
    
    // 这里可以调用真实的邮件服务API
    // await emailService.send({ to, subject, content });
  }
}

/**
 * 自定义触发器组件
 */
const CustomButton = withTriggerEvents(
  ({ children, onClick, ...props }) => {
    return (
      <button onClick={onClick} {...props}>
        {children}
      </button>
    );
  },
  [
    {
      key: 'onClick',
      label: '点击时',
      description: '当按钮被点击时触发',
    },
    {
      key: 'onDoubleClick', 
      label: '双击时',
      description: '当按钮被双击时触发',
    },
  ]
);

// ================================
// 示例2: 外部插件类实现
// ================================

export class PluginCustomAutomation extends Plugin {
  async load() {
    // 获取自动化插件实例
    const automationPlugin = this.app.getPlugin(PluginAutomation);
    
    if (automationPlugin) {
      // 注册自定义执行器
      automationPlugin.executors.register(new HttpRequestExecutor());
      
      // 注册自定义动作器
      automationPlugin.actions.register(new EmailAction());
      
      // 注册自定义触发器组件
      automationPlugin.triggers.register({
        key: 'custom-button',
        displayName: 'CustomButton',
        getSupportedEvents: () => CustomButton.getSupportedEvents(),
      });

      // 注册组件到应用
      this.app.addComponents({
        'Custom_Button': CustomButton,
      });
    }
  }
}

// ================================
// 示例3: 在组件中使用自动化功能
// ================================

export const MyComponent: React.FC = () => {
  const app = usePlugin('automation');
  const automationPlugin = app as any; // 类型断言以绕过编译错误

  const handleTriggerAutomation = () => {
    // 外部插件只负责触发自动化，不直接调用工作流执行
    // 系统会根据用户配置的工作流自动执行相应的executor和action
    if (automationPlugin) {
      // 触发自动化事件，系统内部会根据配置调度执行
      // 这里只需要提供触发参数，调度由useAutomation处理
      console.log('触发自动化事件 - 系统将根据配置自动执行工作流');
    }
  };

  const handleGetStatus = () => {
    if (automationPlugin) {
      // 外部插件可以查看系统状态用于调试和监控
      const status = automationPlugin.getStatus();
      console.log('自动化系统状态:', status);
    }
  };

  return (
    <div>
      <button onClick={handleTriggerAutomation}>
        触发自动化事件
      </button>
      <button onClick={handleGetStatus}>
        查看系统状态
      </button>
      
      {/* 使用自定义触发器组件 */}
      <CustomButton 
        onTrigger={() => console.log('自定义按钮触发器激活')}
      >
        自定义触发按钮
      </CustomButton>
    </div>
  );
};

// ================================
// 示例4: 高级用法 - 动态注册和管理
// ================================

export const AutomationDashboard: React.FC = () => {
  const app = usePlugin('automation');
  const automationPlugin = app as any; // 类型断言以绕过编译错误
  
  if (!automationPlugin) {
    return <div>自动化插件未加载</div>;
  }

  const status = automationPlugin.getStatus();

  return (
    <div>
      <h2>自动化系统仪表板</h2>
      
      <div>
        <h3>触发器 ({status.triggers.total})</h3>
        <ul>
          {status.triggers.keys.map(key => (
            <li key={key}>{key}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3>执行器 ({status.executors.total})</h3>
        <ul>
          {status.executors.keys.map(key => (
            <li key={key}>{key}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3>动作器 ({status.actions.total})</h3>
        <ul>
          {status.actions.keys.map(key => (
            <li key={key}>{key}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};