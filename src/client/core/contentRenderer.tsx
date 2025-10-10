/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ExecutionContext } from './types';
import { compileAutomation } from './compile';
/**
 * 使用 marked 库渲染 Markdown
 * 支持 GitHub Flavored Markdown，包括表格、换行等特性
 */
async function parseMarkdown(text: string): Promise<string> {
  if (!text) {
    return text;
  }
  try {
    const { marked } = await import('marked');
    
    // 配置 marked 选项
    marked.setOptions({
      breaks: true,         // 支持单个换行符转换为 <br>
      gfm: true,           // 启用 GitHub Flavored Markdown
      headerIds: false,    // 禁用标题 ID 生成（避免冲突）
      mangle: false,       // 禁用邮箱地址混淆
    });
    
    return marked.parse(text);
  } catch (error) {
    console.warn('Markdown 渲染失败，降级为纯文本:', error);
    return text.replace(/\n/g, '<br>');
  }
}

/**
 * 内容配置类型
 */
export type ContentConfig = {
  /** 内容类型：text-文本模式, function-函数模式 */
  contentType?: 'text' | 'function';
  /** 文本内容（文本模式使用） */
  content?: string;
  /** 函数代码（函数模式使用） */
  contentFunction?: string;
};

/**
 * 函数返回的内容格式
 */
export type ContentResult = {
  /** 内容类型 */
  type: 'HTML' | 'MD' | 'TEXT';
  /** 内容数据 */
  content: string;
};

/**
 * 通用内容渲染器
 * 支持文本模式和函数模式，支持 HTML、Markdown、纯文本渲染
 */
export class ContentRenderer {
  /**
   * 处理内容配置，返回最终渲染结果
   */
  static async processContent(config: ContentConfig, context: ExecutionContext): Promise<ContentResult> {
    const { contentType = 'text', content = '', contentFunction = '' } = config;

    if (contentType === 'function' && contentFunction.trim()) {
      // 函数模式：执行用户定义的函数
      try {
        return await this.executeContentFunction(contentFunction, context);
      } catch (error: any) {
        // 函数执行失败时返回错误信息
        return {
          type: 'TEXT',
          content: `函数执行失败: ${error.message}`
        };
      }
    } else {
      // 文本模式：使用配置的文本内容或模板编译
      const processedContent = content.includes('{{') 
        ? compileAutomation(content, context)
        : content;
      
      return {
        type: 'TEXT',
        content: processedContent
      };
    }
  }

  /**
   * 执行用户定义的内容函数
   */
  private static async executeContentFunction(code: string, context: ExecutionContext): Promise<ContentResult> {
    if (!code || !code.trim()) {
      throw new Error('函数代码不能为空');
    }

    try {
      let result: any;

      // 检测函数类型并执行
      if (this.isArrowFunction(code)) {
        result = this.executeArrowFunction(code, context);
      } else if (this.isFunctionDeclaration(code)) {
        result = this.executeFunctionDeclaration(code, context);
      } else {
        result = this.executeFunctionBody(code, context);
      }

      // 验证返回结果的基本结构
      if (!result || typeof result !== 'object' || result === null) {
        throw new Error('函数必须返回一个对象，格式: {type: "HTML"|"MD"|"TEXT", content: "..."}');
      }

      const { type, content } = result;
      
      // 验证类型字段
      if (!type || !['HTML', 'MD', 'TEXT'].includes(type)) {
        throw new Error(`无效的内容类型: "${type}"，支持的类型: HTML, MD, TEXT`);
      }

      // 验证内容字段
      if (content === undefined || content === null) {
        throw new Error('content 字段不能为空');
      }
      
      if (typeof content !== 'string') {
        throw new Error(`content 必须是字符串类型，当前类型: ${typeof content}`);
      }

      // 如果是MD类型，立即转换为HTML
      if (type === 'MD') {
        const html = await parseMarkdown(content);
        return { 
          type: 'HTML', 
          content: html 
        };
      }

      return { type, content } as ContentResult;
    } catch (error: any) {
      // 提供更友好的错误信息
      const errorMessage = error.message || '未知错误';
      throw new Error(`函数执行失败: ${errorMessage}`);
    }
  }

  /**
   * 渲染内容为 React 元素
   */
  static renderContent(contentResult: ContentResult, styles?: React.CSSProperties): React.ReactElement {
    const { type, content } = contentResult;
    
    const defaultStyles: React.CSSProperties = {
      lineHeight: '1.6',
      fontSize: '14px',
      padding: '4px 0',
      ...styles
    };

    switch (type) {
      case 'HTML':
        return (
          <div 
            style={defaultStyles}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        );

      case 'TEXT':
      default:
        return (
          <div style={{ 
            ...defaultStyles,
            whiteSpace: 'pre-wrap'
          }}>
            {content}
          </div>
        );
    }
  }

  /**
   * 检测是否为箭头函数
   */
  private static isArrowFunction(code: string): boolean {
    // 匹配箭头函数模式
    return /^\s*(\([^)]*\)|[^=>\s]+)\s*=>\s*/.test(code);
  }

  /**
   * 检测是否为函数声明
   */
  private static isFunctionDeclaration(code: string): boolean {
    // 匹配函数声明模式
    return /^\s*function\s*(\w*)?\s*\([^)]*\)\s*\{/.test(code);
  }

  /**
   * 执行箭头函数代码
   */
  private static executeArrowFunction(code: string, context: ExecutionContext): any {
    try {
      // 包装箭头函数并执行
      const wrappedFunction = new Function('context', `
        "use strict";
        const userFunction = ${code};
        return userFunction(context);
      `);
      return wrappedFunction(context);
    } catch (error: any) {
      throw new Error(`箭头函数执行失败: ${error.message}`);
    }
  }

  /**
   * 执行函数声明代码
   */
  private static executeFunctionDeclaration(code: string, context: ExecutionContext): any {
    try {
      // 提取函数名（如果有的话）
      const match = code.match(/^\s*function\s*(\w*)\s*\(/);
      const functionName = match && match[1] ? match[1] : 'userFunction';
      
      // 包装函数声明并执行
      const wrappedFunction = new Function('context', `
        "use strict";
        ${code};
        return ${functionName}(context);
      `);
      return wrappedFunction(context);
    } catch (error: any) {
      throw new Error(`函数声明执行失败: ${error.message}`);
    }
  }

  /**
   * 执行函数体代码
   */
  private static executeFunctionBody(code: string, context: ExecutionContext): any {
    try {
      // 包装函数体并执行
      const wrappedFunction = new Function('context', `
        "use strict";
        ${code}
      `);
      return wrappedFunction(context);
    } catch (error: any) {
      throw new Error(`函数体执行失败: ${error.message}`);
    }
  }
}


