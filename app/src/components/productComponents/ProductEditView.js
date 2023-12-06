import React, { useEffect } from 'react'
import { Input, Space, Button, Form, InputNumber, message, Col, Row } from 'antd'
import  Axios  from 'axios'
import Decimal from 'decimal.js'

const { Item } = Form

import { baseURL, UNIT_COEFF_DICT, invoiceSettings } from '../../utils/config'
import { UnitInput } from '../common/PromptInput'

/*
    Required fields: product
    Optional fields: messageApi, dismiss, refresh
    
    1. new product: product.id === undefined
    2. edit product: product.id !== undefined
*/
function ProductEditView(props) {
    const [messageApi, contextHolder] = message.useMessage()
    const [form] = Form.useForm()

    const upload = () => {
        const m = props.messageApi || messageApi
        const p = form.getFieldsValue()
        p.quantity = p.quantity || '0'
        p.material = invoiceSettings.get('ifShowMaterial') === 'true' ? p.material : ''
        if (props.product.id !== undefined) {
            p.unitRatio = Decimal(UNIT_COEFF_DICT[p.unit]).div(UNIT_COEFF_DICT[props.product.unit]).toString()
        }
        Axios({
            method: props.product.id === undefined ? 'post' : 'put',
            baseURL: baseURL(),
            url: props.product.id === undefined ? '/product' : `/product/id/${props.product.id}`,
            data: p,
            'Content-Type': 'application/json',
        }).then(res => {
            if (res.data.changes === 1) {
                m.open({ type: 'success', content: '保存成功' })
                if (props.dismiss !== undefined) props.dismiss()
                if (props.refresh !== undefined) props.refresh()
            } else {
                m.open({ type: 'error', content: `保存失败：${res.data.prompt}` })
            }
        }).catch(err => {
            m.open({ type: 'error', content: '保存失败' })
        })
    }

    // rules
    const materialRules = [
        { required: true }, { whitespace: true },
        { warningOnly: true, validator: async (rule, value) => {
            if (props.product.id && value !== props.product.material) throw new Error()
        }}
    ]
    const nameRules = [
        { required: true }, { whitespace: true },
        { warningOnly: true, validator: async (rule, value) => {
            if (props.product.id && value !== props.product.name) throw new Error()
        }}
    ]
    const specRules = [
        { required: true }, { whitespace: true },
        { warningOnly: true, validator: async (rule, value) => {
            if (props.product.id && value !== props.product.spec) throw new Error()
        }}
    ]
    const quantityRules = [
        { warningOnly: true, validator: async (rule, value) => {
            if (props.product.id && value !== props.product.quantity) throw new Error()
        }}
    ]
    const unitRules = [
        { required: true, message: '请选择单位' },
        { warningOnly: true, validator: async (rule, value) => {
            if (props.product.id && value !== props.product.unit) throw new Error()
        }}
    ]

    // initialize form
    const initForm = () => {
        form.setFieldsValue(props.product)
    }
    useEffect(initForm, [])

    return <>
        {contextHolder}
        <Form labelCol={{ span: 3 }} wrapperCol={{ span: 20 }} onFinish={upload} onReset={initForm} form={form}>
            { invoiceSettings.get('ifShowMaterial') === 'true' ? <Item label='材质' name='material' rules={materialRules}>
                <Input allowClear />
            </Item> : null }
            <Item label='名称' name='name' rules={nameRules}>
                <Input allowClear />
            </Item>
            <Item label='规格' name='spec' rules={specRules}>
                <Input allowClear />
            </Item>
            <Item label='数量'>
                <Row>
                    <Col span={12}>
                        <Item name='quantity' rules={quantityRules}>
                            <InputNumber stringMode />
                        </Item>
                    </Col>
                    <Col span={12}>
                        <Item label='单位' name='unit' rules={unitRules}>
                            <UnitInput size='medium' style={{ width: '80px' }} />
                        </Item>
                    </Col>
                </Row>
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


export default ProductEditView