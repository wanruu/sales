import React, { useState, useEffect } from 'react'
import Axios from 'axios'
import { Table, Button, Space, Input, Form } from 'antd'
import { pinyin } from 'pinyin-pro'


const { Item } = Form


import { baseURL, invoiceSettings } from '../../utils/config'
import { calTotalAmount } from '../../utils/invoiceUtils'


/*
    Required: dismiss, refund, setRefund, type
*/
export default function RefundSelectionView(props) {
    const [form] = Form.useForm()
    const [orders, setOrders] = useState([])
    const [filteredOrders, setFilteredOrders] = useState([])

    const load = () => {
        setOrders([])
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: props.type,
            'Content-Type': 'application/json',
        }).then(res => {
            const os = res.data.filter(o => !o.refundId)
            setOrders(os)
            setFilteredOrders(os)
        }).catch(_ => { })
    }

    const selectOrder = (order) => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: `${props.type}/id/${order.id}`,
            'Content-Type': 'application/json',
        }).then(res => {
            const newRefund = props.refund
            newRefund.items = res.data.items.map(item => {
                return Object.assign(item, { delivered: false, remark: '', maxQuantity: item.quantity })
            })
            newRefund.unrefundedItems = res.data.items.filter(item => {
                item.quantity == null
            }).map(item => {
                return Object.assign(item, { maxQuantity: item.quantity })
            })
            newRefund.amount = calTotalAmount(newRefund.items)
            newRefund.partner = order.partner
            newRefund.orderId = order.id
            props.setRefund(newRefund)
            props.dismiss()
        }).catch(_ => { })
    }

    const orderColumns = [
        { title: '序号', align: 'center', render: (_, __, idx) => idx + 1 },
        { title: props.type === 'salesOrder' ? '销售单号' : '采购单号', dataIndex: 'id', align: 'center' },
        { title: props.type === 'salesOrder' ? '客户' : '供应商', dataIndex: 'partner', align: 'center' },
        { title: '金额', dataIndex: 'amount', align: 'center', render: amount => {
            const amountSign = invoiceSettings.get('ifShowAmountSign') === 'true' ? invoiceSettings.get('amountSign') : ''
            return amountSign + amount.toLocaleString()
        }},
        { title: '日期', dataIndex: 'date', align: 'center' },
        { title: '操作', align: 'center', render: (_, order) => (
            <Button onClick={_ => selectOrder(order)}>选择</Button>
        )}
    ]

    const search = () => {
        const id = form.getFieldValue('id')
        const partner = form.getFieldValue('partner')
        const newOrders = orders.filter(o =>
            (
                !partner ||
                o.partner.includes(partner) ||
                pinyin(o.partner, { pattern: 'first', toneType: 'none', type: 'array' }).join('').includes(partner) ||
                pinyin(o.partner, { toneType: 'none', type: 'array' }).join('').includes(partner)
            ) &&
            (!id || o.id.includes(id))
        )
        setFilteredOrders(newOrders)
    }

    useEffect(load, [])

    return (
        <Space direction='vertical' style={{ width: '100%' }}>
            <Form form={form} onFinish={search} layout='inline' style={{ paddingTop: 10 }}>
                <Item name='id' style={{ paddingBottom: 5 }}>
                    <Input placeholder='单号' allowClear />
                </Item>
                <Item name='partner' style={{ paddingBottom: 5 }}>
                    <Input placeholder='姓名（支持拼音、首字母）' allowClear style={{ width: 250 }} />
                </Item>
                <Item style={{ paddingBottom: 5 }}>
                    <Button type='primary' htmlType='submit'>搜索</Button>
                </Item>
            </Form>
            
            <Table dataSource={filteredOrders} rowKey={record => record.id} size='small'
            columns={orderColumns} bordered
            pagination={{ showSizeChanger: false, showQuickJumper: true }}
            />
        </Space>
    )
}