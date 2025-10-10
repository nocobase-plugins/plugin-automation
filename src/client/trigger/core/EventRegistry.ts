/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EventDefinition } from '../types';

/**
 * 统一的自动化事件注册中心
 * 所有支持自动化的组件都应该通过这个注册中心注册其支持的事件
 */
class AutomationEventRegistry {
  private componentEvents = new Map<string, EventDefinition[]>();

  /**
   * 注册组件的自动化事件
   * @param componentName 组件名称（与 x-component 一致）
   * @param events 组件支持的事件列表
   */
  register(componentName: string, events: EventDefinition[]): void {
    console.log(`[EventRegistry] 注册组件事件: ${componentName}`, events);
    this.componentEvents.set(componentName, events);
  }

  /**
   * 获取组件支持的事件
   * @param componentName 组件名称
   * @returns 事件列表，如果组件不支持自动化则返回空数组
   */
  getEvents(componentName: string): EventDefinition[] {
    const events = this.componentEvents.get(componentName) || [];
    console.log(`[EventRegistry] 获取组件事件: ${componentName}`, events);
    return events;
  }

  /**
   * 检查组件是否支持自动化
   * @param componentName 组件名称
   * @returns 是否支持自动化
   */
  hasEvents(componentName: string): boolean {
    return this.componentEvents.has(componentName) && this.componentEvents.get(componentName)!.length > 0;
  }

  /**
   * 获取所有支持自动化的组件
   * @returns 组件名称列表
   */
  getAllComponents(): string[] {
    return Array.from(this.componentEvents.keys());
  }

  /**
   * 清空所有注册的事件（主要用于测试）
   */
  clear(): void {
    this.componentEvents.clear();
  }
}

// 导出单例实例
export const eventRegistry = new AutomationEventRegistry();

/**
 * 便捷的事件注册装饰器/工具函数
 * @param componentName 组件名称
 * @param events 事件列表
 * @returns 装饰器函数
 */
export function registerAutomationEvents(componentName: string, events: EventDefinition[]) {
  // 立即注册事件
  eventRegistry.register(componentName, events);
  
  // 返回装饰器函数（可选使用）
  return function<T extends any>(target: T): T {
    return target;
  };
}