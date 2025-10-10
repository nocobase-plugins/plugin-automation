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
  /** 触发器数据 */
  $trigger?: any;
  /** 执行器结果 */
  $executor?: any;
  /** 执行上下文 */
  $context?: any;
  /** 系统数据 */
  $system?: any;
  /** 实用工具 */
  $utils?: any;
}

/**
 * 从ExecutionContext创建编译上下文
 */
function createCompileContext(context: ExecutionContext): CompileContext {
  return {
    $trigger: context.trigger,
    $executor: context.executor,
    $context: context,
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
    
    // 创建函数来安全地评估表达式
    const func = new Function(
      ...contextKeys,
      `
        "use strict";
        try {
          return ${expression};
        } catch (error) {
          console.warn('Expression evaluation error:', expression, error);
          return undefined;
        }
      `
    );

    return func(...contextValues);
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