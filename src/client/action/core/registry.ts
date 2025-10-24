/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseRegistry } from '../../core/registry';
import { ActionDefinition } from '../../core/types';

/**
 * 动作器注册中心
 */
export class ActionRegistry extends BaseRegistry<ActionDefinition> {
  /**
   * 执行指定的动作器
   */
  async execute(key: string, trigger: any, context: any): Promise<void> {
    const action = this.get(key);
    if (!action) {
      throw new Error(`Action with key "${key}" not found`);
    }

    try {
      await action.execute(trigger, context);
      console.log(`Action "${key}" executed successfully`);
    } catch (error) {
      console.error(`Failed to execute action "${key}":`, error);
      throw error;
    }
  }

  /**
   * 批量执行多个动作器
   */
  async executeMultiple(
    actionKeys: string[], 
    trigger: any, 
    context: any
  ): Promise<void> {
    for (const key of actionKeys) {
      await this.execute(key, trigger, context);
    }
  }
}

/**
 * 全局动作器注册中心实例
 */
export const actionRegistry = new ActionRegistry();