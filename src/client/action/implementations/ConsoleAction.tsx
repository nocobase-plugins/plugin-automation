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
  execute(triggerParams: any, executorResult: any, context: ExecutionContext): void {
    // 支持从配置或多种来源获取要打印的内容
    const customMessage = context.config?.message;
    const showDetails = context.config?.showDetails !== false; // 默认显示详细信息
    
    const message = customMessage || 
                   executorResult?.message || 
                   context?.message || 
                   'Console Action Executed';
    
    console.log('=== Console Action ===');
    console.log('Message:', message);
    
    if (showDetails) {
      console.log('Trigger Params:', triggerParams);
      console.log('Executor Result:', executorResult);
      console.log('Context:', context);
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