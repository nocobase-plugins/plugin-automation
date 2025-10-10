# 表单值设置 Action 使用指南

## 功能概述

表单值设置 Action 允许您将执行器结果或触发器数据自动设置到表单的指定字段中，支持多字段批量赋值和变量表达式。

## 使用场景

1. **自动填充表单**：根据触发器数据自动填充相关字段
2. **数据联动**：根据执行器返回的数据设置其他字段值
3. **计算结果应用**：将计算执行器的结果应用到表单字段

## 配置说明

### 字段映射配置

每个字段映射包含两个部分：

#### 1. 目标字段
- 从当前表单的所有可用字段中选择
- 显示格式：`字段标题 (字段路径)`
- 支持搜索和筛选

#### 2. 值表达式
支持变量表达式语法：

**触发器数据**：
- `{{$trigger}}` - 完整的触发器数据
- `{{$trigger.record}}` - 触发记录（如果存在）
- `{{$trigger.record.title}}` - 记录的特定字段

**执行器结果**：
- `{{$executor}}` - 完整的执行器返回结果
- `{{$executor.result}}` - 执行器的主要结果
- `{{$executor.message}}` - 执行器返回的消息

**系统变量**：
- `{{$system.timestamp}}` - 当前时间戳
- `{{$system.timezone}}` - 当前时区
- `{{$system.locale}}` - 当前语言环境

**工具函数**：
- `{{$utils.formatJSON($executor)}}` - JSON 格式化
- `{{$utils.formatDate($trigger.record.createdAt)}}` - 日期格式化
- `{{$utils.isEmpty($executor.result)}}` - 空值检查

## 使用方法

### 1. 在自动化配置中添加

1. 创建或编辑自动化流程
2. 在动作器部分选择"表单值设置"
3. 点击"添加字段映射"按钮
4. 配置目标字段和值表达式
5. 可以添加多个字段映射

### 2. 在表单中启用支持

如果您是开发者并需要在自定义表单中支持此功能，可以使用提供的 Hook：

```tsx
import { useFormValueSetter } from '@nocobase/plugin-automation';

const MyFormComponent = () => {
  // 启用表单值设置功能
  useFormValueSetter();
  
  return (
    <Form>
      {/* 您的表单字段 */}
    </Form>
  );
};
```

或者使用无渲染组件：

```tsx
import { FormValueSetterExecutor } from '@nocobase/plugin-automation';

const MyFormPage = () => {
  return (
    <div>
      <FormValueSetterExecutor />
      {/* 您的表单内容 */}
    </div>
  );
};
```

## 配置示例

### 示例 1：基础字段赋值

**目标字段**：`title`
**值表达式**：`{{$executor.result.name}}`

将执行器结果中的 `name` 字段值设置到表单的 `title` 字段。

### 示例 2：格式化时间赋值

**目标字段**：`createdAt`
**值表达式**：`{{$system.timestamp}}`

将当前时间戳设置到 `createdAt` 字段。

### 示例 3：条件赋值

**目标字段**：`status`
**值表达式**：`{{$executor.result.success ? 'active' : 'inactive'}}`

根据执行器结果的成功状态设置不同的状态值。

### 示例 4：JSON 数据提取

**目标字段**：`description`
**值表达式**：`{{$utils.formatJSON($trigger.record)}}`

将触发记录以 JSON 格式设置到描述字段。

## 注意事项

1. **字段路径**：确保目标字段路径在表单中存在
2. **数据类型**：注意值表达式结果与目标字段类型的兼容性
3. **错误处理**：如果字段不存在或赋值失败，会在控制台输出警告信息
4. **性能**：大量字段映射可能影响性能，建议合理规划

## 调试技巧

1. 打开浏览器开发者工具的控制台
2. 查看详细的执行日志
3. 检查变量编译结果
4. 验证字段设置是否成功

## 扩展开发

如需扩展更多变量或工具函数，可以修改 `compile.ts` 文件中的相关配置。