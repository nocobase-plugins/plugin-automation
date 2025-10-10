/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ExecutorDefinition, ExecutionContext } from '../../core/types';

/**
 * 执行器基类
 * 提供执行器的基本结构和通用功能
 */
export abstract class BaseExecutor implements ExecutorDefinition {
  abstract key: string;
  abstract label: string;
  description?: string;

  /**
   * 执行器实现需要重写此方法
   */
  abstract execute(triggerParams: any, context: ExecutionContext): Promise<any> | any;

  /**
   * 可选的配置组件
   */
  ConfigComponent?: React.ComponentType<{ value?: any; onChange?: (value: any) => void }>;
}