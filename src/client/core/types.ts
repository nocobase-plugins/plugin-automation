/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ComponentType } from 'react';

/**
 * 执行上下文 - 包含触发器、执行器和动作器都可能需要的信息
 */
export interface ExecutionContext {
  /** 事件名称 */
  event: string;
  /** 原始事件对象 */
  originalEvent: any;
  /** 时间戳 */
  timestamp: Date;
  
  // 自动化相关的统一上下文数据
  /** 触发器参数和数据 */
  trigger?: any;
  /** 执行器结果数据 */
  executor?: any;
  /** 动作配置 */
  config?: any;
  
  /** 其他自定义数据 */
  [key: string]: any;
}

/**
 * 执行器接口定义
 */
export interface ExecutorDefinition {
  /** 执行器唯一标识 */
  key: string;
  /** 显示名称 */
  label: string;
  /** 描述信息 */
  description?: string;
  /** 执行函数 */
  execute: (triggerParams: any, context: ExecutionContext) => Promise<any> | any;
  /** 配置组件 - 可选 */
  ConfigComponent?: ComponentType<{ value?: any; onChange?: (value: any) => void }>;
}

/**
 * 动作器接口定义
 */
export interface ActionDefinition {
  /** 动作器唯一标识 */
  key: string;
  /** 显示名称 */
  label: string;
  /** 描述信息 */
  description?: string;
  /** 执行函数 */
  execute: (triggerParams: any, executorResult: any, context: ExecutionContext) => Promise<void> | void;
  /** 配置组件 - 可选 */
  ConfigComponent?: ComponentType<{ context?: any;value?: any; onChange?: (value: any) => void }>;
}

/**
 * 触发器事件定义
 */
export interface EventDefinition {
  /** 事件唯一标识 */
  key: string;
  /** 显示名称 */
  label: string;
  /** 描述信息 */
  description?: string;
}

/**
 * 自动化配置数据结构
 */
export interface AutomationConfig {
  /** 事件到配置的映射 */
  eventConfigs: Record<string, EventConfig>;
}

/**
 * 单个事件的配置
 */
export interface EventConfig {
  /** 执行器配置 */
  executor?: {
    key: string;
    params?: any;
  };
  /** 动作器配置列表 */
  actions: Array<{
    key: string;
    params?: any;
  }>;
}

/**
 * 注册器接口 - 通用的注册器模式
 */
export interface Registry<T> {
  register(item: T): void;
  unregister(key: string): void;
  get(key: string): T | undefined;
  getAll(): T[];
  has(key: string): boolean;
}