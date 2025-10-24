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
import { message } from "antd";

import { createExecutionContext } from '../core/context';
import { executorRegistry } from '../executor';
import { actionRegistry } from '../action';
import { AutomationConfig, EventConfig } from '../core/types';

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
  const trigger = useCallback(async (triggerId: string, eventKey: string, eventData: any) => {
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
        triggerId,
        fieldSchema,
        componentName: fieldComponentName,
        timestamp: new Date(),
      });

      // 执行器链执行
      let executors: any[] = [];
      
      if (eventConfig.executors && eventConfig.executors.length > 0) {
        console.log(`执行${eventConfig.executors.length}个执行器`);
        
        for (let i = 0; i < eventConfig.executors.length; i++) {
          const executorConfig = eventConfig.executors[i];
          console.log(`执行执行器 ${i + 1}/${eventConfig.executors.length}: ${executorConfig.key}`, executorConfig.params);
          
          // 检查执行器是否被禁用
          if (executorConfig.enabled === false) {
            console.log(`执行器 ${executorConfig.key} 已禁用，跳过执行，保持索引 ${i}`);
            // 添加占位结果以保持索引不变
            executors.push({
              success: false,
              disabled: true,
              message: `执行器 ${executorConfig.key} 已禁用`,
              executedAt: new Date(),
              executorKey: executorConfig.key,
              metadata: {
                disabled: true,
                index: i
              }
            });
            continue;
          }
          
          try {
            // 将配置参数和之前执行器的结果都添加到上下文中
            const executorContext = {
              ...context,
              config: executorConfig.params || {},
              // 添加之前所有执行器的结果
              executors,
              // 添加当前执行器索引
              executorIndex: i,
              // 添加API客户端
              apiClient,
            };
            
            const result = await executorRegistry.execute(
              executorConfig.key,
              eventData,
              executorContext,
              apiClient
            );
            
            executors.push(result);
            
            console.log(`执行器 ${executorConfig.key} 执行完成:`, result);
            
          } catch (error) {
            console.error(`执行器 ${executorConfig.key} 执行失败:`, error);
            // 根据需要决定是否中断执行链
            if (executorConfig.key === 'parameter-builder') {
              // 参数构造器失败（用户取消）则中断整个流程
              if (error.name === 'ParameterCollectionCancelled') {
                console.log('用户取消了参数输入，中断执行流程');
              } else {
                console.log('参数构造器执行失败，中断执行流程');
                message.error('参数收集失败，自动化流程已中断');
              }
              return;
            }
            // 其他执行器失败则继续执行
            message.error(`执行器 ${executorConfig.key} 执行失败: ${error.message}`);
            executors.push({ 
              success: false,
              error: error.message,
              executedAt: new Date(),
              executorKey: executorConfig.key
            });
          }
        }
      }

      // 执行动作器列表
      if (eventConfig.actions && eventConfig.actions.length > 0) {
        console.log(`Executing ${eventConfig.actions.length} actions`);
        
        for (const actionConfig of eventConfig.actions) {
          console.log(`Executing action: ${actionConfig.key}`, actionConfig.params);
          
          // 检查动作器是否被禁用
          if (actionConfig.enabled === false) {
            console.log(`动作器 ${actionConfig.key} 已禁用，跳过执行`);
            continue;
          }
          
          // 统一的action上下文，只包含executors数组
          const actionContext = {
            ...context,
            config: actionConfig.params || {},
            executors, // 所有执行器的结果，按索引访问
          };
          await actionRegistry.execute(
            actionConfig.key,
            eventData,
            actionContext
          );
        }
      }

      console.log(`Automation completed for event: ${eventKey}`);
    } catch (error) {
      console.error(`Automation failed for event: ${eventKey}`, error);
      message.error(`自动化执行失败: ${error.message}`);
      throw error; // 重新抛出异常，让触发器组件能够接收到
    }
  }, [automationConfig, form, fieldSchema, fieldComponentName]);

  return {
    trigger,
    componentEvents,
    automationConfig,
  };
};