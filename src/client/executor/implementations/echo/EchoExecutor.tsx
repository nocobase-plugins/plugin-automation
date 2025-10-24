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
import { BaseExecutor } from '../../core/base';
import { ExecutionContext } from '../../../core/types';
import { compileAutomationObject } from '../../../core/compile';

/**
 * Echo 执行器
 * 在控制台打印触发器上下文，并直接透传至动作器
 */
export class EchoExecutor extends BaseExecutor {
  key = 'echo';
  label = 'Echo Executor';
  description = 'Print trigger context to console and pass through to actions';

  async execute(triggerParams: any, context: ExecutionContext): Promise<any> {
    console.log('=== Echo Executor ===');
    console.log('Trigger Params:', triggerParams);
    console.log('Execution Context:', context);
    console.log('Config from context:', context.config);
    console.log('=====================');

    // 优化：将 triggerParams 合并到 context 中，统一上下文管理
    const enrichedContext: ExecutionContext = {
      ...context,
      trigger: triggerParams
    };
    
    // 编译整个配置对象，支持所有字段的变量替换
    const rawConfig = context.config || {};
    const config = compileAutomationObject(rawConfig, enrichedContext);
    
    console.log('Compiled Config:', config);
    
    // 透传参数到动作器，包含编译后的配置
    const result = {
      triggerParams,
      context: enrichedContext,
      executedAt: new Date(),
      executorKey: this.key,
      message: config?.message || 'No custom message configured',
      compiledConfig: config,
    };

    console.log('Echo Executor Result:', result);
    return result;
  }

  // 配置组件
  ConfigComponent = ({ value, onChange }: { value?: any; onChange?: (value: any) => void }) => {
    const currentValue = value || {};
    
    const handleChange = (field: string, val: any) => {
      onChange?.({
        ...currentValue,
        [field]: val
      });
    };
    
    return (
      <div>
        <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
          自定义消息（支持变量）
        </div>
        <Input
          placeholder="例如：触发数据：{{$context.trigger}}，系统时间：{{$context.timestamp}}"
          value={currentValue.message || ''}
          onChange={(e) => handleChange('message', e.target.value)}
        />
        
        {/* 变量说明 */}
        <div style={{ 
          marginTop: '8px',
          padding: '8px 12px', 
          background: '#f0f9ff', 
          border: '1px solid #e6f4ff', 
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>支持的变量：</div>
          <div>• <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '2px' }}>{'{{$context.trigger}}'}</code> - 触发器传入的所有数据</div>
          <div>• <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '2px' }}>{'{{$context.timestamp}}'}</code> - 当前时间戳</div>
          <div>• <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '2px' }}>{'{{JSON.stringify($context.trigger)}}'}</code> - JSON格式化输出</div>
        </div>
      </div>
    );
  };
}