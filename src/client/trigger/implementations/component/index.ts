/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, SchemaSettings } from '@nocobase/client';
import { tval } from '@nocobase/utils/client';

import { Text } from './components/Text';
import { Select } from './components/Select';
import { eventRegistry } from '../../core/EventRegistry';
import { NAMESPACE } from '../../../constant';

export * from './components';

const COMPONENTS = {
    'Automation_Trigger_Text': Text,
    'Automation_Trigger_Select': Select,
};

export function initialComponentTrigger(app: Application) {
    // 注册组件的自动化事件
    eventRegistry.register('Automation_Trigger_Text', [
        {
            key: 'onChange',
            label: '值变更时',
            description: '当输入框的值发生变化时触发'
        }
    ]);

    eventRegistry.register('Automation_Trigger_Select', [
        {
            key: 'onChange',
            label: '值变更时',
            description: '当选择项发生变化时触发'
        }
    ]);

    // 注册组件和相应的设置
    for (const [key, value] of Object.entries(COMPONENTS)) {
        value.displayName = key;
        app.schemaSettingsManager.add(new SchemaSettings({
            name: `fieldSettings:component:${key}`,
            items: [
                {
                    name: 'customAutomationConfig',
                    Component: 'AutomationConfiguration'
                }
            ],
        }));
    }

    // 添加组件到应用
    app.addComponents(COMPONENTS);

    // 为各种字段接口添加自动化组件选项
    const interfaces = ['checkbox', 'checkboxGroup', 'collection', 'color', 'createdAt', 'createdBy', 'date', 'datetime', 'datetimeNoTz', 'email', 'icon', 'id', 'input', 'integer', 'json', 'linkTo', 'm2m', 'm2o', 'markdown', 'multipleSelect', 'nanoid', 'number', 'o2m', 'o2o', 'oho', 'obo', 'password', 'percent', 'phone', 'radioGroup', 'richText', 'select', 'subTable', 'tableoid', 'textarea', 'time', 'unixTimestamp', 'updatedAt', 'updatedBy', 'url', 'uuid'];
    interfaces.forEach((interfaceName) => {
        let component = 'Automation_Trigger_Text';
        if (interfaceName === 'select') {
            component = 'Automation_Trigger_Select';
        }
        app.addFieldInterfaceComponentOption(interfaceName, {
            label: tval('Automation', { ns: NAMESPACE }),
            value: component,
        });
    });
};
