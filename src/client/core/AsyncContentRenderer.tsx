/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useState } from 'react';
import { Spin } from 'antd';
import { ContentRenderer, ContentConfig, ContentResult } from './contentRenderer';
import { ExecutionContext } from './types';

/**
 * 异步内容渲染组件
 * 处理异步内容渲染，包括加载状态和错误处理
 */
export const AsyncContentRenderer: React.FC<{ 
  config: ContentConfig; 
  context: ExecutionContext;
  loadingSize?: 'small' | 'default' | 'large';
}> = ({ config, context, loadingSize = 'small' }) => {
  const [contentResult, setContentResult] = useState<ContentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    
    const processContent = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await ContentRenderer.processContent(config, context);
        
        if (!cancelled) {
          setContentResult(result);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    processContent();
    
    return () => {
      cancelled = true;
    };
  }, [config?.contentType, config?.content, config?.contentFunction]);

  if (loading) {
    return <Spin size={loadingSize} />;
  }

  if (error) {
    return (
      <div style={{ 
        color: '#ff4d4f', 
        fontSize: '12px',
        padding: '8px',
        backgroundColor: '#fff2f0',
        border: '1px solid #ffccc7',
        borderRadius: '4px'
      }}>
        渲染错误: {error}
      </div>
    );
  }

  if (!contentResult) {
    return <div style={{ color: '#999', fontSize: '12px' }}>无内容</div>;
  }

  return ContentRenderer.renderContent(contentResult);
};