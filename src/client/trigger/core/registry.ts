/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseRegistry } from '../../core/registry';
import { TriggerComponent } from './types';

/**
 * 触发器注册中心
 */
export class TriggerRegistry extends BaseRegistry<TriggerComponent> {
  // 触发器注册中心主要用于管理触发器组件
  // 具体的触发逻辑由useAutomation hook处理
}

/**
 * 全局触发器注册中心实例
 */
export const triggerRegistry = new TriggerRegistry();