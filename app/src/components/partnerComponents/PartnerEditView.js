import React, { useEffect } from 'react'
import { Button, message, Form, Input, Col, Space } from 'antd'
import Axios from 'axios'

const { Item } = Form

import { baseURL } from '../../utils/config'

/*
    Required fields: (empty)
    Optional fields: partner, messageApi, dismiss, refresh
    1. new partner: (empty)
    2. edit partner: partner
*/
function PartnerEditView(props) {
    const [messageApi, contextHolder] = message.useMessage()
    const [form] = Form.useForm()

    const upload = () => {
        const m = props.messageApi || messageApi
        Axios({
            method: props.partner === undefined ? 'post' : 'put',
            baseURL: baseURL(),
            url: props.partner === undefined ? '/partner' : `/partner/name/${props.partner.name}`,
            data: form.getFieldsValue(),
            'Content-Type': 'application/json',
        }).then(res => {
            if (res.data.changes === 1) {
                m.open({ type: 'success', content: '保存成功', })
                if (props.dismiss !== undefined) props.dismiss()
                if (props.refresh !== undefined) props.refresh()
            } else {
                m.open({ type: 'error', content: `保存失败: ${res.data.prompt}`, })
            }
        }).catch(err => {
            m.open({ type: 'error', content: '保存失败', })
        })
    }

    // rules
    const nameRules = [
        { required: true }, { whitespace: true },
        { warningOnly: true, validator: async (rule, value) => {
            if (props.partner && value !== props.partner.name) throw new Error()
        }}
    ]
    const phoneRules = [
        // { pattern: new RegExp('^[0-9]{11}$', 'g'), message: '电话不是11位数字', warningOnly: true },
        { whitespace: true },
        { warningOnly: true, validator: async (rule, value) => {
            if (props.partner && value !== props.partner.phone) throw new Error()
        }}
    ]
    const addressRules = [
        { whitespace: true },
        { warningOnly: true, validator: async (rule, value) => {
            if (props.partner && value !== props.partner.address) throw new Error()
        }}
    ]
    const folderRules = [
        { whitespace: true },
        { warningOnly: true, validator: async (rule, value) => {
            if (props.partner && value !== props.partner.folder) throw new Error()
        }}
    ]

    // initialize form
    const initForm = () => {
        form.setFieldsValue(props.partner || { name: '', phone: '', address: '', folder: '' })
    }
    useEffect(initForm, [])

    return <>
        {contextHolder}
        <Form labelCol={{ span: 4 }} wrapperCol={{ span: 20 }} onFinish={upload} onReset={initForm} form={form}>
            <Item label='姓名' name='name' rules={nameRules}>
                <Input allowClear />
            </Item>
            <Item label='文件位置' name='folder' rules={folderRules}>
                <Input allowClear />
            </Item>
            <Item label='电话' name='phone' rules={phoneRules}>
                <Input allowClear />
            </Item>
            <Item label='地址' name='address' rules={addressRules}>
                <Input allowClear />
            </Item>
            <Col align='middle'>
                <Space>
                    <Button htmlType='reset'>重置</Button>
                    <Button type='primary' htmlType='submit'>保存</Button>
                </Space>
            </Col>
        </Form>
    </>
}


export default PartnerEditView