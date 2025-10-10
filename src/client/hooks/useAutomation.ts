/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema, useForm } from "@formily/react";
import { useContext, useCallback } from "react";
import { useFieldComponentName, useAPIClient } from "@nocobase/client";
import { SchemaComponentsContext } from "@formily/react";
import { FormPath } from "@formily/shared";

import { createExecutionContext } from '../core/context';
import { executorRegistry } from '../executor';
import { actionRegistry } from '../action';
import { AutomationConfig, EventConfig } from '../core/types';
import { SETTINGS_KEY } from '../constant';

/**
 * 自动化核心Hook
 * 提供触发器功能和配置管理
 */
export const useAutomation = () => {
  const form = useForm();
  const fieldSchema = useFieldSchema();
  const fieldComponentName = useFieldComponentName();
  const components = useContext(SchemaComponentsContext);
  const apiClient = useAPIClient();
  
  // 获取组件类
  const componentClass = FormPath.getIn(components, fieldComponentName) as any;
  
  // 获取组件支持的事件
  const componentEvents = componentClass && typeof componentClass.getSupportedEvents === 'function' 
    ? componentClass.getSupportedEvents() 
    : [];

  // 获取自动化配置 - 使用标准的 x-component-props 存储方式
  const componentProps = fieldSchema?.['x-component-props'] || {};
  const automationConfig: AutomationConfig = componentProps?.automationConfiguration || { eventConfigs: {} };

  /**
   * 触发自动化流程
   */
  const trigger = useCallback(async (eventKey: string, eventData: any) => {
    console.log(`Triggering automation for event: ${eventKey}`, eventData);
    
    // 获取该事件的配置
    const eventConfig: EventConfig = automationConfig.eventConfigs[eventKey];
    if (!eventConfig) {
      console.log(`No configuration found for event: ${eventKey}`);
      return;
    }

    try {
      // 创建执行上下文
      const context = createExecutionContext(eventKey, eventData, {
        form,
        fieldSchema,
        componentName: fieldComponentName,
        timestamp: new Date(),
      });

      // 执行器结果
      let executorResult = null;

      // 执行执行器（如果配置了）
      if (eventConfig.executor) {
        console.log(`Executing executor: ${eventConfig.executor.key}`, eventConfig.executor.params);
        // 将配置参数合并到上下文中，这样执行器可以访问它们
        const executorContext = {
          ...context,
          config: eventConfig.executor.params || {}
        };
        executorResult = await executorRegistry.execute(
          eventConfig.executor.key,
          eventData,
          executorContext,
          apiClient
        );
        console.log(`Executor result:`, executorResult);
      }

      // 执行动作器列表
      if (eventConfig.actions && eventConfig.actions.length > 0) {
        console.log(`Executing ${eventConfig.actions.length} actions`);
        
        for (const actionConfig of eventConfig.actions) {
          console.log(`Executing action: ${actionConfig.key}`, actionConfig.params);
          // 将配置参数合并到上下文中，这样动作器可以访问它们
          const actionContext = {
            ...context,
            config: actionConfig.params || {}
          };
          await actionRegistry.execute(
            actionConfig.key,
            eventData,
            executorResult,
            actionContext
          );
        }
      }

      console.log(`Automation completed for event: ${eventKey}`);
    } catch (error) {
      console.error(`Automation failed for event: ${eventKey}`, error);
    }
  }, [automationConfig, form, fieldSchema, fieldComponentName]);

  return {
    trigger,
    componentEvents,
    automationConfig,
  };
};