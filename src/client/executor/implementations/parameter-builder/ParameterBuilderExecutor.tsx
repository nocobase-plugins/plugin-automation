/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Button, Card, Divider, Input, Select, Space, Switch, Modal, Form, message } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';

const { TextArea } = Input;
import { BaseExecutor } from '../../core/base';
import { ExecutionContext, ParameterField } from '../../../core/types';

// 参数收集异常类
class ParameterCollectionCancelled extends Error {
  constructor(message = 'Parameter collection was cancelled') {
    super(message);
    this.name = 'ParameterCollectionCancelled';
  }
}

const ParameterBuilderConfigComponent: React.FC<{
  value?: any;
  onChange?: (value: any) => void;
}> = ({ value = {}, onChange }) => {
  const handleChange = (key: string, val: any) => {
    onChange?.({
      ...value,
      [key]: val,
    });
  };

  const handleFieldChange = (index: number, field: string, val: any) => {
    const fields = [...(value.fields || [])];
    if (!fields[index]) fields[index] = {};
    fields[index][field] = val;
    
    // 当字段类型改为select时，初始化options数组
    if (field === 'fieldType' && val === 'select' && !fields[index].options) {
      fields[index].options = [];
    }
    
    handleChange('fields', fields);
  };

  const addField = () => {
    const fields = [...(value.fields || []), { fieldLabel: '', fieldKey: '', fieldType: 'input', options: [] }];
    handleChange('fields', fields);
  };

  const removeField = (index: number) => {
    const fields = (value.fields || []).filter((_, i) => i !== index);
    handleChange('fields', fields);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 弹窗标题 */}
      <div>
        <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
          弹窗标题
        </div>
        <Input
          placeholder="请输入执行参数"
          value={value.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
        />
      </div>

      {/* 配置模式切换 */}
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8
      }}>
        <div style={{ fontSize: '12px', color: '#666' }}>
          参数字段配置
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#666' }}>函数配置</span>
          <Switch
            size="small"
            checked={value.mode === 'function'}
            onChange={(checked) => handleChange('mode', checked ? 'function' : 'ui')}
          />
        </div>
      </div>

      {value.mode === 'function' ? (
        /* 函数构造器 */
        <div>
          <div style={{ fontSize: '11px', color: '#999', marginBottom: 8 }}>
            编写JavaScript函数返回参数字段数组，可读取context中的执行器结果
          </div>
          <TextArea
            rows={8}
            placeholder={`// 返回参数字段数组的函数
function buildParameters(context) {
  // context包含: trigger, event, user, timestamp 以及之前executor的结果
  // 返回格式: [{ fieldLabel: '字段名', fieldKey: 'key', fieldType: 'input', options: [{ label: '显示文本', value: '实际值' }] }]
  
  return [
    { fieldLabel: '用户名', fieldKey: 'username', fieldType: 'input' },
    { fieldLabel: '用户类型', fieldKey: 'userType', fieldType: 'select', options: [
        { label: '管理员', value: 'admin' },
        { label: '普通用户', value: 'user' }
      ] 
    }
  ];
}`}
            value={value.functionCode || ''}
            onChange={(e) => handleChange('functionCode', e.target.value)}
          />
        </div>
      ) : (
        /* 参数字段配置 */
        <div>
          <Card size="small" style={{ background: '#fafafa' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(value.fields || []).map((field, index) => (
                <div key={index} style={{ marginBottom: '8px' }}>
                  <Space.Compact style={{ display: 'flex', width: '100%' }}>
                    <Input
                      placeholder="字段名称"
                      value={field.fieldLabel || ''}
                      onChange={(e) => handleFieldChange(index, 'fieldLabel', e.target.value)}
                      style={{ width: '30%' }}
                    />
                    <Input
                      placeholder="字段键"
                      value={field.fieldKey || ''}
                      onChange={(e) => handleFieldChange(index, 'fieldKey', e.target.value)}
                      style={{ width: '40%' }}
                    />
                    <Select
                      placeholder="字段类型"
                      value={field.fieldType || 'input'}
                      onChange={(val) => handleFieldChange(index, 'fieldType', val)}
                      style={{ width: '20%' }}
                      options={[
                        { label: '文本', value: 'input' },
                        { label: '多行文本', value: 'textarea' },
                        { label: '数字', value: 'number' },
                        { label: '选择', value: 'select' },
                        { label: '开关', value: 'switch' },
                      ]}
                    />
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeField(index)}
                      style={{ width: '10%' }}
                    />
                  </Space.Compact>
                  {/* 选择类型字段的选项配置 */}
                  {field.fieldType === 'select' && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>选项配置：</div>
                      <Card size="small" style={{ background: '#f8f9fa' }}>
                        {(field.options || []).map((option, optIndex) => (
                          <div key={optIndex} style={{ marginBottom: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <Input
                              placeholder="显示文本"
                              value={option.label || ''}
                              onChange={(e) => {
                                const newOptions = [...(field.options || [])];
                                newOptions[optIndex] = { ...newOptions[optIndex], label: e.target.value };
                                handleFieldChange(index, 'options', newOptions);
                              }}
                              style={{ flex: 1 }}
                            />
                            <Input
                              placeholder="实际值"
                              value={option.value || ''}
                              onChange={(e) => {
                                const newOptions = [...(field.options || [])];
                                newOptions[optIndex] = { ...newOptions[optIndex], value: e.target.value };
                                handleFieldChange(index, 'options', newOptions);
                              }}
                              style={{ flex: 1 }}
                            />
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => {
                                const newOptions = (field.options || []).filter((_, i) => i !== optIndex);
                                handleFieldChange(index, 'options', newOptions);
                              }}
                              size="small"
                            />
                          </div>
                        ))}
                        <Button
                          type="dashed"
                          icon={<PlusOutlined />}
                          onClick={() => {
                            const newOptions = [...(field.options || []), { label: '', value: '' }];
                            handleFieldChange(index, 'options', newOptions);
                          }}
                          style={{ width: '100%' }}
                          size="small"
                        >
                          添加选项
                        </Button>
                      </Card>
                    </div>
                  )}
                </div>
              ))}
              <Button
                type="dashed"
                onClick={addField}
                icon={<PlusOutlined />}
                style={{ width: '100%' }}
              >
                添加字段
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

/**
 * 参数构造器执行器类
 */
export class ParameterBuilderExecutor extends BaseExecutor {
  public readonly key = 'parameter-builder';
  public readonly label = '参数构造器';
  public readonly description = '收集用户输入参数，支持UI配置和函数两种模式';
  public readonly ConfigComponent = ParameterBuilderConfigComponent;
  
  async execute(triggerParams: any, context: ExecutionContext) {
    const config = context.config || {};
    
    let configFields: any[] = [];
    
    try {
      if (config.mode === 'function' && config.functionCode) {
        // 函数模式：执行用户定义的函数
        const builderContext = {
          trigger: triggerParams,
          event: { type: context.event, data: triggerParams },
          user: { id: 'current-user', name: '当前用户' },
          timestamp: context.timestamp.getTime(),
          ...context, // 包含之前executor的所有结果
        };
        
        try {
          let result;
          const code = config.functionCode.trim();
          
          // 检测函数类型并执行
          if (code.startsWith('(') && code.includes('=>')) {
            // 箭头函数：(context) => { ... }
            // eslint-disable-next-line no-new-func
            const func = new Function('context', `return (${code})(context);`);
            result = func(builderContext);
          } else if (code.startsWith('function')) {
            // 函数声明：function buildParameters(context) { ... }
            // eslint-disable-next-line no-new-func
            const func = new Function('context', `${code}\nreturn buildParameters(context);`);
            result = func(builderContext);
          } else {
            // 函数体：直接作为函数体执行
            // eslint-disable-next-line no-new-func
            const func = new Function('context', code + '\nreturn buildParameters ? buildParameters(context) : [];');
            result = func(builderContext);
          }
          
          configFields = result;
        } catch (error) {
          console.error('函数执行失败:', error);
          throw new Error(`函数执行失败: ${error.message}`);
        }
        
        if (!Array.isArray(configFields)) {
          throw new Error('函数必须返回参数字段数组');
        }
        
      } else if (config.fields) {
        // UI模式：使用配置的字段，需要转换字段格式
        configFields = config.fields;
      }

      let fields: ParameterField[] = configFields.map(field => ({
          key: field.fieldKey,
          label: field.fieldLabel,
          type: field.fieldType || 'input',
          required: true,
          options: field.fieldType === 'select' && field.options 
            ? field.options // 直接使用配置的options，因为已经是{label, value}格式
            : undefined
        }));
      
      if (fields.length > 0) {
        const modalTitle = config.title || '请输入执行参数';
        
        // 使用Modal.confirm但手动控制关闭行为
        const userInputData = await new Promise<Record<string, any>>((resolve, reject) => {
          let formRef: any = null;
          
          const modal = Modal.confirm({
            title: modalTitle,
            icon: null,
            okText: '确定',
            cancelText: '取消',
            content: (
              <Form
                ref={(ref) => { formRef = ref; }}
                layout="vertical"
              >
                {fields.map((field) => (
                  <Form.Item
                    key={field.key}
                    name={field.key}
                    label={field.label}
                    rules={field.required ? [{ required: true, message: `请输入${field.label}` }] : []}
                  >
                    {field.type === 'textarea' ? (
                      <Input.TextArea 
                        placeholder={field.placeholder || `请输入${field.label}`}
                        rows={3}
                      />
                    ) : field.type === 'number' ? (
                      <Input 
                        type="number" 
                        placeholder={field.placeholder || `请输入${field.label}`}
                      />
                    ) : field.type === 'switch' ? (
                      <Switch defaultChecked={field.defaultValue} />
                    ) : field.type === 'select' ? (
                      <Select
                        placeholder={field.placeholder || `请选择${field.label}`}
                        options={field.options?.map(option => ({
                          label: option.label,
                          value: typeof option.value === 'object' 
                            ? JSON.stringify(option.value)  // 对象序列化为字符串
                            : option.value
                        })) || []}
                      />
                    ) : (
                      <Input 
                        placeholder={field.placeholder || `请输入${field.label}`}
                        defaultValue={field.defaultValue}
                      />
                    )}
                  </Form.Item>
                ))}
              </Form>
            ),
            onOk: async () => {
              try {
                const values = await formRef?.validateFields();
                
                // 检查必填字段是否都有值
                const hasEmptyRequired = fields.some(field => 
                  field.required && (!values[field.key] || String(values[field.key]).trim() === '')
                );
                
                if (hasEmptyRequired) {
                  message.error('请填写所有必填字段');
                  return Promise.reject(); // 阻止Modal关闭
                }
                
                // 处理 select 字段的对象值反序列化
                const processedValues = { ...values };
                fields.forEach(field => {
                  if (field.type === 'select' && processedValues[field.key]) {
                    const stringValue = processedValues[field.key];
                    // 尝试解析 JSON 字符串回对象
                    try {
                      const parsedValue = JSON.parse(stringValue);
                      if (typeof parsedValue === 'object') {
                        processedValues[field.key] = parsedValue;
                      }
                    } catch (e) {
                      // 如果解析失败，保持原值（可能是普通字符串）
                    }
                  }
                });
                
                modal.destroy();
                resolve(processedValues || {});
                return Promise.resolve(); // 允许关闭
              } catch (error) {
                // 验证失败，显示提示
                message.error('请检查输入内容并完善必填字段');
                return Promise.reject(); // 阻止Modal关闭
              }
            },
            onCancel: () => {
              modal.destroy();
              reject(new ParameterCollectionCancelled('User cancelled parameter collection'));
            },
          });
        });
        
        // 统一返回格式，与其他executor一致
        return {
          success: true,
          data: userInputData, // 用户输入的数据
          executedAt: new Date(),
          executorKey: 'parameter-builder',
          metadata: {
            fields, // 字段定义信息
            mode: config.mode || 'ui'
          }
        };
      }
      
      return {
        success: true,
        data: {},
        executedAt: new Date(),
        executorKey: 'parameter-builder',
        metadata: {
          fields: [],
          mode: config.mode || 'ui'
        }
      };
      
    } catch (error) {
      if (error instanceof ParameterCollectionCancelled) {
        throw error; // 重新抛出参数收集异常
      }
      console.error('参数构造器执行失败:', error);
      throw new Error(`参数构造器执行失败: ${error.message}`);
    }
  }
}