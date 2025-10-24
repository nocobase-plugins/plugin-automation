/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ArrayItems } from '@formily/antd-v5';
import { Select, Input, InputNumber, Button, Space, Card } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { BaseExecutor } from '../../core/base';
import { ExecutionContext } from '../../../core/types';
import { APIClient } from '@nocobase/client';
import { compileAutomationObject } from '../../../core/compile';

/**
 * HTTP 执行器
 * 执行 HTTP 请求并返回响应结果
 */
export class HttpExecutor extends BaseExecutor {
  key = 'http';
  label = 'HTTP Request';
  description = 'Execute HTTP request and return response data';

  async execute(triggerParams: any, context: ExecutionContext): Promise<any> {
    console.log('=== HTTP Executor ===');
    console.log('Trigger Params:', triggerParams);
    console.log('Execution Context:', context);
    console.log('HTTP Config:', context.config);
    console.log('====================');

    // 优化：将 triggerParams 合并到 context 中，统一上下文管理
    const enrichedContext: ExecutionContext = {
      ...context,
      trigger: triggerParams
    };
    
    // 编译整个配置对象，支持所有字段的变量替换
    const rawConfig = context.config || {};
    const config = compileAutomationObject(rawConfig, enrichedContext);
    
    const {
      method = 'GET',
      url = '',
      headers = [],
      params = [],
      data = '',
      timeout = 5000,
      responseType = 'json'
    } = config;

    // 构建请求配置（配置已通过compile处理过变量替换）
    const requestConfig: any = {
      method: method.toUpperCase(),
      url: url,
      headers: this.buildHeaders(headers),
      params: this.buildParams(params),
      timeout,
    };

    // 如果是需要 body 的方法，添加请求体
    if (['POST', 'PUT', 'PATCH'].includes(requestConfig.method) && data) {
      try {
        requestConfig.data = JSON.parse(data);
      } catch (error) {
        console.warn('Failed to parse request body as JSON, using as string:', error);
        requestConfig.data = data;
      }
    }

    try {
      // Execute HTTP request through the backend
      const apiClient = context.apiClient;
      if (!apiClient) {
        throw new Error('APIClient not available in execution context');
      }
      
      const response = await apiClient.request({
        url: 'collections:automation-fetch_data',
        method: 'post',
        data: {
          data: {
            type: 'http',
            data: {
              url,
              method: method.toUpperCase(),
              headers: this.buildHeaders(headers),
              params: this.buildParams(params),
              body: data,
              timeout
            }
          }
        }
      });

      return {
        success: true,
        data: response,
        executedAt: new Date(),
        executorKey: this.key,
        metadata: requestConfig
      };
    } catch (error) {
      return {
        success: false,
        data: error.response ? {
            status: error.response.status,
            statusText: error.response.statusText,
            headers: error.response.headers
          } : null,
        executedAt: new Date(),
        executorKey: this.key,
        metadata: requestConfig
      };
    }
  }



  /**
   * 构建请求头（变量已在上层编译处理）
   */
  private buildHeaders(headers: any[]): Record<string, string> {
    const result: Record<string, string> = { 'Content-Type': 'application/json' };
    
    if (Array.isArray(headers)) {
      headers.forEach(header => {
        if (header.name && header.value) {
          result[header.name] = header.value;
        }
      });
    }
    
    return result;
  }

  /**
   * 构建请求参数（变量已在上层编译处理）
   */
  private buildParams(params: any[]): Record<string, string> {
    const result: Record<string, string> = {};
    
    if (Array.isArray(params)) {
      params.forEach(param => {
        if (param.name && param.value !== undefined) {
          result[param.name] = String(param.value);
        }
      });
    }
    
    return result;
  }

  // 配置组件
  ConfigComponent = ({ value, onChange }: { value?: any; onChange?: (value: any) => void }) => {
    const currentValue = value || {};
    
    const handleChange = (field: string, val: any) => {
      onChange?.({ ...currentValue, [field]: val });
    };

    const handleHeaderChange = (index: number, field: string, val: string) => {
      const headers = [...(currentValue.headers || [])];
      if (!headers[index]) headers[index] = {};
      headers[index][field] = val;
      handleChange('headers', headers);
    };

    const handleParamChange = (index: number, field: string, val: string) => {
      const params = [...(currentValue.params || [])];
      if (!params[index]) params[index] = {};
      params[index][field] = val;
      handleChange('params', params);
    };

    const addHeader = () => {
      const headers = [...(currentValue.headers || []), { name: '', value: '' }];
      handleChange('headers', headers);
    };

    const removeHeader = (index: number) => {
      const headers = (currentValue.headers || []).filter((_, i) => i !== index);
      handleChange('headers', headers);
    };

    const addParam = () => {
      const params = [...(currentValue.params || []), { name: '', value: '' }];
      handleChange('params', params);
    };

    const removeParam = (index: number) => {
      const params = (currentValue.params || []).filter((_, i) => i !== index);
      handleChange('params', params);
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* HTTP 方法 */}
        <div>
          <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
            HTTP 方法 <span style={{ color: '#ff4d4f' }}>*</span>
          </div>
          <Select
            style={{ width: '100%' }}
            value={currentValue.method || 'GET'}
            onChange={(val) => handleChange('method', val)}
            options={[
              { label: 'GET', value: 'GET' },
              { label: 'POST', value: 'POST' },
              { label: 'PUT', value: 'PUT' },
              { label: 'PATCH', value: 'PATCH' },
              { label: 'DELETE', value: 'DELETE' },
            ]}
          />
        </div>

        {/* URL */}
        <div>
          <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
            URL <span style={{ color: '#ff4d4f' }}>*</span>
          </div>
          <Input.TextArea
            placeholder="支持变量：https://api.example.com/users/{{$context.trigger.userId}}"
            value={currentValue.url || ''}
            onChange={(e) => handleChange('url', e.target.value)}
            rows={2}
          />
          <div style={{ fontSize: '11px', color: '#999', marginTop: 4 }}>
            支持变量替换：{`{{$context.trigger.*}}`} - 触发器数据，{`{{$context.executors[*].data.*}}`} - 用户参数，{`{{$utils.formatDate()}}`} - 工具函数
          </div>
        </div>

        {/* 请求头 */}
        <div>
          <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
            请求头
          </div>
          <div style={{ fontSize: '11px', color: '#999', marginBottom: 8 }}>
            "Content-Type" 请求头仅支持 "application/json"，无需指定
          </div>
          <Card size="small" style={{ background: '#fafafa' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(currentValue.headers || []).map((header, index) => (
                <div key={index}>
                  <Space.Compact style={{ display: 'flex', width: '100%' }}>
                    <Input
                      placeholder="请求头名称"
                      value={header.name || ''}
                      onChange={(e) => handleHeaderChange(index, 'name', e.target.value)}
                      style={{ width: '30%' }}
                    />
                    <Input
                      placeholder="支持变量：{{$context.trigger.token}}"
                      value={header.value || ''}
                      onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                      style={{ width: '60%' }}
                    />
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeHeader(index)}
                      style={{ width: '10%' }}
                    />
                  </Space.Compact>
                </div>
              ))}
              <Button
                type="dashed"
                onClick={addHeader}
                icon={<PlusOutlined />}
                style={{ width: '100%' }}
              >
                添加请求头
              </Button>
            </div>
          </Card>
        </div>

        {/* 参数 */}
        <div>
          <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
            参数
          </div>
          <Card size="small" style={{ background: '#fafafa' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(currentValue.params || []).map((param, index) => (
                <div key={index}>
                  <Space.Compact style={{ display: 'flex', width: '100%' }}>
                    <Input
                      placeholder="参数名称"
                      value={param.name || ''}
                      onChange={(e) => handleParamChange(index, 'name', e.target.value)}
                      style={{ width: '30%' }}
                    />
                    <Input
                      placeholder="参数值"
                      value={param.value || ''}
                      onChange={(e) => handleParamChange(index, 'value', e.target.value)}
                      style={{ width: '60%' }}
                    />
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeParam(index)}
                      style={{ width: '10%' }}
                    />
                  </Space.Compact>
                </div>
              ))}
              <Button
                type="dashed"
                onClick={addParam}
                icon={<PlusOutlined />}
                style={{ width: '100%' }}
              >
                添加参数
              </Button>
            </div>
          </Card>
        </div>

        {/* 请求体 */}
        <div>
          <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
            请求体
          </div>
          <div style={{ fontSize: '11px', color: '#999', marginBottom: 8 }}>
            仅支持标准 JSON 数据
          </div>
          <Input.TextArea
            placeholder="输入请求数据"
            value={currentValue.data || ''}
            onChange={(e) => handleChange('data', e.target.value)}
            rows={6}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* 超时设置 */}
          <div>
            <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
              超时设置
            </div>
            <InputNumber
              style={{ width: '100%' }}
              value={currentValue.timeout || 5000}
              onChange={(val) => handleChange('timeout', val || 5000)}
              min={1000}
              max={60000}
              step={1000}
              addonAfter="毫秒"
            />
          </div>

          {/* 响应类型 */}
          <div>
            <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
              响应类型
            </div>
            <Select
              style={{ width: '100%' }}
              value={currentValue.responseType || 'json'}
              onChange={(val) => handleChange('responseType', val)}
              options={[
                { label: 'JSON', value: 'json' },
                { label: 'Stream', value: 'stream' },
              ]}
            />
          </div>
        </div>

        {/* 变量说明 */}
        {/* <Card 
          size="small" 
          title="支持的变量" 
          style={{ 
            background: '#f0f9ff',
            border: '1px solid #e6f4ff'
          }}
          headStyle={{ 
            fontSize: '12px', 
            fontWeight: 'bold',
            color: '#1890ff',
            minHeight: '32px',
            padding: '4px 12px'
          }}
          bodyStyle={{ 
            fontSize: '12px',
            color: '#666',
            padding: '8px 12px'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>• <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '2px' }}>{'{{$form.fieldName}}'}</code> - 表单字段值</div>
            <div>• <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '2px' }}>{'{{$timestamp}}'}</code> - 当前时间戳</div>
            <div>• <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '2px' }}>{'{{$now}}'}</code> - 当前ISO时间</div>
          </div>
        </Card> */}
      </div>
    );
  };
}