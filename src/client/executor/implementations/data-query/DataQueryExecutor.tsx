/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useEffect } from 'react';
import { 
  Select, 
  Input, 
  Card, 
  Space, 
  Button, 
  Form, 
  InputNumber, 
  Switch,
  Divider,
  Typography,
  Row,
  Col,
  Tag,
  Tooltip
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  DatabaseOutlined, 
  SearchOutlined,
  FilterOutlined 
} from '@ant-design/icons';
import { BaseExecutor } from '../../core/base';
import { ExecutionContext } from '../../../core/types';
import { APIClient, useAPIClient, useCollectionManager } from '@nocobase/client';
import { compileAutomationObject } from '../../../core/compile';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

interface QueryCondition {
  field: string;
  operator: string;
  value: any;
  logical?: 'and' | 'or';
}

interface DataQueryConfig {
  collection?: string;
  conditions?: QueryCondition[];
  fields?: string[];
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  limit?: number;
  offset?: number;
  enablePagination?: boolean;
}

/**
 * 数据查询执行器配置组件
 */
const DataQueryConfigComponent: React.FC<{
  value?: DataQueryConfig;
  onChange?: (value: DataQueryConfig) => void;
}> = ({ value: currentValue = {}, onChange }) => {
  const api = useAPIClient();
  const cm = useCollectionManager();
  const [collections, setCollections] = useState([]);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);

  // 获取数据表列表
  useEffect(() => {
    const loadCollections = async () => {
      try {
        setLoading(true);
        const response = await api.request({
          url: 'collections:list',
          method: 'get',
          params: {
            paginate: false,
          },
        });
        setCollections(response.data?.data || []);
      } catch (error) {
        console.error('Failed to load collections:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCollections();
  }, [api]);

  // 当选择数据表时，加载字段信息
  useEffect(() => {
    const loadFields = async () => {
      if (!currentValue.collection) {
        setFields([]);
        return;
      }

      try {
        const collection = cm.getCollection(currentValue.collection);
        if (collection) {
          const collectionFields = Object.values(collection.fields || {}).map((field: any) => ({
            name: field.name,
            type: field.type,
            title: field.uiSchema?.title || field.name,
            interface: field.interface
          }));
          setFields(collectionFields);
        }
      } catch (error) {
        console.error('Failed to load fields:', error);
        setFields([]);
      }
    };

    loadFields();
  }, [currentValue.collection, cm]);

  const handleChange = (key: string, val: any) => {
    const newValue = { ...currentValue, [key]: val };
    onChange?.(newValue);
  };

  const handleConditionChange = (index: number, key: string, val: any) => {
    const conditions = [...(currentValue.conditions || [])];
    conditions[index] = { ...conditions[index], [key]: val };
    handleChange('conditions', conditions);
  };

  const addCondition = () => {
    const conditions = [...(currentValue.conditions || [])];
    conditions.push({
      field: '',
      operator: '$eq',
      value: '',
      logical: 'and'
    });
    handleChange('conditions', conditions);
  };

  const removeCondition = (index: number) => {
    const conditions = [...(currentValue.conditions || [])];
    conditions.splice(index, 1);
    handleChange('conditions', conditions);
  };

  const operatorOptions = [
    { value: '$eq', label: '等于 (=)' },
    { value: '$ne', label: '不等于 (≠)' },
    { value: '$gt', label: '大于 (>)' },
    { value: '$gte', label: '大于等于 (≥)' },
    { value: '$lt', label: '小于 (<)' },
    { value: '$lte', label: '小于等于 (≤)' },
    { value: '$in', label: '包含在 (IN)' },
    { value: '$notIn', label: '不包含在 (NOT IN)' },
    { value: '$like', label: '模糊匹配 (LIKE)' },
    { value: '$notLike', label: '不匹配 (NOT LIKE)' },
    { value: '$null', label: '为空 (IS NULL)' },
    { value: '$notNull', label: '不为空 (IS NOT NULL)' },
  ];

  return (
    <div style={{ maxWidth: '100%' }}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        
        {/* 数据表选择 */}
        <Card size="small" title={<><DatabaseOutlined /> 数据表配置</>}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
                选择数据表
              </div>
              <Select
                style={{ width: '100%' }}
                placeholder="请选择要查询的数据表"
                value={currentValue.collection}
                onChange={(val) => handleChange('collection', val)}
                loading={loading}
                showSearch
                filterOption={(input, option) =>
                  String(option?.children).toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {collections.map((collection: any) => (
                  <Option key={collection.name} value={collection.name}>
                    {collection.title || collection.name}
                  </Option>
                ))}
              </Select>
            </div>
            
            {currentValue.collection && (
              <div style={{ fontSize: '12px', color: '#999' }}>
                已选择数据表: <Tag color="blue">{currentValue.collection}</Tag>
                可用字段: {fields.length} 个
              </div>
            )}
          </Space>
        </Card>

        {/* 查询条件配置 */}
        {currentValue.collection && (
          <Card size="small" title={<><FilterOutlined /> 查询条件</>}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {(currentValue.conditions || []).map((condition, index) => (
                <Card key={index} size="small" style={{ backgroundColor: '#fafafa' }}>
                  <Row gutter={[8, 8]}>
                    {index > 0 && (
                      <Col span={3}>
                        <Select
                          size="small"
                          value={condition.logical || 'and'}
                          onChange={(val) => handleConditionChange(index, 'logical', val)}
                          style={{ width: '100%' }}
                        >
                          <Option value="and">AND</Option>
                          <Option value="or">OR</Option>
                        </Select>
                      </Col>
                    )}
                    
                    <Col span={index > 0 ? 7 : 10}>
                      <Select
                        size="small"
                        placeholder="选择字段"
                        value={condition.field}
                        onChange={(val) => handleConditionChange(index, 'field', val)}
                        style={{ width: '100%' }}
                        showSearch
                      >
                        {fields.map((field: any) => (
                          <Option key={field.name} value={field.name}>
                            <Tooltip title={`类型: ${field.type}`}>
                              {field.title || field.name}
                            </Tooltip>
                          </Option>
                        ))}
                      </Select>
                    </Col>
                    
                    <Col span={6}>
                      <Select
                        size="small"
                        placeholder="操作符"
                        value={condition.operator}
                        onChange={(val) => handleConditionChange(index, 'operator', val)}
                        style={{ width: '100%' }}
                      >
                        {operatorOptions.map(op => (
                          <Option key={op.value} value={op.value}>
                            {op.label}
                          </Option>
                        ))}
                      </Select>
                    </Col>
                    
                    <Col span={6}>
                      <Input
                        size="small"
                        placeholder="值 (支持变量)"
                        value={condition.value}
                        onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
                      />
                    </Col>
                    
                    <Col span={2}>
                      <Button
                        size="small"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeCondition(index)}
                      />
                    </Col>
                  </Row>
                </Card>
              ))}
              
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addCondition}
                block
                size="small"
              >
                添加查询条件
              </Button>
            </Space>
          </Card>
        )}

        {/* 查询选项 */}
        {currentValue.collection && (
          <Card size="small" title={<><SearchOutlined /> 查询选项</>}>
            <Space direction="vertical" style={{ width: '100%' }}>
              
              {/* 字段选择 */}
              <div>
                <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
                  返回字段 (留空返回所有字段)
                </div>
                <Select
                  mode="multiple"
                  placeholder="选择要返回的字段"
                  value={currentValue.fields}
                  onChange={(val) => handleChange('fields', val)}
                  style={{ width: '100%' }}
                  maxTagCount="responsive"
                >
                  {fields.map((field: any) => (
                    <Option key={field.name} value={field.name}>
                      {field.title || field.name}
                    </Option>
                  ))}
                </Select>
              </div>

              {/* 分页配置 */}
              <Row gutter={16}>
                <Col span={8}>
                  <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
                    启用分页
                  </div>
                  <Switch
                    checked={currentValue.enablePagination}
                    onChange={(val) => handleChange('enablePagination', val)}
                  />
                </Col>
                
                {currentValue.enablePagination && (
                  <>
                    <Col span={8}>
                      <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
                        每页数量
                      </div>
                      <InputNumber
                        min={1}
                        max={1000}
                        value={currentValue.limit || 20}
                        onChange={(val) => handleChange('limit', val)}
                        style={{ width: '100%' }}
                      />
                    </Col>
                    
                    <Col span={8}>
                      <div style={{ marginBottom: 8, fontSize: '12px', color: '#666' }}>
                        偏移量
                      </div>
                      <InputNumber
                        min={0}
                        value={currentValue.offset || 0}
                        onChange={(val) => handleChange('offset', val)}
                        style={{ width: '100%' }}
                      />
                    </Col>
                  </>
                )}
              </Row>
            </Space>
          </Card>
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
          <div>• <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '2px' }}>{'{{$context.trigger.*}}'}</code> - 触发器数据</div>
          <div>• <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '2px' }}>{'{{$context.executors[*].data.*}}'}</code> - 执行器数据</div>
          <div>• <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: '2px' }}>{'{{$system.timestamp}}'}</code> - 系统时间戳</div>
        </div>
      </Space>
    </div>
  );
};

/**
 * 数据查询执行器
 * 根据配置的查询条件查询数据表并返回结果
 */
export class DataQueryExecutor extends BaseExecutor {
  public readonly key = 'data-query';
  public readonly label = '数据查询器';
  public readonly description = '查询数据表并返回匹配的记录';
  public readonly ConfigComponent = DataQueryConfigComponent;

  async execute(triggerParams: any, context: ExecutionContext): Promise<any> {
    console.log('=== Data Query Executor ===');
    console.log('Trigger Params:', triggerParams);
    console.log('Execution Context:', context);
    console.log('Query Config:', context.config);
    console.log('===========================');

    // 统一上下文管理
    const enrichedContext: ExecutionContext = {
      ...context,
      trigger: triggerParams
    };
    
    // 编译配置，支持变量替换
    const rawConfig = context.config || {};
    const config: DataQueryConfig = compileAutomationObject(rawConfig, enrichedContext);
    
    if (!config.collection) {
      return {
        success: false,
        data: null,
        executedAt: new Date(),
        executorKey: 'data-query',
        metadata: { error: '未指定数据表' }
      };
    }

    try {
      // 获取API客户端
      const apiClient = context.apiClient as APIClient;
      if (!apiClient) {
        throw new Error('API客户端不可用');
      }

      // 构建查询参数
      const queryParams: any = {};
      
      // 构建过滤条件
      if (config.conditions && config.conditions.length > 0) {
        const filter: any = {};
        
        config.conditions.forEach((condition, index) => {
          if (!condition.field || !condition.operator) return;
          
          const { field, operator, value, logical = 'and' } = condition;
          
          // 根据操作符构建条件
          let conditionValue = value;
          if (operator === '$in' || operator === '$notIn') {
            // 处理数组值
            conditionValue = Array.isArray(value) ? value : (value ? value.split(',').map(v => v.trim()) : []);
          } else if (operator === '$null' || operator === '$notNull') {
            // 空值检查不需要值
            conditionValue = null;
          }
          
          const fieldCondition = { [operator]: conditionValue };
          
          if (index === 0) {
            filter[field] = fieldCondition;
          } else {
            // 处理逻辑连接符
            if (logical === 'or') {
              if (!filter.$or) filter.$or = [];
              filter.$or.push({ [field]: fieldCondition });
            } else {
              // 默认 AND 逻辑
              filter[field] = fieldCondition;
            }
          }
        });
        
        queryParams.filter = JSON.stringify(filter);
      }
      
      // 字段选择
      if (config.fields && config.fields.length > 0) {
        queryParams.fields = config.fields.join(',');
      }
      
      // 分页配置
      if (config.enablePagination) {
        if (config.limit) queryParams.pageSize = config.limit;
        if (config.offset) queryParams.page = Math.floor(config.offset / (config.limit || 20)) + 1;
      } else {
        queryParams.paginate = false;
      }
      
      // 排序配置
      if (config.sort && config.sort.length > 0) {
        const sortArray = config.sort.map(s => `${s.direction === 'desc' ? '-' : ''}${s.field}`);
        queryParams.sort = sortArray.join(',');
      }

      console.log('Query Params:', queryParams);

      // 执行查询
      const response = await apiClient.request({
        url: `${config.collection}:list`,
        method: 'get',
        params: queryParams,
      });

      console.log('Query Response:', response.data);

      const result = response.data || {};
      const records = result.data || [];
      
      return {
        success: true,
        data: {
          records,
          total: result.meta?.count || records.length,
          page: result.meta?.page || 1,
          pageSize: result.meta?.pageSize || records.length,
          collection: config.collection,
          query: queryParams
        },
        executedAt: new Date(),
        executorKey: 'data-query',
        metadata: {
          collection: config.collection,
          recordCount: records.length,
          totalCount: result.meta?.count || records.length,
          queryConditions: config.conditions?.length || 0,
          fields: config.fields || 'all'
        }
      };

    } catch (error) {
      console.error('Data query execution failed:', error);
      return {
        success: false,
        data: null,
        executedAt: new Date(),
        executorKey: 'data-query',
        metadata: { 
          error: error.message,
          collection: config.collection,
          stack: error.stack
        }
      };
    }
  }
}