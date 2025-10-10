/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ExecutionContext } from './types';

/**
 * 创建执行上下文
 */
export function createExecutionContext(
  event: string,
  originalEvent: any,
  additionalData: Partial<ExecutionContext> = {}
): ExecutionContext {
  return {
    event,
    originalEvent,
    timestamp: new Date(),
    ...additionalData,
  };
}

/**
 * 扩展执行上下文
 */
export function extendExecutionContext(
  context: ExecutionContext,
  additionalData: Partial<ExecutionContext>
): ExecutionContext {
  return {
    ...context,
    ...additionalData,
  };
}