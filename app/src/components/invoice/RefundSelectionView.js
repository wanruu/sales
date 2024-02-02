import React, { useState, useEffect } from 'react'
import Axios from 'axios'
import { Table, Button } from 'antd'
import _ from 'lodash'

import { baseURL, invoiceSettings } from '../../utils/config'
import { calTotalAmount } from '../../utils/invoiceUtils'


/*
    Required: dismiss, refund, setRefund, type
*/
export default function RefundSelectionView(props) {
    const [orders, setOrders] = useState([])

    const load = () => {
        setOrders([])
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: props.type,
            'Content-Type': 'application/json',
        }).then(res => {
            setOrders(res.data.filter(o => !o.refundId))
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

    useEffect(load, [])

    return (
        <Table dataSource={orders} rowKey={record => record.id} size='small'
        columns={orderColumns}
        pagination={{ showSizeChanger: false, showQuickJumper: true }}
        />
    )
}