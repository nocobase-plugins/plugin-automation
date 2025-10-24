/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ExecutionContext } from './types';

/**
 * 编译上下文接口 - 用于变量替换的内部上下文
 */
interface CompileContext {
  /** 统一的执行上下文 - 所有数据都在这里 */
  $context: {
    /** 触发器数据 */
    trigger?: any;
    /** 执行器结果数组 - 按索引访问 */
    executors?: any[];
    /** 动作配置 */
    config?: any;
    /** 执行时间戳 */
    timestamp?: Date;
    /** 事件名称 */
    event?: string;
    /** 原始事件对象 */
    originalEvent?: any;
    /** 其他自定义数据 */
    [key: string]: any;
  };
  /** 系统数据 */
  $system?: any;
  /** 实用工具 */
  $utils?: any;
}

/**
 * 安全地序列化对象，移除循环引用和DOM元素
 */
function createSafeTriggerObject(originalEvent: any): any {
  if (!originalEvent) return null;
  
  // 如果是Event对象，提取安全的属性
  if (originalEvent.constructor && originalEvent.constructor.name.includes('Event')) {
    return {
      type: originalEvent.type,
      timeStamp: originalEvent.timeStamp,
      isTrusted: originalEvent.isTrusted,
      // 对于鼠标事件
      clientX: originalEvent.clientX,
      clientY: originalEvent.clientY,
      // 对于键盘事件
      key: originalEvent.key,
      code: originalEvent.code,
      // 对于表单事件
      value: originalEvent.target?.value,
      // 其他安全属性
      detail: originalEvent.detail,
    };
  }
  
  // 对于普通对象，递归过滤
  if (typeof originalEvent === 'object' && originalEvent !== null) {
    const safeObject: any = {};
    for (const [key, value] of Object.entries(originalEvent)) {
      // 跳过DOM相关属性和函数
      if (
        key.startsWith('__react') || 
        key.startsWith('_') ||
        typeof value === 'function' ||
        value instanceof Node ||
        value instanceof HTMLElement
      ) {
        continue;
      }
      
      // 递归处理嵌套对象
      if (typeof value === 'object' && value !== null) {
        try {
          // 尝试序列化来检测循环引用
          JSON.stringify(value);
          safeObject[key] = value;
        } catch {
          // 如果有循环引用，跳过该属性
          continue;
        }
      } else {
        safeObject[key] = value;
      }
    }
    return safeObject;
  }
  
  return originalEvent;
}

/**
 * 从ExecutionContext创建编译上下文
 */
function createCompileContext(context: ExecutionContext): CompileContext {
  return {
    // 统一的变量访问结构 - 所有数据都在 $context 下
    $context: {
      trigger: context.originalEvent,  // 将 originalEvent 作为 trigger 使用
      executors: context.executors || [],
      config: context.config,
      timestamp: new Date(),
      event: context.event,
      originalEvent: context.originalEvent,
      // 支持自定义扩展数据
      ...context,
    },
    $system: {
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: navigator.language
    },
    $utils: {
      formatDate: (date: any, format?: string) => {
        try {
          const d = new Date(date);
          if (format) {
            return d.toLocaleDateString('zh-CN');
          }
          return d.toLocaleString('zh-CN');
        } catch {
          return String(date);
        }
      },
      formatJSON: (obj: any, space?: number) => {
        try {
          return JSON.stringify(obj, null, space || 2);
        } catch {
          return String(obj);
        }
      },
      isNull: (value: any) => value === null,
      isUndefined: (value: any) => value === undefined,
      isEmpty: (value: any) => {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.trim() === '';
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
      }
    }
  };
}

/**
 * 自动化专用的编译函数
 * 类似NocoBase的compile，但专门为自动化场景优化
 * 
 * @param template 模板字符串，支持 {{$trigger.data}} 等语法
 * @param context 执行上下文
 * @returns 编译后的结果
 */
export function compileAutomation(template: any, context: ExecutionContext = {} as ExecutionContext): any {
  // 如果不是字符串，直接返回
  if (typeof template !== 'string') {
    return template;
  }

  try {
    // 使用正则表达式匹配 {{...}} 格式的变量
    const compiled = template.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
      try {
        // 清理表达式
        const cleanExpression = expression.trim();
        
        // 直接评估表达式
        const result = evaluateExpression(cleanExpression, createCompileContext(context));
        
        // 如果结果是对象，转换为JSON字符串，否则转为字符串
        if (result !== undefined && result !== null) {
          return typeof result === 'object' ? JSON.stringify(result) : String(result);
        }
        
        return match; // 保留原始表达式
      } catch (error) {
        console.warn(`Failed to compile expression: ${expression}`, error);
        return match; // 保留原始表达式
      }
    });

    return compiled;
  } catch (error) {
    console.warn('Failed to compile template:', template, error);
    return template;
  }
}

/**
 * 对象编译函数 - 递归编译对象中的所有字符串字段
 * 
 * @param obj 要编译的对象
 * @param context 执行上下文
 * @returns 编译后的对象
 */
export function compileAutomationObject(obj: any, context: ExecutionContext = {} as ExecutionContext): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // 字符串直接编译
  if (typeof obj === 'string') {
    return compileAutomation(obj, context);
  }

  // 数组递归处理
  if (Array.isArray(obj)) {
    return obj.map(item => compileAutomationObject(item, context));
  }

  // 对象递归处理
  if (typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = compileAutomationObject(value, context);
    }
    return result;
  }

  return obj;
}

/**
 * 计算表达式的值
 * 
 * @param expression 表达式字符串
 * @param context 上下文对象
 * @returns 计算结果
 */
function evaluateExpression(expression: string, context: CompileContext): any {
  // 创建安全的执行环境
  const safeContext = { ...context };

  try {
    // 使用Function构造函数创建安全的执行环境
    const contextKeys = Object.keys(safeContext);
    const contextValues = Object.values(safeContext);
    
    // 调试信息
    console.log('=== 编译器调试 ===');
    console.log('Expression:', expression);
    console.log('Context keys:', contextKeys);
    console.log('$context:', safeContext.$context);
    console.log('Executors array:', safeContext.$context?.executors);
    
    // 创建函数来安全地评估表达式
    const func = new Function(
      ...contextKeys,
      `
        "use strict";
        try {
          return ${expression};
        } catch (error) {
          console.warn('Expression evaluation error:', ${JSON.stringify(expression)}, error);
          return undefined;
        }
      `
    );

    const result = func(...contextValues);
    console.log('Expression result:', result);
    console.log('================');
    return result;
  } catch (error) {
    console.warn(`Failed to evaluate expression: ${expression}`, error);
    return undefined;
  }
}

/**
 * Hook for using automation compilation in React components
 */
export function useAutomationCompile() {
  return {
    compile: compileAutomation,
    compileObject: compileAutomationObject,
  };
}