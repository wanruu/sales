import React, { useEffect } from 'react'
import { Button, Col, Space, Divider, Form } from 'antd'
import { InboxOutlined, CloseOutlined, SaveOutlined } from '@ant-design/icons'
import Axios from 'axios'


import { dcInvoice, emptyInvoice, isOrderItemComplete, isOrderItemEmpty, isProductRepeat
} from '../../utils/invoiceUtils'
import { baseURL, DATE_FORMAT } from '../../utils/config'
import '../common/Invoice.css'
import OrderEditView from '../common/OrderEditView'


/*
    Required: dismiss, refresh, messageApi
    Optional: order, saveDraft, removeDraft
*/
export default function SalesOrderEditView(props) {
    const [form] = Form.useForm()
    
    const upload = () => {
        const order = form.getFieldsValue(true)
        // 1. Check data
        if (order.partner === '') {
            return props.messageApi.open({ type: 'error', content: '请填写客户名称' })
        }
        if (order.date == null) {
            return props.messageApi.open({ type: 'error', content: '请选择日期' })
        }
        const nIncomplete = order.items.filter(item => !isOrderItemComplete(item) && !isOrderItemEmpty(item)).length
        if (nIncomplete > 0) {
            return props.messageApi.open({ type: 'error', content: '表格填写不完整' })
        }
        if (isProductRepeat(order.items)) {
            return props.messageApi.open({ type: 'error', content: '产品重复' })
        }

        // 2. Clean data & Upload
        const newOrder = dcInvoice(order)
        newOrder.date = newOrder.date.format(DATE_FORMAT)
        newOrder.items = newOrder.items.filter(item => !isOrderItemEmpty(item))
        Axios({
            method: newOrder.id ? 'put' : 'post',
            baseURL: baseURL(),
            url: newOrder.id ? `salesOrder/id/${newOrder.id}` : 'salesOrder',
            data: newOrder,
            'Content-Type': 'application/json',
        }).then(_ => {
            props.messageApi.open({ type: 'success', content: '保存成功' })
            props.refresh()
            if (props.removeDraft) props.removeDraft(order)
            props.dismiss()
        }).catch(_ => {
            props.messageApi.open({ type: 'error', content: '保存失败' })
        })
    }

    useEffect(() => {
        if (props.order) {
            form.setFieldsValue(dcInvoice(props.order))
        }
    }, [props.order])

    return <Form form={form} onFinish={upload} requiredMark={false}>
        <OrderEditView />
        <Divider />

        <Col align='end'>
            <Space>
                <Button icon={<SaveOutlined/>} type='primary' htmlType='submit'>保存</Button>
                { 
                    props.order && props.order.id ? null : 
                    <Button icon={<InboxOutlined/>} onClick={_ => props.saveDraft(form.getFieldsValue(true))}>
                        保存草稿
                    </Button> 
                }
                <Button icon={<CloseOutlined/>} onClick={_ => { 
                    form.setFieldsValue(props.order ? dcInvoice(props.order) : emptyInvoice(1))
                    props.dismiss() 
                }}>
                    取消
                </Button>
            </Space>
        </Col>
    </Form>
}