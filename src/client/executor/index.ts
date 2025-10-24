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

import { executorRegistry } from './core/registry';
import { DataQueryExecutor } from './implementations/data-query';
import { EchoExecutor } from './implementations/echo';
import { HttpExecutor } from './implementations/http';
import { ParameterBuilderExecutor } from './implementations/parameter-builder';
import { ScriptExecutor } from './implementations/script';

// 注册所有执行器
executorRegistry.register(new EchoExecutor());
executorRegistry.register(new ParameterBuilderExecutor());
executorRegistry.register(new ScriptExecutor());
executorRegistry.register(new DataQueryExecutor());
executorRegistry.register(new HttpExecutor());

// 显式导出 executorRegistry 供其他插件使用
export { executorRegistry };