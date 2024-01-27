import React, { useEffect } from 'react'
import Axios from 'axios'
import {  Button, Col, Divider, Space, Form } from 'antd'
import { SaveOutlined, CloseOutlined, InboxOutlined } from '@ant-design/icons'


import { dcInvoice, emptyInvoice } from '../../utils/invoiceUtils'
import { baseURL, DATE_FORMAT } from '../../utils/config'
import InvoiceEditView from '../common/InvoiceEditView'
import '../common/Invoice.css'


/*
    Required: dismiss, refresh, messageApi
    Optional: refund, saveDraft, removeDraft
*/
export default function SalesRefundEditView(props) {
    const [form] = Form.useForm()

    const upload = () => {
        const refund = form.getFieldsValue(true)

        if (refund.date == null) {
            return props.messageApi.open({ type: 'error', content: '请选择日期' })
        }
        const newRefund = dcInvoice(refund)
        newRefund.date = newRefund.date.format(DATE_FORMAT)
        newRefund.items = newRefund.items.map(item => {
            item.quantity = item.quantity || '0'
            return item
        })
        newRefund.orderId = newRefund.items[0].orderId
        Axios({
            method: newRefund.id ? 'put' : 'post',
            baseURL: baseURL(),
            url: newRefund.id ? `salesRefund/id/${newRefund.id}` : 'salesRefund',
            data: newRefund,
            'Content-Type': 'application/json',
        }).then(_ => {
            props.messageApi.open({ type: 'success', content: '保存成功' })
            props.refresh()
            if (props.removeDraft) props.removeDraft(refund)
            props.dismiss()
        }).catch(_ => {
            props.messageApi.open({ type: 'error', content: '保存失败' })
        })
    }

    useEffect(() => {
        if (props.refund) {
            form.setFieldsValue(dcInvoice(props.refund))
        }
    }, [props.refund])

    return <Form form={form} onFinish={upload}>
        <InvoiceEditView type='salesRefund' />
    
        <Divider />
        <Col align='end'>
            <Space>
                <Button icon={<SaveOutlined/>} type='primary' htmlType='submit' disabled={form.getFieldValue('partner') === ''}>
                    保存
                </Button>
                { props.refund && props.refund.id ? null : 
                    <Button icon={<InboxOutlined/>} onClick={_ => props.saveDraft(form.getFieldsValue(true))}>
                        保存草稿
                    </Button>
                }
                <Button icon={<CloseOutlined/>} 
                onClick={_ => {
                    form.setFieldsValue(props.refund ? dcInvoice(props.refund) : emptyInvoice(0))
                    props.dismiss()
                }}>取消</Button>
            </Space>
        </Col>
    </Form>
}