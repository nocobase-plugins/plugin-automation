/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export * from '../../core/types';
import { EventDefinition } from '../../core/types';

/**
 * 触发器专用类型定义
 */

/**
 * 触发器组件接口
 */
export interface TriggerComponent {
  /** 组件唯一标识 */
  key: string;
  /** 组件名称 */
  displayName: string;
  /** 支持的事件列表 */
  getSupportedEvents?: () => EventDefinition[];
}