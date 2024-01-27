import { Form, Switch, Tooltip } from 'antd'
import React from 'react'
import { QuestionCircleOutlined } from '@ant-design/icons'


const { Item } = Form


/*
    Required: value, setValue, keyy, label, help
*/
export default function SettingSwitchItem(props) {
    return <Item label={<>
        {props.label}
        <Tooltip title={props.help} >
            <QuestionCircleOutlined style={{ marginLeft: '3px', color: 'gray' }} />
        </Tooltip>
    </>}>
        <Switch checked={props.value === 'true'} onChange={val => {
            props.setValue(`${val}`)
            localStorage.setItem(props.keyy, `${val}`)
        }} />
    </Item>
}