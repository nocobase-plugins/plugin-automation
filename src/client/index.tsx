/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { initialTrigger } from './trigger/setup';
import { AutomationManager } from './AutomationManager';
import { ActionConfigRenderer, ExecutorConfigRenderer } from './Configuration';

// 导出核心模块，方便外部扩展
export * from './core';
export * from './executor';
export * from './action';
export * from './trigger';
export * from './hooks';
export * from './AutomationManager';

/**
 * 自动化插件主类
 * 提供完整的自动化框架能力
 */
export class AutomationPluginClient extends Plugin {
  /**
   * 自动化管理器实例
   * 其他插件可以通过 usePlugin(AutomationPlugin).automationManager 访问
   */
  automationManager = new AutomationManager();

  async load() {
    // 初始化触发器系统
    initialTrigger(this.app);
    
    this.app.addComponents({
      ExecutorConfigRenderer,
      ActionConfigRenderer,
    });
  }

  /**
   * 提供便捷的API访问方法
   * 外部插件只能注册组件，不能直接调用执行方法
   */
  get triggers() {
    return this.automationManager.triggers;
  }

  get executors() {
    return this.automationManager.executors;
  }

  get actions() {
    return this.automationManager.actions;
  }

  /**
   * 获取系统状态（用于调试和监控）
   */
  getStatus() {
    return this.automationManager.getStatus();
  }
}

export default AutomationPluginClient;
