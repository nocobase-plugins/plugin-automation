/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Modal, Form, Input, InputNumber, Switch } from 'antd';
import { FormInstance } from 'antd/es/form';
import { ParameterField } from '../core/types';

interface ParameterCollectorModalProps {
  visible: boolean;
  title?: string;
  fields: ParameterField[];
  onOk: (values: Record<string, any>) => void;
  onCancel: () => void;
}

/**
 * 参数收集Modal组件
 * 根据配置的字段动态生成表单
 */
export const ParameterCollectorModal: React.FC<ParameterCollectorModalProps> = ({
  visible,
  title = '请输入参数',
  fields,
  onOk,
  onCancel,
}) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onOk(values);
      form.resetFields();
    } catch (errorInfo) {
      console.log('Validation Failed:', errorInfo);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const renderField = (field: ParameterField) => {
    const commonProps = {
      key: field.key,
      placeholder: `请输入${field.label}`,
    };

    switch (field.type) {
      case 'textarea':
        return <Input.TextArea {...commonProps} rows={4} />;
      case 'number':
        return <InputNumber {...commonProps} style={{ width: '100%' }} />;
      case 'switch':
        return <Switch />;
      case 'input':
      default:
        return <Input {...commonProps} />;
    }
  };

  return (
    <Modal
      title={title}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="确认"
      cancelText="取消"
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
      >
        {fields.map((field) => (
          <Form.Item
            key={field.key}
            name={field.key}
            label={field.label}
            rules={[
              {
                required: true,
                message: `请输入${field.label}`,
              },
            ]}
          >
            {renderField(field)}
          </Form.Item>
        ))}
      </Form>
    </Modal>
  );
};