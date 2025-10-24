/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Input, Switch } from 'antd';
import { BaseAction } from '../core/base';
import { ExecutionContext } from '../../core/types';
import { ContentConfig, ContentRenderer } from '../../core';

/**
 * 控制台打印 Action
 * 用于在控制台输出信息
 */
export class ConsoleAction extends BaseAction {
  key = 'console';
  label = '控制台打印';
  description = '在浏览器控制台输出信息';

  /**
   * 执行控制台打印
   */
  async execute(trigger: any, context: ExecutionContext): Promise<void> {
    // 统一的上下文，只使用executors数组，trigger字段统一命名
    const enrichedContext = {
      ...context,
      trigger  // 统一使用trigger字段名
    };
    
    // 支持从配置或多种来源获取要打印的内容
    const customMessage = context.config?.message;
    const showDetails = context.config?.showDetails !== false; // 默认显示详细信息
    
    // 如果需要获取最后一个执行器的结果，使用executors数组
    const lastExecutor = context.executors?.[context.executors.length - 1];
    
    const message = customMessage || 
                   lastExecutor?.data?.message || 
                   context?.message || 
                   'Console Action Executed'; 
                   context?.message || 
                   'Console Action Executed';
    // 构建内容配置
    const contentConfig: ContentConfig = {
      contentType: 'text',
      content: message,
      contentFunction: ''
    };

    // 处理内容配置
    const contentResult = await ContentRenderer.processContent(contentConfig, enrichedContext);
    
    console.log('=== Console Action ===');
    console.log('Message:', contentResult.content);
    
    if (showDetails) {
      console.log('Unified Context:', enrichedContext);
    }
    
    console.log('===================');
  }

  // 配置组件
  ConfigComponent = ({ value, onChange }: { value?: any; onChange?: (value: any) => void }) => {
    return (
      <div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
            自定义消息
          </div>
          <Input.TextArea
            placeholder="请输入要打印的消息（留空将使用执行器结果）"
            value={value?.message || ''}
            onChange={(e) => onChange?.({ ...value, message: e.target.value })}
            rows={2}
          />
        </div>
        <div>
          <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
            显示详细信息
          </div>
          <Switch
            checked={value?.showDetails !== false}
            onChange={(showDetails) => onChange?.({ ...value, showDetails })}
          />
          <span style={{ marginLeft: 8, fontSize: '12px', color: '#999' }}>
            包含触发器参数、执行器结果和上下文信息
          </span>
        </div>
      </div>
    );
  };
}