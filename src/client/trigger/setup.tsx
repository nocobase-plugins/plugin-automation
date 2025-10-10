/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application } from "@nocobase/client";
import { initialActionTrigger } from "./implementations/action";
import { initialComponentTrigger } from "./implementations/component";

export function initialTrigger(app: Application) {

    // 初始化动作触发器
    initialActionTrigger(app);

    // 注册自动化事件
    initialComponentTrigger(app);
};