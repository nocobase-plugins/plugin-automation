/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Input, message } from 'antd';
import { BaseAction } from '../../core/base';
import { ExecutionContext } from '../../../core/types';
import { compileAutomationObject } from '../../../core/compile';

/**
 * 剪贴板写入动作器
 * 将指定内容写入系统剪贴板
 */
export class ClipboardWriteAction extends BaseAction {
  key = 'clipboard-write';
  label = '写入剪贴板';
  description = '将指定内容写入系统剪贴板，支持变量替换';

  async execute(triggerParams: any, context: ExecutionContext): Promise<void> {
    console.log('=== Clipboard Write Action ===');
    console.log('Trigger Params:', triggerParams);
    console.log('Execution Context:', context);
    console.log('Clipboard Config:', context.config);
    console.log('==============================');

    // 统一上下文管理
    const enrichedContext: ExecutionContext = {
      ...context,
      trigger: triggerParams
    };
    
    // 编译配置对象，支持变量替换
    const rawConfig = context.config || {};
    const config = compileAutomationObject(rawConfig, enrichedContext);
    
    const {
      content = ''
    } = config;

    // 参数验证
    if (!content) {
      console.error('剪贴板内容不能为空');
      message.error('剪贴板内容不能为空');
      throw new Error('剪贴板内容不能为空');
    }

    try {
      // 检查是否在浏览器环境中
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        // 现代浏览器环境，使用 Clipboard API
        await navigator.clipboard.writeText(content);
        console.log('内容已成功写入剪贴板 (Clipboard API):', content.length > 100 ? content.substring(0, 100) + '...' : content);
        message.success('内容已成功写入剪贴板');
      } else if (typeof document !== 'undefined') {
        // 降级方案：使用传统的 document.execCommand
        const textArea = document.createElement('textarea');
        textArea.value = content;
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.width = '2em';
        textArea.style.height = '2em';
        textArea.style.padding = '0';
        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';
        textArea.style.background = 'transparent';
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          console.log('内容已成功写入剪贴板 (execCommand):', content.length > 100 ? content.substring(0, 100) + '...' : content);
          message.success('内容已成功写入剪贴板');
        } else {
          throw new Error('execCommand copy failed');
        }
      } else {
        // 服务端环境或不支持的环境
        const errorMsg = '当前环境不支持剪贴板操作（需要浏览器环境）';
        console.error(errorMsg);
        message.error(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      const errorMsg = `剪贴板写入失败: ${error.message}`;
      console.error('剪贴板写入失败:', error.message);
      message.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  // 配置组件
  ConfigComponent = ({ value, onChange }: { value?: any; onChange?: (value: any) => void }) => {
    const currentValue = value || {};
    
    const handleChange = (field: string, val: any) => {
      onChange?.({ ...currentValue, [field]: val });
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* 剪贴板内容 */}
        <div>
          <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
            剪贴板内容 <span style={{ color: '#ff4d4f' }}>*</span>
          </div>
          <Input.TextArea
            placeholder={`支持变量替换，例如：
用户信息：{{$context.trigger.userName}}
当前时间：{{$utils.formatDate()}}
执行结果：{{$context.executors[0].data.result}}

也可以直接输入固定文本内容...`}
            value={currentValue.content || ''}
            onChange={(e) => handleChange('content', e.target.value)}
            rows={8}
            showCount
            maxLength={10000}
          />
          <div style={{ fontSize: '11px', color: '#999', marginTop: 4 }}>
            <div>支持变量替换：</div>
            <div>• {`{{$context.trigger.*}}`} - 触发器数据</div>
            <div>• {`{{$context.executors[*].data.*}}`} - 执行器结果</div>
            <div>• {`{{$utils.formatDate()}}`} - 工具函数</div>
            <div>• {`{{$context.timestamp}}`} - 执行时间戳</div>
          </div>
        </div>

        {/* 使用说明 */}
        <div style={{ 
          background: '#f0f9ff', 
          border: '1px solid #e6f4ff', 
          borderRadius: '6px',
          padding: '12px'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1890ff', marginBottom: '8px' }}>
            使用说明
          </div>
          <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.5' }}>
            <div>• 该动作器将指定内容写入系统剪贴板</div>
            <div>• 支持文本、JSON、代码等任意格式内容</div>
            <div>• 在浏览器环境中执行，需要用户授权剪贴板权限</div>
            <div>• 可配合其他执行器结果，实现数据的快速复制</div>
            <div>• 内容长度限制：10,000字符</div>
          </div>
        </div>
      </div>
    );
  };
}