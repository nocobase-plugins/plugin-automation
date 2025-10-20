/**
 * 简单的参数收集工具函数
 * 使用Antd的Modal.confirm来收集用户输入
 */

import { Modal, Input, Form } from 'antd';
import React from 'react';

interface ParameterField {
  label: string;
  key: string;
  type: 'input' | 'textarea' | 'number';
  required?: boolean;
  placeholder?: string;
}

export const showSimpleParameterModal = (options: {
  title?: string;
  description?: string;
  fields: ParameterField[];
}): Promise<Record<string, any> | null> => {
  return new Promise((resolve) => {
    let formValues: Record<string, any> = {};

    const modal = Modal.confirm({
      title: options.title || '参数配置',
      content: (
        <div>
          {options.description && (
            <div style={{ marginBottom: 16, color: '#666' }}>
              {options.description}
            </div>
          )}
          <Form
            layout="vertical"
            onValuesChange={(_, values) => {
              formValues = values;
            }}
          >
            {options.fields.map((field) => (
              <Form.Item
                key={field.key}
                name={field.key}
                label={field.label}
                rules={[
                  {
                    required: field.required,
                    message: `请输入${field.label}`,
                  },
                ]}
              >
                {field.type === 'textarea' ? (
                  <Input.TextArea
                    placeholder={field.placeholder}
                    rows={3}
                  />
                ) : field.type === 'number' ? (
                  <Input
                    type="number"
                    placeholder={field.placeholder}
                  />
                ) : (
                  <Input placeholder={field.placeholder} />
                )}
              </Form.Item>
            ))}
          </Form>
        </div>
      ),
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        resolve(formValues);
      },
      onCancel: () => {
        resolve(null);
      },
      width: 500,
    });
  });
};