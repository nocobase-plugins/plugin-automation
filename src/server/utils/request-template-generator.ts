/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface RequestConfig {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
  params?: Record<string, string>;
  timeout?: number;
}

export interface TemplateGeneratorOptions {
  includeComments?: boolean;
  language?: 'zh-CN' | 'en-US';
}

/**
 * HTTP 请求模板生成器
 * 支持生成多种格式的 HTTP 请求代码模板
 */
export class RequestTemplateGenerator {
  
  private escapeShellString(str: string): string {
    return `'${str.replace(/'/g, "'\"'\"'")}'`;
  }

  private escapePowerShellString(str: string): string {
    return `'${str.replace(/'/g, "''")}'`;
  }

  private escapeJsonString(str: string): string {
    return JSON.stringify(str);
  }

  /**
   * 生成 cURL 命令
   */
  generateCurl(config: RequestConfig, options: TemplateGeneratorOptions = {}): string {
    const { url, method = 'GET', headers = {}, body, query = {} } = config;
    const { includeComments = true, language = 'zh-CN' } = options;
    
    let curlCmd = 'curl';
    
    // 添加方法
    if (method.toUpperCase() !== 'GET') {
      curlCmd += ` -X ${method.toUpperCase()}`;
    }
    
    // 构建完整URL（包含query参数）
    let fullUrl = url;
    const queryString = new URLSearchParams(query).toString();
    if (queryString) {
      fullUrl += (url.includes('?') ? '&' : '?') + queryString;
    }
    curlCmd += ` ${this.escapeShellString(fullUrl)}`;
    
    // 添加头部
    Object.entries(headers).forEach(([key, value]) => {
      curlCmd += ` \\\n  -H ${this.escapeShellString(`${key}: ${value}`)}`;
    });
    
    // 添加请求体
    if (body && method.toUpperCase() !== 'GET') {
      const bodyStr = typeof body === 'string' ? body : JSON.stringify(body, null, 2);
      curlCmd += ` \\\n  -d ${this.escapeShellString(bodyStr)}`;
    }
    
    if (includeComments) {
      const comment = language === 'zh-CN' ? '# 生成的 cURL 命令' : '# Generated cURL command';
      return `${comment}\n${curlCmd}`;
    }
    
    return curlCmd;
  }

  /**
   * 生成 PowerShell Invoke-RestMethod 命令
   */
  generatePowerShell(config: RequestConfig, options: TemplateGeneratorOptions = {}): string {
    const { url, method = 'GET', headers = {}, body, query = {} } = config;
    const { includeComments = true, language = 'zh-CN' } = options;
    
    let script = '';
    
    if (includeComments) {
      const comment = language === 'zh-CN' ? '# 生成的 PowerShell 脚本' : '# Generated PowerShell script';
      script += `${comment}\n\n`;
    }
    
    // 构建完整URL
    let fullUrl = url;
    const queryString = new URLSearchParams(query).toString();
    if (queryString) {
      fullUrl += (url.includes('?') ? '&' : '?') + queryString;
    }
    
    script += `$uri = ${this.escapePowerShellString(fullUrl)}\n`;
    script += `$method = '${method.toUpperCase()}'\n`;
    
    // 添加头部
    if (Object.keys(headers).length > 0) {
      script += `$headers = @{\n`;
      Object.entries(headers).forEach(([key, value]) => {
        script += `    '${key}' = ${this.escapePowerShellString(value)}\n`;
      });
      script += `}\n`;
    }
    
    // 添加请求体
    if (body && method.toUpperCase() !== 'GET') {
      const bodyStr = typeof body === 'string' ? body : JSON.stringify(body, null, 2);
      script += `$body = @'\n${bodyStr}\n'@\n`;
    }
    
    // 生成调用命令
    script += '\n$response = Invoke-RestMethod -Uri $uri -Method $method';
    if (Object.keys(headers).length > 0) {
      script += ' -Headers $headers';
    }
    if (body && method.toUpperCase() !== 'GET') {
      script += ' -Body $body';
      if (headers['Content-Type']?.includes('json')) {
        script += ' -ContentType "application/json"';
      }
    }
    script += '\n\n';
    
    if (includeComments) {
      const outputComment = language === 'zh-CN' ? '# 显示响应结果' : '# Display response';
      script += `${outputComment}\n`;
    }
    script += '$response | ConvertTo-Json -Depth 10';
    
    return script;
  }

  /**
   * 生成 Python requests 代码
   */
  generatePython(config: RequestConfig, options: TemplateGeneratorOptions = {}): string {
    const { url, method = 'GET', headers = {}, body, query = {}, timeout = 30 } = config;
    const { includeComments = true, language = 'zh-CN' } = options;
    
    let script = '';
    
    if (includeComments) {
      const comment = language === 'zh-CN' ? '# 生成的 Python requests 代码' : '# Generated Python requests code';
      script += `${comment}\n`;
    }
    
    script += 'import requests\nimport json\n\n';
    
    // URL
    script += `url = ${this.escapeJsonString(url)}\n`;
    
    // 方法
    const methodLower = method.toLowerCase();
    
    // 参数
    if (Object.keys(query).length > 0) {
      script += `params = ${JSON.stringify(query, null, 2)}\n`;
    }
    
    // 头部
    if (Object.keys(headers).length > 0) {
      script += `headers = ${JSON.stringify(headers, null, 2)}\n`;
    }
    
    // 请求体
    if (body && method.toUpperCase() !== 'GET') {
      if (typeof body === 'object') {
        script += `data = ${JSON.stringify(body, null, 2)}\n`;
      } else {
        script += `data = ${this.escapeJsonString(body)}\n`;
      }
    }
    
    script += '\n';
    
    // 生成请求调用
    script += `response = requests.${methodLower}(url`;
    
    if (Object.keys(query).length > 0) {
      script += ', params=params';
    }
    if (Object.keys(headers).length > 0) {
      script += ', headers=headers';
    }
    if (body && method.toUpperCase() !== 'GET') {
      if (headers['Content-Type']?.includes('json')) {
        script += ', json=data';
      } else {
        script += ', data=data';
      }
    }
    if (timeout) {
      script += `, timeout=${timeout}`;
    }
    script += ')\n\n';
    
    if (includeComments) {
      const responseComment = language === 'zh-CN' ? '# 处理响应' : '# Handle response';
      script += `${responseComment}\n`;
    }
    script += 'print(f"Status Code: {response.status_code}")\n';
    script += 'print(f"Response: {response.text}")';
    
    return script;
  }

  /**
   * 生成 JavaScript fetch 代码
   */
  generateJavaScript(config: RequestConfig, options: TemplateGeneratorOptions = {}): string {
    const { url, method = 'GET', headers = {}, body, query = {} } = config;
    const { includeComments = true, language = 'zh-CN' } = options;
    
    let script = '';
    
    if (includeComments) {
      const comment = language === 'zh-CN' ? '// 生成的 JavaScript fetch 代码' : '// Generated JavaScript fetch code';
      script += `${comment}\n\n`;
    }
    
    // 构建完整URL
    let fullUrl = url;
    const queryString = new URLSearchParams(query).toString();
    if (queryString) {
      fullUrl += (url.includes('?') ? '&' : '?') + queryString;
    }
    
    script += 'async function makeRequest() {\n';
    script += `  const url = ${this.escapeJsonString(fullUrl)};\n\n`;
    
    script += `  const options = {\n`;
    script += `    method: '${method.toUpperCase()}',\n`;
    
    // 添加头部
    if (Object.keys(headers).length > 0) {
      script += `    headers: ${JSON.stringify(headers, null, 6)},\n`;
    }
    
    // 添加请求体
    if (body && method.toUpperCase() !== 'GET') {
      const bodyStr = typeof body === 'object' ? JSON.stringify(body) : body;
      script += `    body: ${this.escapeJsonString(bodyStr)}\n`;
    }
    
    script += '  };\n\n';
    
    script += '  try {\n';
    script += '    const response = await fetch(url, options);\n';
    script += '    const data = await response.json();\n';
    script += '    \n';
    script += '    console.log("Status:", response.status);\n';
    script += '    console.log("Response:", data);\n';
    script += '    \n';
    script += '    return data;\n';
    script += '  } catch (error) {\n';
    script += '    console.error("Request failed:", error);\n';
    script += '    throw error;\n';
    script += '  }\n';
    script += '}\n\n';
    
    if (includeComments) {
      const callComment = language === 'zh-CN' ? '// 执行请求' : '// Execute request';
      script += `${callComment}\n`;
    }
    script += 'makeRequest();';
    
    return script;
  }

  /**
   * 生成 Java OkHttp 代码
   */
  generateJava(config: RequestConfig, options: TemplateGeneratorOptions = {}): string {
    const { url, method = 'GET', headers = {}, body, query = {} } = config;
    const { includeComments = true, language = 'zh-CN' } = options;
    
    let script = '';
    
    if (includeComments) {
      const comment = language === 'zh-CN' ? '// 生成的 Java OkHttp 代码' : '// Generated Java OkHttp code';
      script += `${comment}\n`;
    }
    
    script += 'import okhttp3.*;\nimport java.io.IOException;\n\n';
    script += 'public class HttpRequest {\n';
    script += '    public static void main(String[] args) throws IOException {\n';
    script += '        OkHttpClient client = new OkHttpClient();\n\n';
    
    // 构建URL
    let fullUrl = url;
    const queryString = new URLSearchParams(query).toString();
    if (queryString) {
      fullUrl += (url.includes('?') ? '&' : '?') + queryString;
    }
    
    script += `        String url = ${this.escapeJsonString(fullUrl)};\n\n`;
    
    // 构建请求体
    if (body && method.toUpperCase() !== 'GET') {
      const mediaType = headers['Content-Type'] || 'application/json';
      script += `        MediaType mediaType = MediaType.parse("${mediaType}");\n`;
      const bodyStr = typeof body === 'object' ? JSON.stringify(body) : body;
      script += `        RequestBody body = RequestBody.create(mediaType, ${this.escapeJsonString(bodyStr)});\n\n`;
    }
    
    // 构建请求
    script += '        Request.Builder requestBuilder = new Request.Builder()\n';
    script += '                .url(url)';
    
    if (method.toUpperCase() !== 'GET') {
      if (body) {
        script += `\n                .${method.toLowerCase()}(body)`;
      } else {
        script += `\n                .${method.toLowerCase()}(RequestBody.create(MediaType.parse(""), ""))`;
      }
    }
    
    // 添加头部
    Object.entries(headers).forEach(([key, value]) => {
      script += `\n                .addHeader(${this.escapeJsonString(key)}, ${this.escapeJsonString(value)})`;
    });
    
    script += ';\n\n';
    script += '        Request request = requestBuilder.build();\n\n';
    
    script += '        try (Response response = client.newCall(request).execute()) {\n';
    script += '            System.out.println("Status: " + response.code());\n';
    script += '            System.out.println("Response: " + response.body().string());\n';
    script += '        }\n';
    script += '    }\n';
    script += '}';
    
    return script;
  }

  /**
   * 生成指定格式的模板
   */
  generateTemplate(format: string, config: RequestConfig, options: TemplateGeneratorOptions = {}): string {
    switch (format.toLowerCase()) {
      case 'curl':
        return this.generateCurl(config, options);
      case 'powershell':
        return this.generatePowerShell(config, options);
      case 'python':
        return this.generatePython(config, options);
      case 'javascript':
        return this.generateJavaScript(config, options);
      case 'java':
        return this.generateJava(config, options);
      default:
        throw new Error(`Unsupported template format: ${format}`);
    }
  }
}

// 导出单例实例
export const requestTemplateGenerator = new RequestTemplateGenerator();