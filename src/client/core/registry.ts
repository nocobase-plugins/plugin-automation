/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from './types';

/**
 * 通用注册中心实现
 * 提供注册、获取、删除等基本功能
 */
export class BaseRegistry<T extends { key: string }> implements Registry<T> {
  private items: Map<string, T> = new Map();

  /**
   * 注册一个项目
   */
  register(item: T): void {
    if (this.items.has(item.key)) {
      console.warn(`Item with key "${item.key}" already exists. It will be overwritten.`);
    }
    this.items.set(item.key, item);
  }

  /**
   * 取消注册一个项目
   */
  unregister(key: string): void {
    this.items.delete(key);
  }

  /**
   * 获取指定的项目
   */
  get(key: string): T | undefined {
    return this.items.get(key);
  }

  /**
   * 获取所有项目
   */
  getAll(): T[] {
    return Array.from(this.items.values());
  }

  /**
   * 检查是否存在指定的项目
   */
  has(key: string): boolean {
    return this.items.has(key);
  }

  /**
   * 获取所有项目的键
   */
  getKeys(): string[] {
    return Array.from(this.items.keys());
  }

  /**
   * 清空所有项目
   */
  clear(): void {
    this.items.clear();
  }

  /**
   * 获取项目数量
   */
  size(): number {
    return this.items.size;
  }
}