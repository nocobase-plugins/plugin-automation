/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// 导出核心基础设施
export * from './core';

// 导出具体实现
export * from './implementations';

// 导出插件初始化函数
export { initialTrigger } from './setup';