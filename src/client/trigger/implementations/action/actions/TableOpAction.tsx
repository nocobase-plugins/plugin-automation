import { useField, useFieldSchema, useForm } from "@formily/react";
import { Action, ActionInitializerItem, Application, ButtonEditor, InitializerWithSwitch, RemoveButton, SchemaInitializerItemType, SchemaSettings, SchemaSettingsModalItem, useCollectionRecord, useDesignable, useSchemaInitializerItem, useSchemaToolbar, useCompile } from "@nocobase/client";
import React, { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { NAMESPACE } from "../../../../constant";
import { Button, Typography } from "antd";
import { useAutomation } from "../../../../hooks/useAutomation";
import { Configuration } from "../../../../Configuration";
import { registerAutomationEvents } from "../../../core/EventRegistry";

const tableOpActionSettings = new SchemaSettings({
    name: 'actionSettings:tableOpAction',
    items: [
        {
          name: 'editButton',
          Component: function TitleEditor() {
            const field = useField();
            const fieldSchema = useFieldSchema();
            const { dn } = useDesignable();
            const { t } = useTranslation();

            return (
              <SchemaSettingsModalItem
                title={t('Edit button')}
                schema={{
                  type: 'object',
                  title: t('Edit button'),
                  properties: {
                    title: {
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                      title: t('Button title'),
                      default: fieldSchema.title,
                      'x-component-props': {},
                    },
                  },
                }}
                onSubmit={({ title }) => {
                  if (field.address.toString() === fieldSchema.name) {
                    field.title = title;
                  } else {
                    field.form.query(new RegExp(`.${fieldSchema.name}$`)).forEach((fieldItem) => {
                      fieldItem.title = title;
                    });
                  }

                  fieldSchema.title = title;

                  dn.emit('patch', {
                    schema: {
                      ['x-uid']: fieldSchema['x-uid'],
                      title,
                    },
                  });
                  dn.refresh();
                }}
              />
            );
          },
        },
        {
            name: 'customAutomationConfig',
            Component: Configuration
        },
        {
            name: 'remove',
            sort: 100,
            Component: RemoveButton as any,
            useComponentProps() {
                const { removeButtonProps } = useSchemaToolbar();
                return removeButtonProps;
            },
        },
    ],
});

interface TableOpActionComponentType extends FC<any> {
    getSupportedEvents?: () => Array<{
        key: string;
        label: string;
        description: string;
    }>;
}

const TableOpActionComponent: TableOpActionComponentType = (props) => {
    const { designable } = useDesignable?.() || {};
    const { t } = useTranslation(NAMESPACE);
    const { trigger } = useAutomation();
    const field = useField();
    const record = useCollectionRecord();
    const fieldSchema = useFieldSchema();
    const compile = useCompile();

    // 读取用户自定义的名称，如果没有则使用默认值
    const title = compile(fieldSchema?.title) || t('Automation');

    const actionOnClick = (e) => {
        trigger(`${fieldSchema['x-uid']}#${record.data?.['id']}`, 'onClick', {
            rawEvent: e,
            record,
        });
    };

    const actionOnMouseEnter = (e) => {
        trigger(`${fieldSchema['x-uid']}#${record.data?.['id']}`, 'onMouseEnter', {
            rawEvent: e,
            record,
        });
    }

    if (designable) {
        // In designer mode, use standard Actions while retaining the editing capability
        return <Action.Link {...props} type={'link'} title={title} onClick={actionOnClick} onMouseEnter={actionOnMouseEnter}></Action.Link>;
    } else {
        // In non-designer mode, use typography link for better display
        return <Typography.Link onClick={actionOnClick} onMouseEnter={actionOnMouseEnter}>{title}</Typography.Link>;
    }
};

// 注册组件的自动化事件
registerAutomationEvents('TableOpActionComponent', [
    {
        key: 'onClick',
        label: '点击时',
        description: '当按钮被点击时触发'
    },
    {
        key: 'onMouseEnter',
        label: '鼠标悬停时',
        description: '当鼠标悬停在按钮上时触发'
    }
]);

const TableOpActionInitializer: FC<any> = (props) => {
    const schema = {
        type: 'void',
        'x-action': 'tableOpAction',
        'x-toolbar': 'ActionSchemaToolbar',
        'x-settings': 'actionSettings:tableOpAction',
        'x-component': 'TableOpActionComponent',
        'x-component-props': {
        },
    };

    return <ActionInitializerItem {...props} schema={schema} />;
};

export function initialTableOpActionTrigger(app: Application) {
    app.schemaSettingsManager.add(tableOpActionSettings);
    app.addComponents({
        TableOpActionComponent,
        TableOpActionInitializer,
    });
    app.schemaInitializerManager.get('table:configureItemActions')?.add('tableOpAction', {
        type: 'item',
        title: `{{t("Automation", { ns: "${NAMESPACE}" })}}`,
        name: 'tableOpAction',
        Component: 'TableOpActionInitializer',
    });
};