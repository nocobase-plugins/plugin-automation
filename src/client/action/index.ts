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

// 注册默认动作器并导出注册中心
import { actionRegistry } from './core/registry';
import { ConsoleAction, MessageAction, PopoverAction, ModalAction, FormValueSetterAction, ClipboardWriteAction } from './implementations';

// 注册默认动作器
actionRegistry.register(new ConsoleAction());
actionRegistry.register(new MessageAction());
actionRegistry.register(new PopoverAction());
actionRegistry.register(new ModalAction());
actionRegistry.register(new FormValueSetterAction());
actionRegistry.register(new ClipboardWriteAction());

export { actionRegistry };
