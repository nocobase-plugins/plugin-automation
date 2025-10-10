/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { EventDefinition } from '../../core/types';

/**
 * 触发器组件基类
 * 所有需要支持事件触发的组件都应该继承此类
 */
export class BaseTriggerComponent extends React.Component<any> {
  /**
   * 获取组件支持的事件列表
   * 子类应该重写此方法以提供自己支持的事件
   * @returns 事件定义列表
   */
  static getSupportedEvents(): EventDefinition[] {
    return [];
  }
}

/**
 * 高阶组件：为普通组件添加触发器功能
 * @param Component 要包装的组件
 * @param events 组件支持的事件列表
 * @returns 包装后的组件
 */
export function withTriggerEvents<T extends React.ComponentType<any>>(
  Component: T,
  events: EventDefinition[]
): T & { getSupportedEvents: typeof BaseTriggerComponent.getSupportedEvents } {
  // 保留原始组件的静态属性
  const WrappedComponent = Component as any;
  
  // 添加获取支持事件的静态方法
  WrappedComponent.getSupportedEvents = function() {
    return events;
  };
  
  return WrappedComponent;
}