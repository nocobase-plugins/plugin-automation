/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionDefinition, ExecutionContext } from '../../core/types';

/**
 * 动作器基类
 * 提供动作器的基本结构和通用功能
 */
export abstract class BaseAction implements ActionDefinition {
  abstract key: string;
  abstract label: string;
  description?: string;

  /**
   * 动作器实现需要重写此方法
   */
  abstract execute(triggerParams: any, executorResult: any, context: ExecutionContext): Promise<void> | void;

  /**
   * 可选的配置组件
   */
  ConfigComponent?: React.ComponentType<{ value?: any; onChange?: (value: any) => void }>;
}