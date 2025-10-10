import { useField, useFieldSchema, useForm } from "@formily/react";
import { Action, ActionInitializerItem, Application, ButtonEditor, InitializerWithSwitch, RemoveButton, SchemaInitializerItemType, SchemaSettings, SchemaSettingsModalItem, useDesignable, useSchemaInitializerItem, useSchemaToolbar, useCompile } from "@nocobase/client";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { NAMESPACE } from "../../../../constant";
import { Button } from "antd";
import { useAutomation } from "../../../../hooks/useAutomation";
import { Configuration } from "../../../../Configuration";
import { registerAutomationEvents } from "../../../core/EventRegistry";

const TitleEditor = () => {
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
                        'x-uid': fieldSchema['x-uid'],
                        title,
                    },
                });
                dn.refresh();
            }}
        />
    );
};

const GeneralActionComponent = (props) => {
    const { designable } = useDesignable?.() || {};
    const { t } = useTranslation(NAMESPACE);
    const { trigger } = useAutomation();
    const fieldSchema = useFieldSchema();
    const compile = useCompile();

    // 读取用户自定义的名称，如果没有则使用默认值
    const title = compile(fieldSchema?.title) || t('Automation');

    const actionOnClick = (e) => {
        trigger('onClick', {
            rawEvent: e
        });
    };
    if (designable) {
        // In the designer mode, use standard Actions while retaining the editing capability.
        return <Action {...props} title={title} onClick={actionOnClick}></Action>;
    } else {
        // In non-designer mode, use buttons. Avoid the situation where the title of the Action becomes [object Object] after using custom components for the Action's title.
        return (
            <Button onClick={actionOnClick} title={title}>
                {title}
            </Button>
        );
    }
};

// 注册组件的自动化事件
registerAutomationEvents('GeneralActionComponent', [
    {
        key: 'onClick',
        label: '点击时',
        description: '当按钮被点击时触发'
    }
]);

export const GeneralActionInitializer = (props) => {
    const { t } = useTranslation(NAMESPACE);
    
    const schema = {
        type: 'void',
        title: t('Automation'),
        'x-action': 'generalAction',
        'x-toolbar': 'ActionSchemaToolbar',
        'x-component': 'GeneralActionComponent',
        'x-settings': 'actionSettings:generalAction',
        'x-component-props': {
        },
    };

    return <ActionInitializerItem {...props} schema={schema} />;
};

const createGeneralActionInitializerItem = (): SchemaInitializerItemType => ({
    name: 'generalAction',
    title: `{{t("Automation", { ns: "${NAMESPACE}" })}}`,
    Component: GeneralActionInitializer,
    schema: {
        'x-action-settings': {},
    },
});

export function initialGeneralActionTrigger(app: Application) {
    app.addComponents({'GeneralActionComponent': GeneralActionComponent});
    app.schemaInitializerManager.addItem(
        'createForm:configureActions',
        'generalAction',
        createGeneralActionInitializerItem(),
    );
    app.schemaInitializerManager.addItem(
        'editForm:configureActions',
        'generalAction',
        createGeneralActionInitializerItem(),
    );
    app.schemaInitializerManager.addItem(
        'table:configureActions',
        'generalAction',
        createGeneralActionInitializerItem(),
    );
    app.schemaSettingsManager.add(new SchemaSettings({
        name: `actionSettings:generalAction`,
        items: [
            {
              name: 'editTitle',
              Component: TitleEditor,
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
    }));
};