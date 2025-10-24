import { connect, mapReadPretty, useField } from "@formily/react";
import { Input, Select as AntdSelect } from "antd";
import React, { FC, useState } from "react";
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
    const [isExecuting, setIsExecuting] = useState(false);
    
    const handleChange = async (newValue) => {
        if (isExecuting) return; // 防止重复触发
        
        setIsExecuting(true);
        try {
            await trigger('', 'onChange', {
                rawEvent: null,
                value: newValue
            });
            onChange(newValue);
        } catch (error) {
            console.error('Select automation execution failed:', error);
        } finally {
            setIsExecuting(false);
        }
    };
    
    return <AntdSelect
        value={value}
        options={options}
        disabled={disabled || isExecuting}
        onChange={handleChange}
        placeholder={isExecuting ? '正在执行自动化...' : otherProps.placeholder}
        style={{
            ...otherProps.style,
            opacity: isExecuting ? 0.7 : 1,
            transition: 'opacity 0.2s ease'
        }}
        {...otherProps}
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