/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, ReactNode, useState, useCallback, createContext, useContext } from 'react';
import { ParameterField } from '../core/types';
import { ParameterCollectorModal } from './ParameterCollectorModal';

export interface ParameterCollectorContextType {
  showModal: (title: string, fields: ParameterField[]) => Promise<Record<string, any>>;
}

const ParameterCollectorContext = createContext<ParameterCollectorContextType | null>(null);

export const useParameterCollectorGlobal = () => {
  const context = useContext(ParameterCollectorContext);
  if (!context) {
    throw new Error('useParameterCollectorGlobal must be used within AutomationProvider');
  }
  return context;
};

interface AutomationProviderProps {
  children: ReactNode;
}

/**
 * 自动化Provider
 * 提供全局的Modal渲染和状态管理
 */
export const AutomationProvider: FC<AutomationProviderProps> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [fields, setFields] = useState<ParameterField[]>([]);
  const [resolvePromise, setResolvePromise] = useState<((value: Record<string, any>) => void) | null>(null);
  const [rejectPromise, setRejectPromise] = useState<((reason?: any) => void) | null>(null);

  const showModal = useCallback((modalTitle: string, modalFields: ParameterField[]): Promise<Record<string, any>> => {
    return new Promise((resolve, reject) => {
      setTitle(modalTitle);
      setFields(modalFields);
      setVisible(true);
      setResolvePromise(() => resolve);
      setRejectPromise(() => reject);
    });
  }, []);

  const handleOk = useCallback((values: Record<string, any>) => {
    if (resolvePromise) {
      resolvePromise(values);
      setResolvePromise(null);
      setRejectPromise(null);
    }
    setVisible(false);
  }, [resolvePromise]);

  const handleCancel = useCallback(() => {
    if (rejectPromise) {
      rejectPromise(new Error('User cancelled'));
      setResolvePromise(null);
      setRejectPromise(null);
    }
    setVisible(false);
  }, [rejectPromise]);

  return (
    <ParameterCollectorContext.Provider value={{ showModal }}>
      {children}
      <ParameterCollectorModal
        visible={visible}
        title={title}
        fields={fields}
        onOk={handleOk}
        onCancel={handleCancel}
      />
    </ParameterCollectorContext.Provider>
  );
};