/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Input, Select, Switch, InputNumber, Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { BaseAction } from '../core/base';
import { ExecutionContext } from '../../core/types';
import { ContentRenderer, ContentConfig } from '../../core';

// 全局存储当前鼠标位置
let lastMousePosition = { x: 0, y: 0 };

// 存储最后一个事件元素（用于组件模式）
let lastEventElement = null;

// 监听全局鼠标移动
document.addEventListener('mousemove', (e) => {
  lastMousePosition = { x: e.clientX, y: e.clientY };
  
  // 记录事件元素（用于组件模式）
  if (e.target && e.target !== document && e.target !== document.body) {
    lastEventElement = e.target;
  }
});

// 存储最后一个活动输入元素
let lastActiveInput = null;
document.addEventListener('click', (e) => {
  // 记录事件元素（用于组件模式）
  if (e.target && e.target !== document && e.target !== document.body) {
    lastEventElement = e.target;
  }
  
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
    const rect = e.target.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      lastActiveInput = {
        element: e.target,
        rect: rect
      };
    }
  }
}, true);

document.addEventListener('focus', (e) => {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
    const rect = e.target.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      lastActiveInput = {
        element: e.target,
        rect: rect
      };
    }
  }
}, true);

export class PopoverAction extends BaseAction {
  key = 'popover';
  label = '气泡提示';
  description = '在组件、光标或鼠标位置显示操作提示';





  execute(triggerParams: any, executorResult: any, context: ExecutionContext): void {
    if (!context) return;
    
    // 优化：将 triggerParams 和 executorResult 合并到 context 中
    const enrichedContext: ExecutionContext = {
      ...context,
      trigger: triggerParams,
      executor: executorResult
    };
    
    // 从配置中获取参数，支持从多个来源获取
    const config = context.config || executorResult?.popoverConfig || context.popoverConfig || {};
    const {
      content = '操作提示',
      contentType = 'text',
      contentFunction = '',
      autoClose = true,
      duration = 3000,
      position = 'component', // component | mouse | cursor | center | top | bottom
      theme = 'default', // default | success | warning | error | info
      size = 'medium', // small | medium | large
      showCloseButton = true,
    } = config;

    // 创建气泡容器
    const popover = document.createElement('div');
    popover.style.position = 'fixed';
    popover.style.zIndex = '9999';
    popover.style.fontFamily = '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    
    // 主题样式配置
    const themes = {
      default: {
        background: '#fff',
        border: '1px solid #d9d9d9',
        color: '#000000d9',
        shadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)'
      },
      success: {
        background: '#f6ffed',
        border: '1px solid #b7eb8f',
        color: '#52c41a',
        shadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)'
      },
      warning: {
        background: '#fffbe6',
        border: '1px solid #ffe58f',
        color: '#faad14',
        shadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)'
      },
      error: {
        background: '#fff2f0',
        border: '1px solid #ffccc7',
        color: '#ff4d4f',
        shadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)'
      },
      info: {
        background: '#e6f7ff',
        border: '1px solid #91d5ff',
        color: '#1890ff',
        shadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)'
      }
    };

    // 尺寸配置
    const sizes = {
      small: { padding: '4px 8px', fontSize: '12px', minWidth: '80px', maxWidth: '200px' },
      medium: { padding: '8px 12px', fontSize: '14px', minWidth: '120px', maxWidth: '300px' },
      large: { padding: '12px 16px', fontSize: '16px', minWidth: '160px', maxWidth: '400px' }
    };

    const themeStyle = themes[theme] || themes.default;
    const sizeStyle = sizes[size] || sizes.medium;

    // 应用样式
    Object.assign(popover.style, {
      background: themeStyle.background,
      border: themeStyle.border,
      color: themeStyle.color,
      boxShadow: themeStyle.shadow,
      borderRadius: '6px',
      padding: sizeStyle.padding,
      fontSize: sizeStyle.fontSize,
      minWidth: sizeStyle.minWidth,
      maxWidth: sizeStyle.maxWidth,
      wordWrap: 'break-word',
      lineHeight: '1.5',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px'
    });

    // 创建内容容器
    const contentDiv = document.createElement('div');
    contentDiv.style.flex = '1';
    
    // 构建内容配置并处理
    const contentConfig: ContentConfig = {
      contentType,
      content,
      contentFunction
    };
    
    // 异步处理内容
    const processAndRenderContent = async () => {
      try {
        const contentResult = await ContentRenderer.processContent(contentConfig, enrichedContext);
        
        // 根据内容类型设置HTML
        if (contentResult.type === 'HTML') {
          // HTML类型直接设置
          contentDiv.innerHTML = contentResult.content;
        } else {
          // 纯文本，保留换行
          contentDiv.innerHTML = contentResult.content.replace(/\n/g, '<br>');
        }
      } catch (error: any) {
        // 处理错误
        contentDiv.innerHTML = `<div style="color: red;">渲染错误: ${error.message}</div>`;
      }
    };
    
    // 执行异步渲染
    processAndRenderContent();
    
    popover.appendChild(contentDiv);
    
    // 创建关闭按钮（如果需要）
    if (!autoClose || showCloseButton) {
      const closeButton = document.createElement('button');
      closeButton.innerHTML = '×';
      closeButton.style.cssText = `
        background: none;
        border: none;
        font-size: 16px;
        line-height: 1;
        cursor: pointer;
        padding: 0;
        margin: 0;
        color: #00000073;
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 2px;
        flex-shrink: 0;
      `;
      closeButton.onmouseover = () => {
        closeButton.style.background = '#00000014';
        closeButton.style.color = '#000000d9';
      };
      closeButton.onmouseout = () => {
        closeButton.style.background = 'none';
        closeButton.style.color = '#00000073';
      };
      closeButton.onclick = () => {
        popover.remove();
      };
      popover.appendChild(closeButton);
    }

    // 添加到DOM
    document.body.appendChild(popover);

    // 根据位置配置设置位置
    this.setPopoverPosition(popover, position);

    // 添加调试信息
    console.log('Popover added to DOM:', {
      content,
      position,
      theme,
      size,
      autoClose,
      showCloseButton
    });

    // 设置自动关闭
    if (autoClose && duration > 0) {
      setTimeout(() => {
        if (popover.parentNode) {
          popover.remove();
        }
      }, duration);
    }
  }
  
  /**
   * 根据位置配置设置气泡位置
   */
  private setPopoverPosition(popover: HTMLElement, position: string): void {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 测量气泡实际尺寸
    const rect = popover.getBoundingClientRect();
    const popoverWidth = rect.width || 200;
    const popoverHeight = rect.height || 50;

    let x: number, y: number;

    switch (position) {
      case 'center':
        x = (viewportWidth - popoverWidth) / 2;
        y = (viewportHeight - popoverHeight) / 2;
        break;
        
      case 'top':
        x = (viewportWidth - popoverWidth) / 2;
        y = 20;
        break;
        
      case 'bottom':
        x = (viewportWidth - popoverWidth) / 2;
        y = viewportHeight - popoverHeight - 20;
        break;
        
      case 'mouse':
        x = lastMousePosition.x - popoverWidth / 2;
        y = lastMousePosition.y - popoverHeight - 10;
        break;
        
      case 'cursor':
        if (lastActiveInput) {
          const rect = lastActiveInput.rect;
          // 尝试估算光标位置
          let cursorX = rect.left;
          if (lastActiveInput.element instanceof HTMLInputElement || lastActiveInput.element instanceof HTMLTextAreaElement) {
            const value = lastActiveInput.element.value || '';
            const selectionStart = lastActiveInput.element.selectionStart || value.length;
            const charWidth = 8; // 假设平均字符宽度
            cursorX = rect.left + Math.min(selectionStart * charWidth, rect.width - 20) + 20;
          }
          x = cursorX - popoverWidth / 2;
          y = rect.top - popoverHeight - 10;
        } else {
          // 回退到鼠标位置
          x = lastMousePosition.x - popoverWidth / 2;
          y = lastMousePosition.y - popoverHeight - 10;
        }
        break;
        
      case 'component':
      default:
        if (lastEventElement && lastEventElement instanceof HTMLElement) {
          const rect = lastEventElement.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            x = rect.left + rect.width / 2 - popoverWidth / 2;
            y = rect.top - popoverHeight - 10;
          } else {
            // 回退到鼠标位置
            x = lastMousePosition.x - popoverWidth / 2;
            y = lastMousePosition.y - popoverHeight - 10;
          }
        } else {
          // 回退到鼠标位置
          x = lastMousePosition.x - popoverWidth / 2;
          y = lastMousePosition.y - popoverHeight - 10;
        }
        break;
    }

    // 确保气泡在视口内
    x = Math.max(10, Math.min(x, viewportWidth - popoverWidth - 10));
    y = Math.max(10, Math.min(y, viewportHeight - popoverHeight - 10));

    popover.style.left = `${x}px`;
    popover.style.top = `${y}px`;
  }

  // 配置组件
  ConfigComponent = ({ value, onChange }: { value?: any; onChange?: (value: any) => void }) => {
    const currentValue = value || {};
    
    const handleChange = (field: string, val: any) => {
      onChange?.({ ...currentValue, [field]: val });
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* 内容配置 */}
        <div>
          <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
            内容类型
          </div>
          <Select
            style={{ width: '100%', marginBottom: 12 }}
            value={currentValue.contentType || 'text'}
            onChange={(val) => handleChange('contentType', val)}
            options={[
              { label: '文本模式', value: 'text' },
              { label: '函数模式', value: 'function' },
            ]}
          />
          
          {(currentValue.contentType || 'text') === 'text' ? (
            <>
              <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
                文本内容
              </div>
              <Input.TextArea
                placeholder="支持变量替换：{{$trigger.data}}，{{$executor.success}}等"
                value={currentValue.content || ''}
                onChange={(e) => handleChange('content', e.target.value)}
                rows={2}
              />
              <div style={{ fontSize: '11px', color: '#999', marginTop: 4 }}>
                变量语法：{`{{$trigger.*}}`} - 触发器数据，{`{{$executor.*}}`} - 执行器结果，{`{{$context.*}}`} - 执行上下文
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
                函数代码
              </div>
              <Input.TextArea
                placeholder="(context) => { return { type: 'HTML', content: context.executor.data }; }"
                value={currentValue.contentFunction || ''}
                onChange={(e) => handleChange('contentFunction', e.target.value)}
                rows={4}
                style={{ fontFamily: 'Monaco, Consolas, monospace', fontSize: '12px' }}
              />
              <div style={{ fontSize: '11px', color: '#999', marginTop: 4 }}>
                支持箭头函数、函数声明、函数体等写法
                <br />
                返回格式：{`{type: 'HTML'|'MD'|'TEXT', content: '...'}`}
              </div>
            </>
          )}
        </div>

        {/* 主题样式 */}
        <div>
          <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
            主题样式
          </div>
          <Select
            style={{ width: '100%' }}
            value={currentValue.theme || 'default'}
            onChange={(val) => handleChange('theme', val)}
            options={[
              { label: '默认', value: 'default' },
              { label: '成功', value: 'success' },
              { label: '警告', value: 'warning' },
              { label: '错误', value: 'error' },
              { label: '信息', value: 'info' },
            ]}
          />
        </div>

        {/* 显示位置 */}
        <div>
          <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
            显示位置
          </div>
          <Select
            style={{ width: '100%' }}
            value={currentValue.position || 'component'}
            onChange={(val) => handleChange('position', val)}
            options={[
              { label: '触发组件附近', value: 'component' },
              { label: '鼠标位置', value: 'mouse' },
              { label: '光标位置', value: 'cursor' },
              { label: '屏幕中央', value: 'center' },
              { label: '屏幕顶部', value: 'top' },
              { label: '屏幕底部', value: 'bottom' },
            ]}
          />
        </div>

        {/* 尺寸大小 */}
        <div>
          <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
            尺寸大小
          </div>
          <Select
            style={{ width: '100%' }}
            value={currentValue.size || 'medium'}
            onChange={(val) => handleChange('size', val)}
            options={[
              { label: '小', value: 'small' },
              { label: '中', value: 'medium' },
              { label: '大', value: 'large' },
            ]}
          />
        </div>

        {/* 自动关闭 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>
              自动关闭
            </div>
            <div style={{ fontSize: '11px', color: '#999' }}>
              如果关闭，气泡将保持显示直到手动关闭
            </div>
          </div>
          <Switch
            checked={currentValue.autoClose !== false}
            onChange={(checked) => handleChange('autoClose', checked)}
          />
        </div>

        {/* 显示关闭按钮 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>
              显示关闭按钮
            </div>
            <div style={{ fontSize: '11px', color: '#999' }}>
              在气泡右上角显示关闭按钮
            </div>
          </div>
          <Switch
            checked={currentValue.showCloseButton !== false}
            onChange={(checked) => handleChange('showCloseButton', checked)}
          />
        </div>

        {/* 自动关闭时间 */}
        {(currentValue.autoClose !== false) && (
          <div>
            <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
              自动关闭时间（毫秒）
            </div>
            <InputNumber
              style={{ width: '100%' }}
              placeholder="3000"
              value={currentValue.duration || 3000}
              onChange={(val) => handleChange('duration', val || 3000)}
              min={500}
              max={30000}
              step={500}
            />
          </div>
        )}
      </div>
    );
  };
}