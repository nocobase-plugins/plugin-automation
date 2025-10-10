/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseRegistry } from '../../core/registry';
import { ExecutorDefinition } from '../../core/types';

/**
 * 执行器注册中心
 */
export class ExecutorRegistry extends BaseRegistry<ExecutorDefinition> {
  /**
   * 执行指定的执行器
   */
  async execute(key: string, triggerParams: any, context: any, apiClient?: any): Promise<any> {
    const executor = this.get(key);
    if (!executor) {
      throw new Error(`Executor with key "${key}" not found`);
    }

    try {
      // 将 apiClient 添加到 context 中，这样执行器可以访问它
      const enrichedContext = {
        ...context,
        apiClient
      };
      const result = await executor.execute(triggerParams, enrichedContext);
      console.log(`Executor "${key}" executed successfully`, result);
      return result;
    } catch (error) {
      console.error(`Failed to execute executor "${key}":`, error);
      throw error;
    }
  }
}

/**
 * 全局执行器注册中心实例
 */
export const executorRegistry = new ExecutorRegistry();