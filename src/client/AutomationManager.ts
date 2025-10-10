/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { triggerRegistry } from './trigger/core/registry';
import { executorRegistry } from './executor/core/registry';
import { actionRegistry } from './action/core/registry';
import { TriggerComponent } from './trigger/core/types';
import { ExecutorDefinition, ActionDefinition } from './core/types';

/**
 * 自动化管理器
 * 提供给外部插件注册和管理自动化组件的API
 * 注意：外部插件只负责注册实现，不直接调用执行方法
 */
export class AutomationManager {
  
  /**
   * 触发器管理
   */
  get triggers() {
    return {
      /**
       * 注册触发器组件
       */
      register: (component: TriggerComponent) => {
        triggerRegistry.register(component);
      },

      /**
       * 取消注册触发器组件
       */
      unregister: (key: string) => {
        triggerRegistry.unregister(key);
      },

      /**
       * 获取触发器组件
       */
      get: (key: string) => {
        return triggerRegistry.get(key);
      },

      /**
       * 获取所有触发器组件
       */
      getAll: () => {
        return triggerRegistry.getAll();
      },

      /**
       * 检查触发器是否存在
       */
      has: (key: string) => {
        return triggerRegistry.has(key);
      }
    };
  }

  /**
   * 执行器管理
   */
  get executors() {
    return {
      /**
       * 注册执行器
       */
      register: (executor: ExecutorDefinition) => {
        executorRegistry.register(executor);
      },

      /**
       * 取消注册执行器
       */
      unregister: (key: string) => {
        executorRegistry.unregister(key);
      },

      /**
       * 获取执行器
       */
      get: (key: string) => {
        return executorRegistry.get(key);
      },

      /**
       * 获取所有执行器
       */
      getAll: () => {
        return executorRegistry.getAll();
      },

      /**
       * 检查执行器是否存在
       */
      has: (key: string) => {
        return executorRegistry.has(key);
      }
    };
  }

  /**
   * 动作器管理
   */
  get actions() {
    return {
      /**
       * 注册动作器
       */
      register: (action: ActionDefinition) => {
        actionRegistry.register(action);
      },

      /**
       * 取消注册动作器
       */
      unregister: (key: string) => {
        actionRegistry.unregister(key);
      },

      /**
       * 获取动作器
       */
      get: (key: string) => {
        return actionRegistry.get(key);
      },

      /**
       * 获取所有动作器
       */
      getAll: () => {
        return actionRegistry.getAll();
      },

      /**
       * 检查动作器是否存在
       */
      has: (key: string) => {
        return actionRegistry.has(key);
      }
    };
  }

  /**
   * 获取系统状态
   * 主要用于调试和监控
   */
  getStatus() {
    return {
      triggers: {
        total: this.triggers.getAll().length,
        keys: this.triggers.getAll().map(t => t.key),
      },
      executors: {
        total: this.executors.getAll().length,
        keys: this.executors.getAll().map(e => e.key),
      },
      actions: {
        total: this.actions.getAll().length,
        keys: this.actions.getAll().map(a => a.key),
      },
    };
  }
}