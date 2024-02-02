import React, { useEffect, useState } from 'react'
import { Button, Popover, Space, Form, Input, Row } from 'antd'
import Axios from 'axios'

const { Item } = Form

import { baseURL } from '../../utils/config'
import './partnerPopoverView.css'

const labelCol = { span: 6 }
const wrapperCol = { span: 18 }


function EditView(props) {
    const [error, setError] = useState('')
    const [form] = Form.useForm()
    
    const upload = () => {
        Axios({
            method: 'put',
            baseURL: baseURL(),
            url: `/partner/name/${props.partner.name}`,
            data: form.getFieldsValue(),
            'Content-Type': 'application/json',
        }).then(res => {
            if (res.data.changes === 1) {
                props.refresh()
                props.dismiss()
                setError('')
            } else {
                setError(res.data.prompt + '！')
            }
        }).catch(err => { console.error(err) })
    }
    useEffect(() => {
        form.setFieldsValue(props.partner)
    }, [])

    return <Form layout='horizontal' size='small' form={form} className='partnerPopover' onFinish={upload}
        wrapperCol={wrapperCol} labelCol={labelCol}>
        <Item label='姓名' name='name' rules={[{ required: true }, { whitespace: true }]}><Input onChange={_ => setError('')}/></Item>
        <Item label='文件位置' name='folder' rules={[{ whitespace: true }]}><Input /></Item>
        <Item label='电话' name='phone' rules={[{ whitespace: true }]}><Input /></Item>
        <Item label='地址' name='address' rules={[{ whitespace: true }]}><Input.TextArea /></Item>
        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
            <Space style={{ color: 'red' }}>{error}</Space>
            <Space style={{ justifyContent: 'end' }}>
                <Button type='primary' htmlType='submit'>保存</Button>
                <Button onClick={props.dismiss}>取消</Button>
            </Space>
        </Space>
    </Form>
}

/*
    Required: partner, refresh
*/
export default function PartnerPopoverView(props) {
    const [mode, setMode] = useState('view')

    return <Popover trigger='click' onOpenChange={visible => visible || setMode('view')} content={ mode === 'view' ? 
        <Form layout='horizontal' size='small' className='partnerPopover' wrapperCol={wrapperCol} labelCol={labelCol}>
            <Item label='姓名'>{ props.partner.name }</Item>
            <Item label='文件位置'>{ props.partner.folder }</Item>
            <Item label='电话'>{ props.partner.phone }</Item>
            <Item label='地址'>{ props.partner.address }</Item>
            <Row align='end'>
                <Button type='primary' onClick={_ => setMode('edit')}>编辑</Button>
            </Row>
        </Form> : <EditView partner={props.partner} refresh={props.refresh} dismiss={_ => setMode('view')} />}>
        <a>{ props.partner.name }</a>
    </Popover>
}