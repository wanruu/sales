import React, { useState, useEffect } from 'react'
import { Table, Button, Input, DatePicker, Col, InputNumber, Row, Space, Divider } from 'antd'
import { InboxOutlined, CloseOutlined, FieldNumberOutlined, DeleteOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons'
import { Decimal } from 'decimal.js'
import Axios from 'axios'

import { dcInvoice, calItemAmount, calTotalAmount, emptyInvoice, emptyInvoiceItem } from '../../utils/invoiceUtils'
import { isSalesOrderItemEmpty, isSalesOrderItemComplete } from '../../utils/salesOrderUtils'
import { PartnerInput, ProductInput, UnitInput, DeliveredInput } from '../common/PromptInput'
import { baseURL, dateFormat } from '../../utils/config'
import '../common/Invoice.css'


/*
    Required: dismiss, refresh, messageApi
    Optional: order, saveDraft, removeDraft
*/
export default function SalesOrderEditView(props) {
    const [order, setOrder] = useState(emptyInvoice(1))
    
    // Order
    const initOrder = () => {
        setOrder(props.order ? dcInvoice(props.order) : emptyInvoice(1))
    }
    const updateRow = (idx, field, value) => {
        const newEditOrder = dcInvoice(order)
        newEditOrder.items[idx][field] = value
        if (['quantity', 'unit', 'price', 'discount'].includes(field)) {
            const { originalAmount, amount } = calItemAmount(newEditOrder.items[idx])
            newEditOrder.items[idx].originalAmount = originalAmount
            newEditOrder.items[idx].amount = amount
            newEditOrder.amount = calTotalAmount(newEditOrder.items)
        }
        setOrder(newEditOrder)
    }
    const updateOrder = (field, value) => {
        const newEditOrder = dcInvoice(order)
        newEditOrder[field] = value
        setOrder(newEditOrder)
    }
    const upload = () => {
        // 1. Check data
        if (order.partner === '') {
            props.messageApi.open({ type: 'error', content: '收货单位不得为空' })
            return
        }
        const nIncomplete = order.items.filter(item => !isSalesOrderItemComplete(item) && !isSalesOrderItemEmpty(item)).length
        if (nIncomplete > 0) {
            props.messageApi.open({ type: 'error', content: '表格填写不完整' })
            return
        }
        var isRepeat = false
        for (const item1 of order.items) {
            for (const item2 of order.items) {
                if (item1.id !== item2.id && item1.name === item2.name && item1.spec === item2.spec && item1.material === item2.material) {
                    isRepeat = true
                    break
                }
            }
            if (isRepeat) break
        }
        if (isRepeat) {
            props.messageApi.open({ type: 'error', content: '产品材质、名称、规格不得重复' })
            return
        }

        // 2. Clean data & Upload
        const newOrder = dcInvoice(order)
        newOrder.date = newOrder.date.format(dateFormat)
        newOrder.items = newOrder.items.filter(item => !isSalesOrderItemEmpty(item))
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
    
    // Table
    const itemColumns = [
        { title: '', align: 'center', width: 30, render: (_, __, idx) => idx + 1 },
        { title: '材质', dataIndex: 'material', align: 'center', width: 50, render: (_, record, idx) =>
            <ProductInput field='material' size='small' style={{ width: '100%' }} 
                value={record.material} onChange={value => updateRow(idx, 'material', value)} />
        },
        { title: '名称', dataIndex: 'name', align: 'center', width: 150, render: (_, record, idx) =>
            <ProductInput field='name' size='small' style={{ width: '100%' }} 
                value={record.name} onChange={value => updateRow(idx, 'name', value)} />
        },
        { title: '规格', dataIndex: 'spec', align: 'center', width: 70, render: (_, record, idx) =>
            <ProductInput field='spec' size='small' style={{ width: '100%' }} 
                value={record.spec} onChange={value => updateRow(idx, 'spec', value)} /> 
        },
        { title: '数量', dataIndex: 'quantity', align: 'center', width: 70, render: (_, record, idx) => 
            <InputNumber min={0} stringMode keyboard={false} size='small' controls={false} style={{width: '100%'}} 
                value={record.quantity} onChange={value => updateRow(idx, 'quantity', value)} />
        },
        { title: '单位', dataIndex: 'unit', align: 'center', width: 50, render: (_, record, idx) => 
            <UnitInput material={record.material} name={record.name} spec={record.spec}
                size='small' align='center' style={{width: '100%'}} value={record.unit} 
                onChange={value => updateRow(idx, 'unit', value)} />
        },
        { title: '单价', dataIndex: 'price', align: 'center', width: 70, render: (_, record, idx) => 
            <InputNumber min={0} stringMode keyboard={false} size='small' controls={false} style={{width: '100%'}} value={record.price} 
                onChange={value => updateRow(idx, 'price', value)} />
        },
        { title: '金额', dataIndex: 'originalAmount', align: 'center', width: 80 },
        { title: '折扣', dataIndex: 'discount', align: 'center', width: 60, render: (_, record, idx) => 
            <InputNumber keyboard={false} size='small' min={0} max={100} controls={false} style={{width: '100%'}} 
                value={record.discount} onChange={value => updateRow(idx, 'discount', value)}
                formatter={(value) => `${value}%`} parser={(value) => value.replace('%', '')} />
        },
        { title: '折后价', dataIndex: 'amount', align: 'center', width: 80 },
        { title: '备注', dataIndex: 'remark', align: 'center', width: 100, render: (_, record, idx) => 
            <Input size='small' style={{ width: '100%' }} value={record.remark} onChange={e => updateRow(idx, 'remark', e.target.value)} />
        },
        { title: '配送', dataIndex: 'delivered', align: 'center', width: 60, fixed: 'right', render: (_, record, idx) => 
            <DeliveredInput size='small' align='center' style={{ width: '100%' }} value={record.delivered} 
                onChange={value => updateRow(idx, 'delivered', value)} />
        },
        { title: '', align: 'center', width: 30, fixed: 'right', render: (_, __, idx) => 
            <Button type='link' size='small' danger onClick={_ => {
                const newOrder = dcInvoice(order)
                newOrder.items.splice(idx, 1)
                newOrder.amount = calTotalAmount(newOrder.items)
                setOrder(newOrder)
            }}><DeleteOutlined /></Button>
        }
    ]

    // Effect
    useEffect(initOrder, [props.order])
    useEffect(() => {
        const newOrder = dcInvoice(order)
        if (order.items.length === 0 || !isSalesOrderItemEmpty(order.items.at(-1))) {
            newOrder.items.push(emptyInvoiceItem())
            setOrder(newOrder)
        } else if (order.items.length >= 2 && isSalesOrderItemEmpty(order.items.at(-2))) {
            newOrder.items.pop()
            setOrder(newOrder)
        }
    }, [order])

    // Return
    return <Space direction='vertical' style={{ width: '100%', marginTop: '10px', marginBottom: '15px' }}>
        <Row style={{ justifyContent: 'space-between' }}>
            <Col style={{ width: '30%' }}>客户：
                <PartnerInput style={{ width: 180 }} size='small' value={order.partner} onChange={value => updateOrder('partner', value)}  />
            </Col>
            <Col style={{ width: '30%' }} align={order.id ? 'center' : 'right'}>日期：
                <DatePicker style={{ width: 150 }} size='small' value={order.date} onChange={value => updateOrder('date', value)} />
            </Col>
            { order.id ? <Col style={{ width: '30%' }} align='right'><FieldNumberOutlined style={{ marginRight: '4px' }} />{order.id}</Col> : null }
        </Row>
        <Row style={{ justifyContent: 'space-between' }}>
            <Col style={{ width: '30%' }}>总金额：{order.amount}</Col>
            <Col style={{ width: '30%' }} align='center'>订金：
                <InputNumber value={order.prepayment} style={{ width: 150 }} size='small' keyboard={false} stringMode controls={false} 
                    onChange={value => updateOrder('prepayment', value)}
                />
            </Col>
            <Col style={{ width: '30%' }} align='right'>尾款：
                <InputNumber size='small' keyboard={false} stringMode controls={false} style={{ width: 120 }}
                    placeholder={`应付 ${Decimal(order.amount).minus(order.prepayment || 0)}`}
                    value={order.payment} onChange={value => updateOrder('payment', value)} />
                <Button size='small' style={{marginLeft: '5px'}} icon={<EditOutlined />}
                    onClick={_ => updateOrder('payment', Decimal(order.amount).minus(order.prepayment || 0).toString())} />
            </Col>
        </Row>

        <Table className='editTable' dataSource={order.items} size='small' bordered style={{ height: 400 }} 
            scroll={{x: 'max-content', y: 400 }} pagination={false} rowKey={record => record.id} columns={itemColumns} />
        <Divider />

        <Col align='end'>
            <Space>
                <Button icon={<SaveOutlined/>} type='primary' onClick={upload}>保存</Button>
                { order.id ? null : <Button icon={<InboxOutlined/>} onClick={_ => props.saveDraft(order)}>保存草稿</Button> }
                <Button icon={<CloseOutlined/>} onClick={_ => { initOrder(); props.dismiss() }}>取消</Button>
            </Space>
        </Col>
    </Space>
}