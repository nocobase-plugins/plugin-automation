/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { connect, mapReadPretty } from "@formily/react";
import { Input } from "antd";
import React, { FC, useCallback, useEffect, useRef, useState } from "react";
import { useAutomation } from "../../../../hooks/useAutomation";

const TextEditable: FC<any> = ({ value, disabled, onChange, ...otherProps }) => {

    const { trigger } = useAutomation();
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [isExecuting, setIsExecuting] = useState(false);

    const debouncedChange = useCallback(async (e) => {
        // 如果正在执行自动化，跳过触发
        if (isExecuting) return;
        
        // Clear existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set new timer with 300ms delay
        debounceTimerRef.current = setTimeout(async () => {
            setIsExecuting(true);
            try {
                await trigger('', 'onChange', {
                    rawEvent: e,
                    value: e.target.value
                });
            } catch (error) {
                console.error('Text automation execution failed:', error);
            } finally {
                setIsExecuting(false);
            }
        }, 300);
    }, [trigger, onChange, isExecuting]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    return <Input
        value={value}
        disabled={disabled || isExecuting}
        onChange={(e) => {
            debouncedChange(e);
            onChange(e.target.value);
        }}
        placeholder={isExecuting ? '正在执行自动化...' : otherProps.placeholder}
        style={{
            ...otherProps.style,
            opacity: isExecuting ? 0.7 : 1,
            transition: 'opacity 0.2s ease'
        }}
        {...otherProps}
    />;

}

const TextReadPretty: FC<any> = ({ value, ...otherProps }) => {
    if (!value) return null;
    return <Input value={value} {...otherProps} />;
}

// 创建基础组件
const BaseText: FC<any> = connect(TextEditable, mapReadPretty(TextReadPretty));

// 使用高阶组件添加事件支持
export const Text = BaseText;