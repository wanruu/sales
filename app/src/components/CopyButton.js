import { Button, Tooltip } from "antd";
import { useState } from "react";
import React from 'react';
import { CopyOutlined } from '@ant-design/icons';



function CopyButton(props) {
    const [showTooltip, setShowTooltip] = useState(false);

    const onCopy = () => {
        if (props.text !== undefined) {
            navigator.clipboard.writeText(props.text);
            setShowTooltip(true);
            setTimeout(function () {
                setShowTooltip(false);
            }, 1000);
        }
    }

    return (
        <Tooltip title='已复制' open={showTooltip}>
            <Button icon={<CopyOutlined style={{color:'gray'}}/>} size='small' onClick={onCopy}/>
        </Tooltip>
    );
}

export default CopyButton;