import { connect, mapReadPretty, useField } from "@formily/react";
import { Input, Select as AntdSelect } from "antd";
import React, { FC } from "react";
import { useAutomation } from "../../../../hooks/useAutomation";

const useSelectValue = (field: any, value: any) => {
    const options = field && (field as any)?.dataSource || [];
    const option = options.find((option: any) => option.value === value);
    return {
        options,
        value: value,
        label: option?.label || value,
    };
};

const SelectEditable: FC<any> = ({ value, disabled, onChange, ...otherProps }) => {
    const field = useField();
    const { options } = useSelectValue(field, value);
    const { trigger } = useAutomation();
    
    return <AntdSelect
        value={value}
        options={options}
        disabled={disabled}
        onChange={(value) => {
            trigger('onChange', {
                rawEvent: null,
                value
            });
            onChange(value);
        }}
    />;
}

const SelectReadPretty: FC<any> = ({ value, ...otherProps }) => {
    if (!value) return null;
    const field = useField();
    const { label } = useSelectValue(field, value);
    return <Input value={label} {...otherProps} />;
}

// 创建基础组件
const BaseSelect: FC<any> = connect(SelectEditable, mapReadPretty(SelectReadPretty));

// 使用高阶组件添加事件支持
export const Select = BaseSelect;