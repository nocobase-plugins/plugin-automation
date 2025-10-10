/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Button, Select, Input, Card } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useFieldSchema } from '@formily/react';
import { useCollectionFilterOptions, useFormBlockContext } from '@nocobase/client';
import { BaseAction } from '../core/base';
import { ExecutionContext } from '../../core/types';
import { compileAutomation } from '../../core/compile';

/**
 * 表单值设置 Action
 * 用于将执行器结果或触发器数据设置到表单字段中
 */
// 系统字段常量
const SYSTEM_FIELDS = ['id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'] as const;

export class FormValueSetterAction extends BaseAction {
  key = 'form-value-setter';
  label = '表单值设置';
  description = '将执行器结果或触发器数据设置到表单的指定字段中';

  /**
   * 执行表单值设置
   */
  execute(triggerParams: any, executorResult: any, context: ExecutionContext): void {
    // 优化：将 triggerParams 和 executorResult 合并到 context 中
    const enrichedContext: ExecutionContext = {
      ...context,
      trigger: triggerParams,
      executor: executorResult
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('=== FormValueSetter Action ===');
      console.log('Trigger Params:', triggerParams);
      console.log('Executor Result:', executorResult);
      console.log('Context:', context);
      console.log('===============================');
    }

    // 获取配置中的字段映射
    const { fieldMappings = [] } = context.config || {};
    
    if (!fieldMappings.length) {
      console.warn('No field mappings configured');
      return;
    }

    // 直接查找当前页面中的表单并设置值
    this.setFormValues(fieldMappings, enrichedContext);
  }

  /**
   * 设置表单值的具体实现
   */
  private setFormValues(fieldMappings: any[], context: ExecutionContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('Setting form values:', fieldMappings);
    }
    
    // 从 context 中获取表单实例
    const form = context.form;
    if (!form) {
      console.error('Form instance not found in context');
      return;
    }
    
    fieldMappings.forEach((mapping) => {
      const { fieldName, valueExpression } = mapping;
      
      if (!fieldName || !valueExpression) {
        console.warn('Invalid mapping:', mapping);
        return;
      }

      try {
        // 编译值表达式
        const compiledValue = compileAutomation(valueExpression, context);
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Setting field ${fieldName} to:`, compiledValue);
        }
        
        // 使用表单实例设置字段值
        form.query(fieldName).take((field) => {
          if (field) {
            field.setValue(compiledValue);
            if (process.env.NODE_ENV === 'development') {
              console.log(`Successfully set field ${fieldName} to:`, compiledValue);
            }
          } else {
            console.warn(`Field ${fieldName} not found in form`);
          }
        });
        
      } catch (error) {
        console.error(`Failed to set field ${fieldName}:`, error);
      }
    });
  }

  // 配置组件
  ConfigComponent = ({ context, value, onChange }: { 
    context?: any; 
    value?: { fieldMappings?: Array<{ fieldName: string; valueExpression: string }> }; 
    onChange?: (value: any) => void 
  }) => {
    const currentValue = value || {};
    const fieldMappings = currentValue.fieldMappings || [];
    
    // 尝试从表单上下文中获取 collection 信息
    const formBlockContext = useFormBlockContext();
    const collectionName = formBlockContext?.collectionName;
    
    // 使用 NocoBase 标准的方式获取字段选项
    const collectionFields = useCollectionFilterOptions(collectionName);
    
    // 最终的字段过滤逻辑
    const formFields = collectionFields
      .filter((field) => {
        // 排除 NocoBase 标准系统字段
        return !SYSTEM_FIELDS.includes(field.name as any);
      })
      .map((field) => ({
        label: `${field.title || field.label} (${field.name})`,
        value: field.name
      }));

    const handleAddMapping = () => {
      const newMappings = [
        ...fieldMappings,
        { fieldName: '', valueExpression: '' }
      ];
      onChange?.({
        ...currentValue,
        fieldMappings: newMappings
      });
    };

    const handleRemoveMapping = (index: number) => {
      const newMappings = fieldMappings.filter((_: any, i: number) => i !== index);
      onChange?.({
        ...currentValue,
        fieldMappings: newMappings
      });
    };

    const handleMappingChange = (index: number, field: string, val: any) => {
      const newMappings = [...fieldMappings];
      newMappings[index] = {
        ...newMappings[index],
        [field]: val
      };
      onChange?.({
        ...currentValue,
        fieldMappings: newMappings
      });
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
          字段值设置配置
        </div>

        {fieldMappings.map((mapping: any, index: number) => (
          <Card 
            key={index} 
            size="small" 
            title={`字段映射 ${index + 1}`}
            extra={
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleRemoveMapping(index)}
                danger
              />
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* 目标字段选择 */}
              <div>
                <div style={{ marginBottom: 4, fontSize: '12px', color: '#666' }}>
                  目标字段
                </div>
                <Select
                  style={{ width: '100%' }}
                  placeholder="选择要设置值的字段"
                  value={mapping.fieldName}
                  onChange={(val) => handleMappingChange(index, 'fieldName', val)}
                  options={formFields}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                />
              </div>

              {/* 值表达式 */}
              <div>
                <div style={{ marginBottom: 4, fontSize: '12px', color: '#666' }}>
                  值表达式（支持变量）
                </div>
                <Input
                  placeholder="例如：{{$executor.result.title}} 或 {{$trigger.record.name}}"
                  value={mapping.valueExpression}
                  onChange={(e) => handleMappingChange(index, 'valueExpression', e.target.value)}
                />
              </div>
            </div>
          </Card>
        ))}

        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={handleAddMapping}
          style={{ width: '100%' }}
          disabled={formFields.length === 0}
        >
          {formFields.length === 0 ? '无可用字段' : '添加字段映射'}
        </Button>

        {formFields.length === 0 && (
          <div style={{
            padding: '8px 12px',
            background: '#fff7e6',
            border: '1px solid #ffd591',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#d46b08'
          }}>
            当前表单中没有可用的字段，请确保此配置在包含表单字段的页面中使用。
          </div>
        )}

        {/* 变量说明 */}
        <div style={{ 
          padding: '8px 12px', 
          background: '#f0f9ff', 
          border: '1px solid #e6f4ff', 
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>支持的变量：</div>
          <div>• <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '2px' }}>{'{{$trigger}}'}</code> - 触发器传入的数据</div>
          <div>• <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '2px' }}>{'{{$executor}}'}</code> - 执行器返回的结果</div>
          <div>• <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '2px' }}>{'{{$system.timestamp}}'}</code> - 当前时间戳</div>
          <div>• <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '2px' }}>{'{{$utils.formatJSON($executor)}}'}</code> - JSON格式化输出</div>
        </div>
      </div>
    );
  };
}