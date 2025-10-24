/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Input, Typography } from 'antd';
import { BaseExecutor } from '../../core/base';
import { ExecutionContext } from '../../../core/types';

const { TextArea } = Input;
const { Text } = Typography;

const ScriptExecutorConfigComponent: React.FC<{
  value?: any;
  onChange?: (value: any) => void;
}> = ({ value = {}, onChange }) => {
  const handleChange = (key: string, val: any) => {
    onChange?.({
      ...value,
      [key]: val,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 脚本代码 */}
      <div>
        <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
          脚本代码
        </div>
        <TextArea
          rows={12}
          placeholder={`// 支持的函数格式：
// 箭头函数
(trigger, context) => {
  console.log('触发器数据:', trigger);
  console.log('执行上下文:', context);
  
  // 返回执行结果
  return {
    success: true,
    message: '脚本执行成功',
    data: { /* 自定义数据 */ }
  };
}

// 或普通函数
function(trigger, context) {
  // 可访问：
  // - trigger: 触发器事件数据
  // - context: 包含 form, executors, apiClient 等上下文
  
  return {
    success: true,
    message: '执行完成'
  };
}`}
          value={value.script || ''}
          onChange={(e) => handleChange('script', e.target.value)}
          style={{ fontFamily: 'Monaco, Menlo, monospace', fontSize: '12px' }}
        />
        <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
          提示：函数应返回包含 success 字段的对象，可选 message、data 等字段
        </div>
      </div>
    </div>
  );
};

export class ScriptExecutor extends BaseExecutor {
  public readonly key = 'script';
  public readonly label = '脚本执行器';
  public readonly description = '执行自定义JavaScript脚本';
  public readonly ConfigComponent = ScriptExecutorConfigComponent;
  
  async execute(eventData: any, context: ExecutionContext) {
    const config = context.config || {};
    const script = config.script;
    
    if (!script || typeof script !== 'string') {
      return {
        success: false,
        data: null,
        executedAt: new Date(),
        executorKey: 'script',
        metadata: { error: '脚本代码不能为空' }
      };
    }
    
    try {
      // 创建安全的执行环境
      const trigger = eventData;
      const contextData = {
        form: context.form,
        executors: context.executors || [],
        apiClient: context.apiClient,
        timestamp: context.timestamp,
        config: context.config,
        // 提供一些常用工具
        console: {
          log: (...args: any[]) => console.log('[Script]', ...args),
          error: (...args: any[]) => console.error('[Script]', ...args),
          warn: (...args: any[]) => console.warn('[Script]', ...args),
          info: (...args: any[]) => console.info('[Script]', ...args),
        }
      };
      
      // 尝试执行脚本
      let scriptFunction: Function;
      
      // 检查是否是箭头函数或普通函数
      const trimmedScript = script.trim();
      if (trimmedScript.startsWith('(') || trimmedScript.startsWith('function')) {
        // 直接是函数定义
        scriptFunction = new Function('return ' + script)();
      } else {
        // 包装为函数
        scriptFunction = new Function('trigger', 'context', script);
      }
      
      // 执行函数
      const result = await scriptFunction(trigger, contextData);
      
      // 标准化返回结果
      if (result && typeof result === 'object') {
        return {
          success: result.success !== false, // 默认为true，除非明确设为false
          data: result.data || result,
          executedAt: new Date(),
          executorKey: 'script',
          metadata: {
            message: result.message,
            ...result.metadata
          }
        };
      } else {
        return {
          success: true,
          data: result,
          executedAt: new Date(),
          executorKey: 'script',
          metadata: { 
            message: typeof result === 'string' ? result : '脚本执行完成'
          }
        };
      }
      
    } catch (error) {
      console.error('Script execution failed:', error);
      return {
        success: false,
        data: null,
        executedAt: new Date(),
        executorKey: 'script',
        metadata: { 
          error: error.message,
          stack: error.stack
        }
      };
    }
  }
}