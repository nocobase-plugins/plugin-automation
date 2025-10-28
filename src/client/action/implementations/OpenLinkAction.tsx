/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Input } from 'antd';
import { BaseAction } from '../core/base';
import { ExecutionContext } from '../../core/types';
import { ContentConfig, ContentRenderer } from '../../core';

/**
 * 打开链接 Action
 */
export class OpenLinkAction extends BaseAction {
  key = 'open_link';
  label = '打开链接';
  description = '打开指定链接';

  /**
   * 执行打开链接动作
   */
  async execute(trigger: any, context: ExecutionContext): Promise<void> {
    // 统一的上下文，只使用executors数组，trigger字段统一命名
    const enrichedContext = {
      ...context,
      trigger  // 统一使用trigger字段名
    };
    
    // 支持从配置或多种来源获取要打开的链接
    const link = context.config?.link;

    // 构建内容配置
    const contentConfig: ContentConfig = {
      contentType: 'text',
      content: link,
      contentFunction: ''
    };

    // 处理内容配置
    const contentResult = await ContentRenderer.processContent(contentConfig, enrichedContext);
    
    console.log('=== OpenLink Action ===');
    console.log('Open link:', contentResult.content);
    if (contentResult.content) {
      window.open(contentResult.content, '_blank');
    }
    console.log('===================');
  }

  // 配置组件
  ConfigComponent = ({ value, onChange }: { value?: any; onChange?: (value: any) => void }) => {
    return (
      <div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
            自定义链接
          </div>
          <Input.TextArea
            placeholder="请输入要打开的链接"
            value={value?.link || ''}
            onChange={(e) => onChange?.({ ...value, link: e.target.value })}
            rows={2}
          />
        </div>
      </div>
    );
  };
}