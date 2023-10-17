import React from "react";
import { useEffect, useState, useRef } from "react";
import { Table, Modal, Button, message, Input, AutoComplete, DatePicker, Col, InputNumber, Row, FloatButton, Space, Popover, Select } from "antd";
import { PlusOutlined, InboxOutlined, } from '@ant-design/icons'
import dayjs from 'dayjs'
import Axios from "axios";
const Decimal = require('decimal')

const { Column } = Table

import { emptySalesOrder, dcSalesOrder, isSalesOrderItemEmpty, emptySalesOrderItem, isSalesOrderItemComplete } from '../../utils/salesOrderConfig'
import { baseURL } from "../../utils/config";
import './SalesOrderFB.css';


const unitOptions = [
    { label: '-', value: '' },
    { label: '千件', value: '千件' },
    { label: '只', value: '只' },
    { label: '包', value: '包' },
    { label: '斤', value: '斤' },
    { label: '套', value: '套' }
]
const unitCoeffDict = {
    '': Decimal(0),
    '千件': Decimal(1000),
    '只': Decimal(1),
    '包': Decimal(1),
    '斤': Decimal(1),
    '套': Decimal(1),
}

const updateAmount = (itemDict) => {
    var itemDict = itemDict
    if (itemDict.quantity == null || itemDict.price == null || itemDict.unit === '') {
        itemDict.originalAmount = Decimal(0)
    } else {
        itemDict.originalAmount = Decimal(itemDict.quantity).mul(itemDict.price).mul(unitCoeffDict[itemDict.unit])
    }
    if (itemDict.originalAmount.internal === '00') { itemDict.originalAmount = Decimal(0) }
    if (itemDict.discount == null) {
        itemDict.amount = Decimal(0)
    } else {
        itemDict.amount = Decimal(itemDict.originalAmount).mul(itemDict.discount).div(100)
    }
    return itemDict
}
const calItemAmount = (itemDict) => {
    var orginalAmount = itemDict.quantity == null || itemDict.price == null || itemDict.unit === '' ?
        Decimal(0) : Decimal(itemDict.quantity).mul(itemDict.price).mul(unitCoeffDict[itemDict.unit])
    if (orginalAmount.internal === '00') { 
        orginalAmount = Decimal(0)
    }
    var amount = itemDict.discount == null ? Decimal(0) : Decimal(orginalAmount).mul(itemDict.discount).div(100)
    if (amount.internal === '00') { 
        amount = Decimal(0)
    }
    console.log(orginalAmount.toString())
    return { orginalAmount: orginalAmount, amount: amount}
}
const calTotalAmount = (items) => {
    const amount = items.reduce((previous, current) => previous.add(current.amount), Decimal(0))
    if (amount.internal === '00') { 
        return Decimal(0)
    }
    return amount
}


function SalesOrderFB() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editOrder, setEditOrder] = useState(emptySalesOrder())
    const [draftOrders, setDraftOrders] = useState([])
    const [isUploading, setIsUploading] = useState(false)
    const [messageApi, contextHolder] = message.useMessage();


    useEffect(() => {
        const newEditOrder = dcSalesOrder(editOrder)
        if (!isSalesOrderItemEmpty(editOrder.items.at(-1))) {
            newEditOrder.items.push(emptySalesOrderItem())
            setEditOrder(newEditOrder)
        } else if (editOrder.items.length >= 2 && isSalesOrderItemEmpty(editOrder.items.at(-2))) {
            newEditOrder.items.pop()
            setEditOrder(newEditOrder)
        }
    }, [editOrder])


    // modal
    const showModal = () => {
        setIsModalOpen(true)
    }
    const hideModal = () => {
        setIsModalOpen(false)
    }

    // edit
    const updatePartner = (value) => {
        const newOrder = dcSalesOrder(editOrder)
        newOrder.partner = value
        setEditOrder(newOrder)
    }
    const updateDate = (value) => {
        const newOrder = dcSalesOrder(editOrder)
        newOrder.date = value
        setEditOrder(newOrder)
    }
    const updateRow = (id, field, value) => {
        const newEditOrder = dcSalesOrder(editOrder)
        newEditOrder.items = newEditOrder.items.map(item => {
            if (item.id === id) { item[field] = value }
            if (['quantity', 'unit', 'price', 'discount'].includes(field)) {
                // item = updateAmount(item)
                const { orginalAmount, amount } = calItemAmount(item)
                item.orginalAmount = orginalAmount
                item.amount = amount
            }
            return item
        })
        if (['quantity', 'unit', 'price', 'discount'].includes(field)) {
            newEditOrder.amount = calTotalAmount(newEditOrder.items)
        }
        console.log(newEditOrder.items)
        setEditOrder(newEditOrder)
    }

    // draft
    const saveDraft = () => {
        const isOldDraft = editOrder.draftTime !== undefined
        const newOrder = dcSalesOrder(editOrder)
        newOrder.draftTime = dayjs()
        var newDraftOrders = draftOrders
        if (isOldDraft) {
            newDraftOrders = newDraftOrders.filter(order => order.draftTime !== editOrder.draftTime)
        }
        newDraftOrders.unshift(newOrder)
        setDraftOrders(newDraftOrders)
        setEditOrder(emptySalesOrder())
        hideModal()
    }
    const removeDraft = (draft) => {
        setDraftOrders(draftOrders.filter(d => d.draftTime !== draft.draftTime))
    }
    const openDraft = (draft) => {
        setEditOrder(draft)
        setIsModalOpen(true)
    }

    // upload
    const upload = () => {
        setIsUploading(true)
        // clean data
        const order = dcSalesOrder(editOrder);
        order.date = order.date.format('YYYY-MM-DD');
        order.items = order.items.filter(item => !isSalesOrderItemEmpty(item));
        const nIncomplete = order.items.filter(item => !isSalesOrderItemComplete(item)).length;

        // check data
        if (order.partner === '') {
            messageApi.open({ type: 'error', content: '收货单位不得为空', });
            setIsUploading(false)
        } else if (nIncomplete > 0) {
            messageApi.open({ type: 'error', content: '表格填写不完整', });
            setIsUploading(false)
        } else {
            Axios({
                method: 'post',
                baseURL: baseURL(),
                url: 'salesOrder',
                data: order,
                'Content-Type': 'application/json',
            }).then(res => {
                if (res.status === 200) {
                    messageApi.open({ type: 'success', content: '保存成功', });
                    setEditOrder(emptySalesOrder())
                    hideModal()
                    removeDraft(order)
                } else {
                    messageApi.open({ type: 'error', content: `${res.status}: 保存失败`, });
                }
                setIsUploading(false)
            }).catch(_ => {
                messageApi.open({ type: 'error', content: '保存失败', });
                setIsUploading(false)
            });
        }
    }

    return (<>
        {contextHolder}
        <Popover title={`草稿箱 (${draftOrders.length})`} placement="topLeft" zIndex={999} content={
            <Table id='draftTable' dataSource={draftOrders} size='small' pagination={{pageSize: 5, size: 'small'}} hideOnSinglePage bordered>
                <Column title='保存时间' dataIndex='draftTime' align='center' render={time => time.format('HH:mm:ss')} />
                <Column title='收货单位' dataIndex='partner' align='center' />
                <Column title='产品数' dataIndex='items' align='center' render={items => items.length-1} />
                <Column title='操作' align='center' render={(_, draft) => (
                    <Space.Compact size='small'>
                        <Button type='link' size='small' onClick={_ => openDraft(draft)}>编辑</Button>
                        <Button type='link' danger size='small' onClick={_ => removeDraft(draft)}>删除</Button>
                    </Space.Compact>
                )} />
            </Table>
        } destroyTooltipOnHide>
            <FloatButton icon={<InboxOutlined />} style={{ right: 80, }} badge={{
                count: draftOrders.length,
                color: 'blue',
            }} />
        </Popover>
        
        <FloatButton icon={<PlusOutlined />} type='primary' onClick={showModal} style={{ right: 24, }} />
        <Modal open={isModalOpen} width={900} centered onCancel={hideModal} footer={
            <Space>
                <Button onClick={saveDraft}>保存草稿</Button>
                <Button onClick={upload} type='primary' loading={isUploading}>保存</Button>
            </Space>
        }>
            <br/>
            <Row>
                <Col span={12}>收货单位：<AutoComplete style={{width: 200}} size='small' value={editOrder.partner} onChange={value => updatePartner(value)} /></Col>
                <Col span={12}>日期：<DatePicker size='small' value={editOrder.date} onChange={value => updateDate(value)}/></Col>
            </Row>
            <br/>
            <Table id='editTable' dataSource={editOrder.items} size='small' bordered scroll={{x: 'max-content', y: 300 }} pagination={false} >
                <Column title='材质' dataIndex='material' align='center' width={45} render={(_, row) => 
                    <AutoComplete size='small' style={{width: '100%'}} value={row.material} onChange={value => updateRow(row.id, 'material', value)} />
                } />
                <Column title='名称' dataIndex='name' align='center' width={80} render={(_, row) => 
                    <AutoComplete size='small' style={{width: '100%'}} value={row.name} onChange={value => updateRow(row.id, 'name', value)} />
                } />
                <Column title='规格' dataIndex='spec' align='center' width={60}  render={(_, row) => 
                    <AutoComplete size='small' style={{width: '100%'}} value={row.spec} onChange={value => updateRow(row.id, 'spec', value)} />
                } />
                <Column title='数量' dataIndex='quantity' align='center' width={60} render={(_, row) => 
                    <InputNumber keyboard={false} size='small' controls={false} style={{width: '100%'}} value={row.quantity} onChange={value => updateRow(row.id, 'quantity', value)} />
                } />
                <Column title='单位' dataIndex='unit' align='center' width={50} render={(_, row) => 
                    <Select size='small' options={unitOptions} align='center' style={{width: '100%'}} value={row.unit} onChange={value => updateRow(row.id, 'unit', value)} />
                } />
                <Column title='单价' dataIndex='price' align='center' width={70} render={(_, row) => 
                    <InputNumber keyboard={false} size='small' controls={false} style={{width: '100%'}} value={row.price} onChange={value => updateRow(row.id, 'price', value)} />
                } />
                <Column title='金额' dataIndex='originalAmount' align='center' width={80} render={originalAmount => 
                    originalAmount.toString()
                } />
                <Column title='折扣' dataIndex='discount' align='center' width={40} render={(_, row) => 
                    <InputNumber keyboard={false} size='small' min={0} max={100} controls={false} style={{width: '100%'}} value={row.discount} onChange={value => updateRow(row.id, 'discount', value)} />
                } />
                <Column title='折后价' dataIndex='amount' align='center' width={80} render={amount => 
                    amount.toString()
                } />
                <Column title='备注' dataIndex='remark' align='center' width={90} render={(_, row) => 
                    <Input size='small' style={{width: '100%'}} value={row.remark} onChange={e => updateRow(row.id, 'remark', e.target.value)} />
                } />
            </Table>
            <br/>
            总计：{editOrder.amount.toString()}
        </Modal>
    </>)
}

export default SalesOrderFB