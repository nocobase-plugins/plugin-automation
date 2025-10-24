/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import WorkflowPlugin, { Processor } from '@nocobase/plugin-workflow';
import axios from 'axios';
import { requestTemplateGenerator, RequestConfig } from './utils/request-template-generator';

const fetchDataFromLocalSQL = async (ctx, next, sql) => {
  if (!sql) {
    ctx.throw(400, 'sql is required');
  }

  /**
   * // 使用 Sequelize 查询
   * // Sequelize group/aggregate
   * const repo = ctx.db.getRepository(tableId);
   * const rows = await repo.model.findAll({
   *   attributes: [
   *     fieldId, [ctx.db.sequelize.fn('COUNT', ctx.db.sequelize.col(fieldId)), 'count']
   *   ],
   *   group: [fieldId]
   * });
   * // 获取结果
   * const field = row[0][fieldId];
   * const count = row[0].count;
   */

  // 使用原生 SQL 查询
  const rows = await ctx.db.sequelize.query(sql, {
    type: ctx.db.sequelize.QueryTypes.SELECT,
  });
  ctx.body = { data: rows };

  await next();
};

const fetchDataFromRemoteAPI = async (ctx, next, data) => {
  try {
    let { 
      url, 
      headers = {}, 
      method = 'get', 
      query = {}, 
      body = {}, 
      params = {}, 
      timeout = 5000,
      outputMode = 'execute' 
    } = data || {};
    
    if (!url) {
      ctx.throw(400, 'URL is required');
    }
    
    // 如果是模板生成模式，生成代码模板而不是执行请求
    if (outputMode !== 'execute') {
      const requestConfig: RequestConfig = {
        url,
        method: method.toUpperCase(),
        headers,
        query: { ...query, ...params }, // 合并 query 和 params 参数
        body,
        timeout
      };
      
      try {
        const template = requestTemplateGenerator.generateTemplate(outputMode, requestConfig, {
          includeComments: true,
          language: 'zh-CN'
        });
        
        ctx.body = { 
          success: true,
          mode: 'template',
          format: outputMode,
          template,
          originalConfig: requestConfig
        };
        
        await next();
        return;
      } catch (error) {
        ctx.throw(400, `Template generation failed: ${error.message}`);
      }
    }
    
    // 原有的执行逻辑
    // 合并 query 和 params 参数
    const queryParams = { ...query, ...params };
    // 提取并处理 Basic Auth
    try {
      const urlObj = new URL(url);
      if (urlObj.username && urlObj.password) {
        const basic = Buffer.from(`${urlObj.username}:${urlObj.password}`).toString('base64');
        headers.Authorization = `Basic ${basic}`;
        urlObj.username = '';
        urlObj.password = '';
        url = urlObj.toString();
      }
    } catch (e) {
      // 忽略 URL 解析错误
    }
    const response = await axios({
      url,
      method: method.toLowerCase(),
      headers,
      params: queryParams,
      data: body,
      timeout,
      validateStatus: () => true
    });

    if (response.status >= 400) {
      ctx.throw(response.status, `Request failed: ${response.statusText}`);
    }

    ctx.body = { data: response.data?.data ?? response.data };
    await next();
  } catch (err) {
    ctx.throw(500, `fetchDataFromRemoteAPI error: ${err.message}`);
  }
};

const fetchDataFromWorkflow = async (ctx, next, data) => {
  const plugin = ctx.app.pm.get(WorkflowPlugin) as WorkflowPlugin;;
  const { id, values } = data;
  if (!values) {
    return ctx.throw(400, 'values is required');
  }
  if (!id) {
    return ctx.throw(400, 'id is required');
  }
  const workflowId = Number.parseInt(id, 10);
  if (Number.isNaN(workflowId)) {
    return ctx.throw(400, 'id is invalid');
  }
  const repository = ctx.db.getRepository("workflows");
  const workflow = plugin.enabledCache.get(workflowId) || (await repository.findOne({ id }));
  if (!workflow) {
    return ctx.throw(404, 'workflow not found');
  }
  let processor;
  try {
    processor = (await plugin.execute(workflow, values, { manually: true })) as Processor;
    if (!processor) {
      return ctx.throw(400, 'workflow not triggered');
    }
  } catch (ex) {
    return ctx.throw(400, ex.message);
  }
  ctx.action.mergeParams({
    filter: { key: workflow.key },
  });

  ctx.body = {
    data: {
      id: processor.execution.id,
      data: processor.lastSavedJob?.result,
      status: processor.execution.status,
    },
  };

  return next();
};

const fetchData = async (ctx, next) => {
  const { data } = ctx.action.params.values || {};
  if (!data) {
    ctx.throw(400, 'data is required');
  }

  switch (data.type) {
    case 'api':
    case 'http':
      await fetchDataFromRemoteAPI(ctx, next, data.data);
      break;
    case 'sql':
      await fetchDataFromLocalSQL(ctx, next, data.data);
      break;
    case 'workflow':
      await fetchDataFromWorkflow(ctx, next, data.data);
      break;
    default:
      ctx.throw(400, `Unsupported type: ${data.type}`);
  }
};

export class PluginAutomation extends Plugin {
  async afterAdd() { }

  async beforeLoad() { }

  async load() {

    this.app.resourceManager.registerActionHandlers({
      'collections:automation-fetch_data': async (ctx, next) => {
        await fetchData(ctx, next);
      },
    });
  }

  async install() { }

  async afterEnable() { }

  async afterDisable() { }

  async remove() { }
}

export default PluginAutomation;