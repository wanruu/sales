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
        if (refund.orderId == null || refund.orderId === undefined || refund.items.length === 0) {
            return props.messageApi.open({ type: 'error', content: '请选择退货的项目' })
        }
        if (refund.date == null) {
            return props.messageApi.open({ type: 'error', content: '请选择日期' })
        }
        refund.date = refund.date.format(DATE_FORMAT)
        refund.items = refund.items.map(item => {
            item.quantity = item.quantity || '0'
            return item
        })

        Axios({
            method: refund.id ? 'put' : 'post',
            baseURL: baseURL(),
            url: refund.id ? `salesRefund/id/${refund.id}` : 'salesRefund',
            data: refund, 
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

    const resetForm = () => {
        if (props.refund) {
            const refund = dcInvoice(props.refund)
            refund.unrefundedItems = refund.items.filter(item => item.quantity == null)
            refund.items = refund.items.filter(item => item.quantity != null)
            form.setFieldsValue(refund)
        } else {
            form.setFieldsValue(emptyInvoice(0))
        }
    }

    useEffect(resetForm, [props.refund])

    return <Form form={form} onFinish={upload}>
        <InvoiceEditView type='salesRefund' />
    
        <Divider />
        <Col align='end'>
            <Space>
                <Button icon={<SaveOutlined/>} type='primary' htmlType='submit'>
                    保存
                </Button>
                { props.refund && props.refund.id ? null : 
                    <Button icon={<InboxOutlined/>} onClick={_ => props.saveDraft(form.getFieldsValue(true))}>
                        保存草稿
                    </Button>
                }
                <Button icon={<CloseOutlined/>} 
                onClick={_ => {
                    resetForm()
                    props.dismiss()
                }}>取消</Button>
            </Space>
        </Col>
    </Form>
}