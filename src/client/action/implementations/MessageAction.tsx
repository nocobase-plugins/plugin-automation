/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { message, Input, Select } from 'antd';
import { BaseAction } from '../core/base';
import { ExecutionContext } from '../../core/types';
import { ContentRenderer, ContentConfig } from '../../core/contentRenderer';

/**
 * 消息提示 Action
 * 用于显示消息提示
 */
export class MessageAction extends BaseAction {
  key = 'message';
  label = '消息提示';
  description = '显示一个消息提示';

  /**
   * 执行消息提示
   */
  async execute(trigger: any, context: ExecutionContext): Promise<void> {
    // 统一的上下文，使用标准字段名
    const enrichedContext = {
      ...context,
      trigger
    };

    // 从 context.values 获取配置值
    const { type = 'info', duration = 3, contentType = 'text', content = '', contentFunction = '' } = context.config || {};

    // 构建内容配置
    const contentConfig: ContentConfig = {
      contentType,
      content,
      contentFunction
    };

    try {
      // 处理内容配置
      const contentResult = await ContentRenderer.processContent(contentConfig, enrichedContext);
      
      // 提取纯文本内容（消息提示不支持HTML）
      let messageContent: string;
      if (contentResult.type === 'HTML') {
        // 简单的HTML标签移除
        messageContent = contentResult.content.replace(/<[^>]*>/g, '');
      } else {
        messageContent = contentResult.content;
      }

      // 显示消息
      switch (type) {
        case 'success':
          message.success(messageContent, duration);
          break;
        case 'error':
          message.error(messageContent, duration);
          break;
        case 'warning':
          message.warning(messageContent, duration);
          break;
        case 'loading':
          message.loading(messageContent, duration);
          break;
        case 'info':
        default:
          message.info(messageContent, duration);
          break;
      }
    } catch (error: any) {
      // 发生错误时显示错误消息
      message.error(`消息渲染失败: ${error.message}`, 3);
    }
  }

  // 配置组件
  ConfigComponent = ({ value, onChange }: { value?: any; onChange?: (value: any) => void }) => {
    const currentValue = value || {};
    const { type = 'info', duration = 3, contentType = 'text', content = '', contentFunction = '' } = currentValue;

    const handleChange = (key: string, val: any) => {
      onChange?.({ ...currentValue, [key]: val });
    };

    return (
      <>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
            消息类型
          </label>
          <Select
            value={type}
            onChange={(value) => handleChange('type', value)}
            style={{ width: '100%' }}
            options={[
              { value: 'info', label: '信息' },
              { value: 'success', label: '成功' },
              { value: 'warning', label: '警告' },
              { value: 'error', label: '错误' },
              { value: 'loading', label: '加载中' },
            ]}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
            持续时间（秒）
          </label>
          <Input
            type="number"
            value={duration}
            onChange={(e) => handleChange('duration', Number(e.target.value) || 3)}
            min={1}
            max={10}
            placeholder="消息显示持续时间"
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
            内容类型
          </label>
          <Select
            value={contentType}
            onChange={(value) => handleChange('contentType', value)}
            style={{ width: '100%' }}
            options={[
              { value: 'text', label: '文本' },
              { value: 'function', label: '函数' },
            ]}
          />
        </div>

        {contentType === 'text' ? (
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
              消息内容
            </label>
            <Input.TextArea
              placeholder="请输入消息内容，支持模板变量 {{context.xxx}}"
              value={content}
              onChange={(e) => handleChange('content', e.target.value)}
              rows={3}
            />
          </div>
        ) : (
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
              内容函数
            </label>
            <Input.TextArea
              placeholder="(context) => { return { type: 'HTML', content: context.executor.data }; }"
              value={contentFunction}
              onChange={(e) => handleChange('contentFunction', e.target.value)}
              rows={4}
              style={{ fontFamily: 'Monaco, Consolas, monospace', fontSize: '12px' }}
            />
            <div style={{ fontSize: '11px', color: '#999', marginTop: 4 }}>
              支持箭头函数、函数声明、函数体等写法
              <br />
              返回格式：{`{type: 'HTML'|'MD'|'TEXT', content: '...'}`}
            </div>
          </div>
        )}
      </>
    );
  };
}
