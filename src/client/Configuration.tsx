/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, SchemaComponentsContext, useFieldSchema, useForm, useField, observer } from '@formily/react';
import { FormPath } from '@formily/shared';
import { SchemaSettingsActionModalItem, useDesignable, useFieldComponentName, Tabs } from '@nocobase/client';
import React, { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Space, Switch } from 'antd';
import { ArrayItems } from '@formily/antd-v5';
import { NAMESPACE, SETTINGS_KEY } from './constant';
import { EventDefinition } from './core/types';
import { executorRegistry } from './executor';
import { actionRegistry } from './action';
import { eventRegistry } from './trigger/core/EventRegistry';

export function Configuration() {
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const form = useForm();
  const fieldSchema = useFieldSchema();
  const fieldComponentName = useFieldComponentName();
  
  const components = useContext(SchemaComponentsContext);
  const component = FormPath.getIn(components, fieldComponentName);
  
  // 调试信息
  console.log('=== 配置组件调试信息 ===');
  console.log('fieldComponentName:', fieldComponentName);
  console.log('fieldSchema x-component:', fieldSchema?.['x-component']);
  console.log('FormPath component type:', typeof component);
  console.log('components context available:', !!components);
  console.log('total registered components:', Object.keys(components || {}).length);
  
  // 统一的自动化事件检测逻辑 - 使用事件注册中心
  const getComponentEvents = (): EventDefinition[] => {
    const schemaComponent = fieldSchema?.['x-component'];
    
    console.log('=== 统一事件检测 ===');
    console.log('Schema组件:', schemaComponent);
    console.log('实际组件:', fieldComponentName);
    
    // 优先使用实际渲染的组件名（fieldComponentName）
    // 因为 CollectionField 等代理组件会动态选择实际的渲染组件
    const targetComponent = fieldComponentName || schemaComponent;
    
    if (!targetComponent) {
      console.log('✗ 未找到目标组件名称');
      return [];
    }
    
    console.log('目标组件:', targetComponent);
    
    // 直接从事件注册中心获取事件
    const events = eventRegistry.getEvents(targetComponent);
    
    if (events.length > 0) {
      console.log(`✓ 找到组件事件: ${targetComponent}`, events);
      return events;
    } else {
      console.log(`✗ 组件 "${targetComponent}" 未注册自动化事件`);
      console.log('已注册的组件:', eventRegistry.getAllComponents());
      return [];
    }
  };
  
  const componentEvents = getComponentEvents();

  // 获取所有可用的执行器和动作器
  const availableExecutors = executorRegistry.getAll();
  const availableActions = actionRegistry.getAll();

  console.log('=== 配置组件状态 ===');
  console.log('检测到的事件:', componentEvents);
  console.log('可用执行器:', availableExecutors.length);  
  console.log('可用动作器:', availableActions.length);

  return (
    <SchemaSettingsActionModalItem
      title={t('Configure Automation', { ns: NAMESPACE })}
      width={800}
      scope={{
        fieldFilter(field) {
          // return ['belongsTo', 'hasOne'].includes(field.type);
          return true;
        },
      }}
      // components={{
      //   Alert,
      //   ArrayTable,
      //   WorkflowSelect,
      // }}
      schema={
        {
          type: 'void',
          title: t('Configure Automation', { ns: NAMESPACE }),
          properties: {
            // 如果没有支持的事件，显示提示信息
            ...(componentEvents.length === 0 ? {
              noEventsMessage: {
                type: 'void',
                'x-component': 'Alert',
                'x-component-props': {
                  message: t('This component does not support any automation events', { ns: NAMESPACE }),
                  type: 'info',
                  showIcon: true,
                },
              }
            } : {
              // 创建事件配置的 Tabs
              eventTabs: {
                type: 'void',
                'x-component': 'Tabs',
                'x-component-props': {
                  type: 'card',
                  size: 'large',
                  style: {
                    '.ant-tabs-content-holder': {
                      padding: '24px',
                      backgroundColor: '#fafafa',
                      borderRadius: '8px',
                      marginTop: '16px',
                    },
                  },
                },
                properties: componentEvents.reduce((tabs, event, index) => {
                  tabs[`tab_${event.key}`] = {
                    type: 'void',
                    title: event.label || event.key,
                    'x-component': 'Tabs.TabPane',
                    'x-component-props': {
                      key: event.key,
                    },
                    properties: {
                      [`eventConfig_${event.key}`]: {
                        type: 'object',
                        properties: {
                          // 执行器配置区域 - 支持多个执行器按顺序执行
                          executorsSection: {
                            type: 'void',
                            'x-component': 'Card',
                            'x-component-props': {
                              title: '执行器配置（支持多个执行器按顺序执行）',
                              size: 'small',
                              style: { 
                                marginBottom: 24,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              },
                            },
                            properties: {
                              [`executors_${event.key}`]: {
                                type: 'array',
                                title: '执行器列表',
                                'x-decorator': 'FormItem',
                                'x-decorator-props': {
                                  style: { marginTop: 8 },
                                },
                                'x-component': 'ArrayItems',
                                'x-component-props': {
                                  style: { 
                                    width: '100%',
                                    '.ant-formily-array-items-item': {
                                      marginBottom: '16px',
                                    },
                                  },
                                },
                                items: {
                                  type: 'object',
                                  'x-component': 'div',
                                  'x-component-props': {
                                    style: { 
                                      marginBottom: 8,
                                      padding: 16,
                                      border: '1px solid #e8e8e8',
                                      borderRadius: 6,
                                      backgroundColor: '#fafafa',
                                    },
                                  },
                                  properties: {
                                    space: {
                                      type: 'void',
                                      'x-component': 'Space',
                                      'x-component-props': {
                                        style: { display: 'flex', alignItems: 'center', width: '100%' },
                                      },
                                      properties: {
                                        sort: {
                                          type: 'void',
                                          'x-component': 'ArrayItems.SortHandle',
                                        },
                                        executorLabel: {
                                          type: 'void',
                                          'x-component': 'span',
                                          'x-content': '执行器:',
                                          'x-component-props': {
                                            style: { 
                                              marginRight: 8,
                                              fontWeight: 500,
                                              color: '#262626',
                                              lineHeight: '32px',
                                            },
                                          },
                                        },
                                        key: {
                                          type: 'string',
                                          'x-decorator': 'FormItem',
                                          'x-decorator-props': {
                                            style: { marginBottom: 0 },
                                          },
                                          'x-component': 'Select',
                                          'x-component-props': {
                                            placeholder: '请选择执行器',
                                            style: { minWidth: 200 },
                                            allowClear: true,
                                          },
                                          enum: availableExecutors.map(executor => ({
                                            label: executor.label || executor.key,
                                            value: executor.key,
                                          })),
                                          required: true,
                                        },
                                        enabled: {
                                          type: 'boolean',
                                          title: '启用',
                                          'x-decorator': 'FormItem',
                                          'x-decorator-props': {
                                            style: { marginBottom: 0, marginLeft: 8 },
                                          },
                                          'x-component': 'Switch',
                                          'x-component-props': {
                                            size: 'small',
                                          },
                                          default: true,
                                        },
                                        remove: {
                                          type: 'void',
                                          'x-component': 'ArrayItems.Remove',
                                        },
                                      },
                                    },
                                    executorConfig: {
                                      type: 'void',
                                      'x-component': 'ExecutorConfigRenderer',
                                      'x-component-props': {
                                        eventKey: event.key,
                                        context: { form },
                                        isMultiple: true,
                                      },
                                    },
                                  },
                                },
                                properties: {
                                  add: {
                                    type: 'void',
                                    title: '添加执行器',
                                    'x-component': 'ArrayItems.Addition',
                                    'x-component-props': {
                                      type: 'dashed',
                                      block: true,
                                      size: 'large',
                                      style: {
                                        borderColor: '#1890ff',
                                        color: '#1890ff',
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                          // 动作器选择区域
                          actionsSection: {
                            type: 'void',
                            'x-component': 'Card',
                            'x-component-props': {
                              title: '动作器配置',
                              size: 'small',
                              style: { 
                                marginTop: 24,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              },
                            },
                            properties: {
                              [`actions_${event.key}`]: {
                                type: 'array',
                                title: t('Select Actions', { ns: NAMESPACE }),
                                'x-decorator': 'FormItem',
                                'x-decorator-props': {
                                  style: { marginTop: 16 },
                                },
                                'x-component': 'ArrayItems',
                                'x-component-props': {
                                  style: { 
                                    width: '100%',
                                    '.ant-formily-array-items-item': {
                                      marginBottom: '16px',
                                    },
                                  },
                                },
                                items: {
                                  type: 'object',
                                  'x-component': 'div',
                                  'x-component-props': {
                                    style: { 
                                      marginBottom: 8,
                                      padding: 16,
                                      border: '1px solid #e8e8e8',
                                      borderRadius: 6,
                                      backgroundColor: '#fafafa',
                                    },
                                  },
                                  properties: {
                                    space: {
                                      type: 'void',
                                      'x-component': 'Space',
                                      'x-component-props': {
                                        style: { display: 'flex', alignItems: 'center', width: '100%' },
                                      },
                                      properties: {
                                        sort: {
                                          type: 'void',
                                          'x-component': 'ArrayItems.SortHandle',
                                        },
                                        actionLabel: {
                                          type: 'void',
                                          'x-component': 'span',
                                          'x-content': t('Action', { ns: NAMESPACE }) + ':',
                                          'x-component-props': {
                                            style: { 
                                              marginRight: 8,
                                              fontWeight: 500,
                                              color: '#262626',
                                              lineHeight: '32px', // 对齐Select的高度
                                            },
                                          },
                                        },
                                        actionKey: {
                                          type: 'string',
                                          'x-decorator': 'FormItem',
                                          'x-decorator-props': {
                                            style: { marginBottom: 0 },
                                          },
                                          'x-component': 'Select',
                                          'x-component-props': {
                                            placeholder: t('Please select an action', { ns: NAMESPACE }),
                                            style: { minWidth: 200 },
                                          },
                                          enum: availableActions.map(action => ({
                                            label: action.label || action.key,
                                            value: action.key,
                                          })),
                                          required: true,
                                        },
                                        enabled: {
                                          type: 'boolean',
                                          title: '启用',
                                          'x-decorator': 'FormItem',
                                          'x-decorator-props': {
                                            style: { marginBottom: 0, marginLeft: 8 },
                                          },
                                          'x-component': 'Switch',
                                          'x-component-props': {
                                            size: 'small',
                                          },
                                          default: true,
                                        },
                                        remove: {
                                          type: 'void',
                                          'x-component': 'ArrayItems.Remove',
                                        },
                                      },
                                    },
                                    actionConfig: {
                                      type: 'void',
                                      'x-component': 'ActionConfigRenderer',
                                      'x-component-props': {
                                        eventKey: event.key,
                                        context: { form }
                                      },
                                    },
                                  },
                                },
                                properties: {
                                  add: {
                                    type: 'void',
                                    title: t('Add Action', { ns: NAMESPACE }),
                                    'x-component': 'ArrayItems.Addition',
                                    'x-component-props': {
                                      type: 'dashed',
                                      block: true,
                                      size: 'large',
                                      style: {
                                        borderColor: '#52c41a',
                                        color: '#52c41a',
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  };
                  return tabs;
                }, {} as any),
              },
            }),
          },
        } as ISchema
      }
      initialValues={useMemo(() => {
        console.log('=== useMemo 被触发 ===');
        console.log('fieldSchema:', fieldSchema);
        // 使用标准的 x-component-props 存储配置
        const componentProps = fieldSchema?.['x-component-props'] || {};
        console.log('fieldSchema[x-component-props] 完整内容:', JSON.stringify(componentProps, null, 2));
        
        const currentConfig = componentProps?.automationConfiguration || { eventConfigs: {} };
        const initialValues: any = {};
        
        console.log('=== 初始化表单值调试 ===');
        console.log('currentConfig:', JSON.stringify(currentConfig, null, 2));
        
        // 为每个事件设置初始值，匹配schema的嵌套结构
        componentEvents.forEach(event => {
          const eventConfig = currentConfig.eventConfigs[event.key];
          
          console.log(`=== 处理事件 ${event.key} ===`);
          console.log(`Event ${event.key} config:`, JSON.stringify(eventConfig, null, 2));
          
          // 初始化事件配置对象
          initialValues[`eventConfig_${event.key}`] = {};
          
          if (eventConfig) {
            // 执行器配置
            if (eventConfig.executors && eventConfig.executors.length > 0) {
              console.log(`原始执行器列表:`, JSON.stringify(eventConfig.executors, null, 2));
              
              const executorItems = eventConfig.executors.map((executor: any) => ({
                key: executor.key,
                params: executor.params || {},
                enabled: executor.enabled !== undefined ? executor.enabled : true, // 默认启用
              }));
              
              initialValues[`eventConfig_${event.key}`][`executors_${event.key}`] = executorItems;
              console.log(`设置执行器配置:`, executorItems);
            }
            
            // 动作器配置 - 从 params 字段中恢复配置
            if (eventConfig.actions && eventConfig.actions.length > 0) {
              initialValues[`eventConfig_${event.key}`][`actions_${event.key}`] = eventConfig.actions.map(action => {
                // 从 params 字段中读取配置
                const actionConfig = action.params || {};
                
                return {
                  actionKey: action.key,
                  actionConfig: actionConfig,
                  enabled: action.enabled !== undefined ? action.enabled : true, // 默认启用
                };
              });
              console.log(`设置动作器配置:`, eventConfig.actions);
            }
          }
        });
        
        console.log('最终初始值:', initialValues);
        return initialValues;
      }, [componentEvents, fieldSchema])}
      onSubmit={(values) => {
        console.log('=== 保存时表单值调试 ===');
        
        // 构建自动化配置 - 基于现有配置，不要覆盖其他事件的配置
        const currentConfig = fieldSchema?.[SETTINGS_KEY] || { eventConfigs: {} };
        const automationConfig = {
          eventConfigs: { ...currentConfig.eventConfigs } as any,
        };
        
        componentEvents.forEach(event => {
          const eventConfig: any = {};
          const eventValues = values[`eventConfig_${event.key}`] || {};
          
          console.log(`事件 ${event.key} 的表单值:`, JSON.stringify(eventValues, null, 2));
          
          // 处理执行器列表
          const executors = eventValues[`executors_${event.key}`] || [];
          if (executors.length > 0) {
            console.log(`执行器列表配置:`, executors);
            eventConfig.executors = executors.map((executorItem: any) => ({
              key: executorItem.key,
              params: executorItem.params || {},
              enabled: executorItem.enabled !== undefined ? executorItem.enabled : true, // 默认启用
            }));
          }
          
          // 处理动作器 - 使用不同的字段名避免被过滤
          const actions = eventValues[`actions_${event.key}`];
          if (actions && actions.length > 0) {
            console.log(`动作器配置:`, actions);
            eventConfig.actions = actions.map((actionItem: any, index: number) => {
              console.log(`动作器 ${index}: key=${actionItem.actionKey}, config=`, actionItem.actionConfig);
              return {
                key: actionItem.actionKey,
                // 尝试使用不同的字段名
                params: actionItem.actionConfig || {},
                enabled: actionItem.enabled !== undefined ? actionItem.enabled : true, // 默认启用
              };
            });
          }
          
          // 只有配置了执行器或动作器的事件才保存
          if ((eventConfig.executors && eventConfig.executors.length > 0) || (eventConfig.actions && eventConfig.actions.length > 0)) {
            automationConfig.eventConfigs[event.key] = eventConfig;
          }
        });
        
        console.log('最终保存配置:', JSON.stringify(automationConfig, null, 2));
        
        // 使用标准的 x-component-props 存储配置
        const componentProps = fieldSchema['x-component-props'] || {};
        console.log('保存前 fieldSchema[x-component-props] 状态:', JSON.stringify(componentProps, null, 2));
        
        componentProps.automationConfiguration = automationConfig;
        fieldSchema['x-component-props'] = componentProps;
        console.log('保存后 fieldSchema[x-component-props] 状态:', JSON.stringify(componentProps, null, 2));
        
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-component-props': componentProps,
          },
        });
        dn.refresh();
      }}
      components={{
        Alert,
        ArrayItems,
        Space,
        Switch,
        Tabs,
        ExecutorConfigRenderer,
        ActionConfigRenderer,
        h4: (props: any) => <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold' }} {...props} />,
        div: 'div',
      }}
    />
  );
}

// 执行器配置渲染器组件 - 支持多执行器和单执行器
export const ExecutorConfigRenderer: React.FC<{ 
  eventKey: string; 
  context?: any; 
  isMultiple?: boolean;
}> = observer(({ eventKey, context, isMultiple = false }) => {
  const form = useForm();
  const field = useField();
  
  if (isMultiple) {
    // 多执行器模式：从ArrayItems的context中获取索引
    const fieldPath = field.address.toString();
    const pathParts = fieldPath.split('.');
    const executorIndex = pathParts.findIndex(part => part.match(/^\d+$/));
    const indexValue = executorIndex >= 0 ? pathParts[executorIndex] : null;
    
    if (indexValue === null) {
      return null;
    }
    
    // 使用正确的嵌套路径获取执行器值
    const executorKey = form.getValuesIn(`eventConfig_${eventKey}.executors_${eventKey}.${indexValue}.key`);
    
    console.log('ExecutorConfigRenderer(Multi) - eventKey:', eventKey, 'indexValue:', indexValue, 'executorKey:', executorKey);
    
    if (!executorKey) {
      console.log('No executor selected for index:', indexValue);
      return null;
    }
    
    const executor = executorRegistry.get(executorKey);
    if (!executor || !executor.ConfigComponent) {
      console.log('Executor not found or no config component:', executorKey);
      return null;
    }
    
    const ConfigComponent = executor.ConfigComponent;
    const configFieldName = `eventConfig_${eventKey}.executors_${eventKey}.${indexValue}.params`;
    
    console.log('ExecutorConfigRenderer(Multi) - configFieldName:', configFieldName);
    console.log('ExecutorConfigRenderer(Multi) - current config value:', form.getValuesIn(configFieldName));
    
    return (
      <div 
        style={{ 
          padding: 16, 
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6', 
          borderRadius: 6,
          borderLeft: '4px solid #17a2b8',
          marginTop: 8,
        }}
      >
        <div 
          style={{ 
            fontSize: '13px', 
            fontWeight: 500,
            color: '#495057', 
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {executor.label || executorKey} 配置选项
        </div>
        <ConfigComponent 
          value={form.getValuesIn(configFieldName) || {}} 
          onChange={(value) => {
            console.log('ExecutorConfigRenderer(Multi) - setting config value:', value, 'at path:', configFieldName);
            form.setValuesIn(configFieldName, value);
          }}
        />
      </div>
    );
  } else {
    // 单执行器模式：兼容原有逻辑
    const nestedExecutorFieldName = `eventConfig_${eventKey}.executor_${eventKey}`;
    const executorKey = form.getValuesIn(nestedExecutorFieldName);
    
    console.log('ExecutorConfigRenderer(Single) - eventKey:', eventKey, 'executorKey:', executorKey);
    
    if (!executorKey) {
      console.log('No executor selected, not rendering config');
      return null;
    }
    
    const executor = executorRegistry.get(executorKey);
    if (!executor || !executor.ConfigComponent) {
      console.log('Executor not found or no config component:', executorKey);
      return null;
    }
    
    const ConfigComponent = executor.ConfigComponent;
    const configFieldName = `eventConfig_${eventKey}.executorConfig_${eventKey}`;
    
    return (
      <div 
        style={{ 
          padding: 16, 
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6', 
          borderRadius: 6,
          borderLeft: '4px solid #17a2b8',
        }}
      >
        <div 
          style={{ 
            fontSize: '13px', 
            fontWeight: 500,
            color: '#495057', 
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          执行器配置选项
        </div>
        <ConfigComponent 
          value={form.getValuesIn(configFieldName)} 
          onChange={(value) => {
            console.log('ExecutorConfigRenderer(Single) - setting config value:', value, 'at path:', configFieldName);
            form.setValuesIn(configFieldName, value);
          }}
        />
      </div>
    );
  }
});

// 动作器配置渲染器组件
export const ActionConfigRenderer: React.FC<{ context: any; eventKey: string }> = observer(({ context, eventKey }) => {
  const form = useForm();
  const { form: formInstance } = context || {};
  const field = useField();
  const fieldPath = field.address.toString();
  
  // 从字段路径中提取动作器索引
  const pathParts = fieldPath.split('.');
  const actionIndex = pathParts.findIndex(part => part.match(/^\d+$/));
  const indexValue = actionIndex >= 0 ? pathParts[actionIndex] : null;
  
  if (indexValue === null) {
    return null;
  }
  
  // 使用正确的嵌套路径获取动作器值
  const actionKey = form.getValuesIn(`eventConfig_${eventKey}.actions_${eventKey}.${indexValue}.actionKey`);
  
  console.log('ActionConfigRenderer - eventKey:', eventKey, 'indexValue:', indexValue, 'actionKey:', actionKey);
  console.log('ActionConfigRenderer - using path:', `eventConfig_${eventKey}.actions_${eventKey}.${indexValue}`);
  console.log('ActionConfigRenderer - actions array:', form.getValuesIn(`eventConfig_${eventKey}.actions_${eventKey}`));
  
  if (!actionKey) {
    console.log('No action selected, not rendering config for index:', indexValue);
    return null;
  }
  
  const action = actionRegistry.get(actionKey);
  if (!action || !action.ConfigComponent) {
    return null;
  }
  
  const ConfigComponent = action.ConfigComponent;
  const configFieldName = `eventConfig_${eventKey}.actions_${eventKey}.${indexValue}.actionConfig`;
  const currentValue = form.getValuesIn(configFieldName);
  
  console.log('ActionConfigRenderer - configFieldName:', configFieldName, 'currentValue:', currentValue);
  
  return (
    <div 
      style={{ 
        marginTop: 12,
        padding: 12, 
        backgroundColor: '#f0f9f0',
        border: '1px solid #b7eb8f', 
        borderRadius: 4,
        borderLeft: '3px solid #52c41a',
      }}
    >
      <div 
        style={{ 
          fontSize: '12px', 
          fontWeight: 500,
          color: '#389e0d', 
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        配置选项
      </div>
      <ConfigComponent 
        context={{form: formInstance}}
        value={currentValue} 
        onChange={(value) => {
          console.log('ActionConfigRenderer - setting value:', value, 'at path:', configFieldName);
          form.setValuesIn(configFieldName, value);
        }}
      />
    </div>
  );
});
