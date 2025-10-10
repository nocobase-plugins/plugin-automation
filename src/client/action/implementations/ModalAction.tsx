/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Input, Select, Switch, InputNumber, Button, Modal } from 'antd';
import { BaseAction } from '../core/base';
import { ExecutionContext } from '../../core/types';
import { ContentConfig, AsyncContentRenderer } from '../../core';

/**
 * Modal 弹窗 Action
 * 用于显示模态对话框
 */
export class ModalAction extends BaseAction {
  key = 'modal';
  label = '模态弹窗';
  description = '显示一个模态对话框，支持丰富的内容和交互';

  /**
   * 执行 Modal 弹窗
   */
  execute(triggerParams: any, executorResult: any, context: ExecutionContext): void {
    // 优化：将 triggerParams 和 executorResult 合并到 context 中
    const enrichedContext: ExecutionContext = {
      ...context,
      trigger: triggerParams,
      executor: executorResult
    };
    if (!context) return;
    
    // 调试信息：显示executorResult结构
    console.log('ModalAction execute - executorResult:', executorResult);
    
    // 从配置中获取参数
    const config = context.config || {};
    const {
      title = '提示',
      content = '这是一个模态弹窗',
      contentType = 'text',
      contentFunction = '',
      width = 520,
      height = 'auto',
      maskClosable = true,
      keyboard = true,
      centered = false,
      destroyOnClose = true,
      type = 'info', // info | success | error | warning | confirm
      showIcon = false,
      okText = '确定',
      cancelText = '取消',
      showCancel = false,
      autoClose = false,
      autoCloseDelay = 3000,
      theme = 'default', // default | dark
    } = config;

    // 根据类型和主题设置样式
    const getModalProps = () => {
      // 准备标题（可选图标）
      const titleWithIcon = this.renderTitle(title, type, showIcon);
      
      const baseProps = {
        title: titleWithIcon,
        width,
        maskClosable,
        keyboard,
        centered,
        destroyOnClose,
        className: theme === 'dark' ? 'automation-modal-dark' : 'automation-modal-default',
      };

      // 添加自定义样式
      this.injectCustomStyles();

      // 构建内容配置
      const contentConfig: ContentConfig = {
        contentType,
        content,
        contentFunction
      };

      // 根据类型显示不同的模态框
      switch (type) {
        case 'success':
          return {
            ...baseProps,
            content: this.renderContent(contentConfig, 'success', enrichedContext),
            onOk: () => {
              console.log('Modal success confirmed');
            },
            okText,
            cancelText: showCancel ? cancelText : undefined,
            onCancel: showCancel ? () => {
              console.log('Modal success cancelled');
            } : undefined,
          };

        case 'error':
          return {
            ...baseProps,
            content: this.renderContent(contentConfig, 'error', enrichedContext),
            onOk: () => {
              console.log('Modal error confirmed');
            },
            okText,
            cancelText: showCancel ? cancelText : undefined,
            onCancel: showCancel ? () => {
              console.log('Modal error cancelled');
            } : undefined,
          };

        case 'warning':
          return {
            ...baseProps,
            content: this.renderContent(contentConfig, 'warning', enrichedContext),
            onOk: () => {
              console.log('Modal warning confirmed');
            },
            okText,
            cancelText: showCancel ? cancelText : undefined,
            onCancel: showCancel ? () => {
              console.log('Modal warning cancelled');
            } : undefined,
          };

        case 'confirm':
          return {
            ...baseProps,
            content: this.renderContent(contentConfig, 'confirm', enrichedContext),
            onOk: () => {
              console.log('Modal confirm - OK clicked');
              return Promise.resolve();
            },
            onCancel: () => {
              console.log('Modal confirm - Cancel clicked');
            },
            okText,
            cancelText,
          };

        case 'info':
        default:
          return {
            ...baseProps,
            content: this.renderContent(contentConfig, 'info', enrichedContext),
            onOk: () => {
              console.log('Modal info confirmed');
            },
            okText,
            cancelText: showCancel ? cancelText : undefined,
            onCancel: showCancel ? () => {
              console.log('Modal info cancelled');
            } : undefined,
          };
      }
    };

    // 显示对应类型的模态框
    let modal;
    const modalProps = getModalProps();

    switch (type) {
      case 'success':
        modal = Modal.success(modalProps);
        break;
      case 'error':
        modal = Modal.error(modalProps);
        break;
      case 'warning':
        modal = Modal.warning(modalProps);
        break;
      case 'confirm':
        modal = Modal.confirm(modalProps);
        break;
      case 'info':
      default:
        modal = Modal.info(modalProps);
        break;
    }

    // 自动关闭功能
    if (autoClose && autoCloseDelay > 0) {
      setTimeout(() => {
        if (modal && modal.destroy) {
          modal.destroy();
          console.log('Modal auto-closed after', autoCloseDelay, 'ms');
        }
      }, autoCloseDelay);
    }

    console.log('Modal displayed:', {
      type,
      title,
      content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
      width,
      theme,
      autoClose,
      autoCloseDelay
    });
  }

  /**
   * 渲染标题（可选图标）
   */
  private renderTitle(title: string, type: string, showIcon: boolean) {
    if (!showIcon) {
      return title;
    }

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      confirm: '❓'
    };

    const icon = icons[type as keyof typeof icons] || icons.info;
    
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>{icon}</span>
        <span>{title}</span>
      </span>
    );
  }

  /**
   * 渲染模态框内容 - 使用增强的内容渲染器
   */
  private renderContent(contentConfig: string | ContentConfig, type: string, context: ExecutionContext) {
    // 向后兼容：如果传入的是字符串，转换为文本配置
    const config: ContentConfig = typeof contentConfig === 'string' 
      ? { contentType: 'text', content: contentConfig }
      : contentConfig;
    
    // 返回异步内容渲染组件
    return React.createElement(AsyncContentRenderer, { config, context });
  }

  /**
   * 注入自定义样式
   */
  private injectCustomStyles() {
    const styleId = 'automation-modal-styles';
    if (document.getElementById(styleId)) {
      return; // 样式已存在
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .automation-modal-default .ant-modal-content {
        border-radius: 8px;
        box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
      }
      
      .automation-modal-dark .ant-modal-content {
        background: #1f1f1f;
        border-radius: 8px;
        color: #fff;
      }
      
      .automation-modal-dark .ant-modal-header {
        background: #1f1f1f;
        border-bottom: 1px solid #303030;
      }
      
      .automation-modal-dark .ant-modal-title {
        color: #fff;
      }
      
      .automation-modal-dark .ant-modal-close {
        color: #fff;
      }
      
      .automation-modal-dark .ant-modal-close:hover {
        color: #40a9ff;
      }
      
      .automation-modal-dark .ant-btn-default {
        background: #262626;
        border-color: #404040;
        color: #fff;
      }
      
      .automation-modal-dark .ant-btn-default:hover {
        background: #303030;
        border-color: #40a9ff;
        color: #40a9ff;
      }
    `;
    document.head.appendChild(style);
  }

  // 配置组件
  ConfigComponent = ({ value, onChange }: { value?: any; onChange?: (value: any) => void }) => {
    const currentValue = value || {};
    
    const handleChange = (field: string, val: any) => {
      onChange?.({ ...currentValue, [field]: val });
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* 标题 */}
        <div>
          <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
            标题
          </div>
          <Input
            placeholder="请输入模态框标题"
            value={currentValue.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
          />
        </div>

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
                placeholder="支持变量替换：{{$executor.success}}，{{$trigger.data}}等"
                value={currentValue.content || ''}
                onChange={(e) => handleChange('content', e.target.value)}
                rows={3}
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
                rows={6}
                style={{ fontFamily: 'Monaco, Consolas, monospace', fontSize: '12px' }}
              />
              <div style={{ fontSize: '11px', color: '#999', marginTop: 4 }}>
                支持多种写法，返回格式：{`{type: 'HTML'|'MD'|'TEXT', content: '...'}`}
                <br />
                <strong>箭头函数：</strong><code style={{ background: '#f5f5f5', padding: '2px 4px' }}>
                  (context) =&gt; {`{ return {type: 'HTML', content: context.executor.data}; }`}
                </code>
                <br />
                <strong>函数声明：</strong><code style={{ background: '#f5f5f5', padding: '2px 4px' }}>
                  function(context) {`{ return {type: 'HTML', content: context.executor.data}; }`}
                </code>
                <br />
                <strong>函数体：</strong><code style={{ background: '#f5f5f5', padding: '2px 4px' }}>
                  return {`{type: 'HTML', content: context.executor.data}`};
                </code>
              </div>
            </>
          )}
        </div>

        {/* 模态框类型 */}
        <div>
          <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
            类型
          </div>
          <Select
            style={{ width: '100%' }}
            value={currentValue.type || 'info'}
            onChange={(val) => handleChange('type', val)}
            options={[
              { label: '信息', value: 'info' },
              { label: '成功', value: 'success' },
              { label: '警告', value: 'warning' },
              { label: '错误', value: 'error' },
              { label: '确认', value: 'confirm' },
            ]}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* 宽度 */}
          <div>
            <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
              宽度（px）
            </div>
            <InputNumber
              style={{ width: '100%' }}
              placeholder="520"
              value={currentValue.width || 520}
              onChange={(val) => handleChange('width', val || 520)}
              min={300}
              max={1200}
              step={20}
            />
          </div>

          {/* 主题 */}
          <div>
            <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
              主题
            </div>
            <Select
              style={{ width: '100%' }}
              value={currentValue.theme || 'default'}
              onChange={(val) => handleChange('theme', val)}
              options={[
                { label: '默认', value: 'default' },
                { label: '深色', value: 'dark' },
              ]}
            />
          </div>
        </div>

        {/* 按钮文本 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
              确定按钮文本
            </div>
            <Input
              placeholder="确定"
              value={currentValue.okText || ''}
              onChange={(e) => handleChange('okText', e.target.value)}
            />
          </div>

          <div>
            <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
              取消按钮文本
            </div>
            <Input
              placeholder="取消"
              value={currentValue.cancelText || ''}
              onChange={(e) => handleChange('cancelText', e.target.value)}
            />
          </div>
        </div>

        {/* 开关选项 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* 显示图标 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: 2 }}>
                标题显示图标
              </div>
              <div style={{ fontSize: '11px', color: '#999' }}>
                在标题前显示类型图标（可选）
              </div>
            </div>
            <Switch
              checked={currentValue.showIcon === true}
              onChange={(checked) => handleChange('showIcon', checked)}
            />
          </div>

          {/* 显示取消按钮 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: 2 }}>
                显示取消按钮
              </div>
              <div style={{ fontSize: '11px', color: '#999' }}>
                显示取消按钮（确认类型默认显示）
              </div>
            </div>
            <Switch
              checked={currentValue.showCancel === true || currentValue.type === 'confirm'}
              disabled={currentValue.type === 'confirm'}
              onChange={(checked) => handleChange('showCancel', checked)}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* 居中显示 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: 2 }}>
                垂直居中
              </div>
              <div style={{ fontSize: '11px', color: '#999' }}>
                在屏幕中央显示
              </div>
            </div>
            <Switch
              checked={currentValue.centered === true}
              onChange={(checked) => handleChange('centered', checked)}
            />
          </div>

          {/* 点击蒙层关闭 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: 2 }}>
                点击蒙层关闭
              </div>
              <div style={{ fontSize: '11px', color: '#999' }}>
                点击背景蒙层关闭弹窗
              </div>
            </div>
            <Switch
              checked={currentValue.maskClosable !== false}
              onChange={(checked) => handleChange('maskClosable', checked)}
            />
          </div>
        </div>

        {/* 自动关闭 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: 2 }}>
              自动关闭
            </div>
            <div style={{ fontSize: '11px', color: '#999' }}>
              指定时间后自动关闭弹窗
            </div>
          </div>
          <Switch
            checked={currentValue.autoClose === true}
            onChange={(checked) => handleChange('autoClose', checked)}
          />
        </div>

        {/* 自动关闭延迟时间 */}
        {currentValue.autoClose && (
          <div>
            <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
              自动关闭延迟（毫秒）
            </div>
            <InputNumber
              style={{ width: '100%' }}
              placeholder="3000"
              value={currentValue.autoCloseDelay || 3000}
              onChange={(val) => handleChange('autoCloseDelay', val || 3000)}
              min={1000}
              max={30000}
              step={500}
            />
          </div>
        )}
      </div>
    );
  };
}