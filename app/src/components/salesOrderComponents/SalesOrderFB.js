import React, { useEffect, useState, } from "react";
import { Table, Modal, Button, message, Input, DatePicker, Col, InputNumber, 
    Row, FloatButton, Space, Popover, Divider 
} from "antd";
import { PlusOutlined, InboxOutlined, } from '@ant-design/icons'
import { Decimal } from 'decimal.js';
import dayjs from 'dayjs'
import Axios from "axios";

const { Column } = Table

import { dcInvoice, calItemAmount, calTotalAmount, emptyInvoice, emptyInvoiceItem } from "../../utils/invoiceUtils";
import { isSalesOrderItemEmpty, isSalesOrderItemComplete } from '../../utils/salesOrderUtils'
import { PartnerInput, ProductInput, UnitInput } from "../common/PromptInput";
import { baseURL, dateFormat } from "../../utils/config";
import "../common/InvoiceEdit.css"


function SalesOrderFB(props) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editOrder, setEditOrder] = useState(emptyInvoice(1))
    const [draftOrders, setDraftOrders] = useState([])
    const [isUploading, setIsUploading] = useState(false)
    const [messageApi, contextHolder] = message.useMessage();


    useEffect(() => {
        const newEditOrder = dcInvoice(editOrder)
        if (!isSalesOrderItemEmpty(editOrder.items.at(-1))) {
            newEditOrder.items.push(emptyInvoiceItem())
            setEditOrder(newEditOrder)
        } else if (editOrder.items.length >= 2 && isSalesOrderItemEmpty(editOrder.items.at(-2))) {
            newEditOrder.items.pop()
            setEditOrder(newEditOrder)
        }
    }, [editOrder])

    // modal show/hide
    const showModal = () => {
        setIsModalOpen(true)
    }
    const hideModal = () => {
        setIsModalOpen(false)
    }

    // user editing
    const updatePartner = (value) => {
        const newOrder = dcInvoice(editOrder)
        newOrder.partner = value
        setEditOrder(newOrder)
    }
    const updateDate = (value) => {
        const newOrder = dcInvoice(editOrder)
        newOrder.date = value
        setEditOrder(newOrder)
    }
    const updatePrepayment = (value) => {
        const newOrder = dcInvoice(editOrder)
        newOrder.prepayment = value
        setEditOrder(newOrder)
    }
    const updateRow = (id, field, value) => {
        const ifUpdateAmount = ['quantity', 'unit', 'price', 'discount'].includes(field)
        const newEditOrder = dcInvoice(editOrder)
        newEditOrder.items = newEditOrder.items.map(item => {
            if (item.id === id) { item[field] = value }
            if (ifUpdateAmount) {
                const { originalAmount, amount } = calItemAmount(item)
                item.originalAmount = originalAmount
                item.amount = amount
            }
            return item
        })
        if (ifUpdateAmount) {
            newEditOrder.amount = calTotalAmount(newEditOrder.items)
        }
        setEditOrder(newEditOrder)
    }

    // draft
    const saveDraft = () => {
        const isOldDraft = editOrder.draftTime !== undefined
        const newOrder = dcInvoice(editOrder)
        newOrder.draftTime = dayjs()
        var newDraftOrders = draftOrders
        if (isOldDraft) {
            newDraftOrders = newDraftOrders.filter(order => order.draftTime !== editOrder.draftTime)
        }
        newDraftOrders.unshift(newOrder)
        setDraftOrders(newDraftOrders)
        setEditOrder(emptyInvoice(1))
        hideModal()
    }
    const removeDraft = (draft) => {
        setDraftOrders(draftOrders.filter(d => d.draftTime !== draft.draftTime))
    }
    const openDraft = (draft) => {
        setEditOrder(draft)
        setIsModalOpen(true)
    }

    // upload order
    const upload = () => {
        setIsUploading(true)
        // clean data
        const order = dcInvoice(editOrder);
        order.date = order.date.format(dateFormat);
        order.items = order.items.filter(item => !isSalesOrderItemEmpty(item)).map(item => {
            item.quantity = (item.quantity || Decimal(0)).toString()
            item.price = (item.quantity || Decimal(0)).toString()
            return item
        });
        order.prepayment = order.prepayment || '0'
        order.payment = order.payment || '0'
        const nIncomplete = order.items.filter(item => !isSalesOrderItemComplete(item)).length;
        var isRepeat = false;
        for (const item1 of order.items) {
            for (const item2 of order.items) {
                if (item1.id !== item2.id && item1.name === item2.name && item1.spec === item2.spec && item1.material === item2.material) {
                    isRepeat = true;
                    break;
                }
            }
            if (isRepeat) {
                break;
            }
        }
        // check data
        if (order.partner === '') {
            messageApi.open({ type: 'error', content: '收货单位不得为空', });
            setIsUploading(false)
        } else if (nIncomplete > 0) {
            messageApi.open({ type: 'error', content: '表格填写不完整', });
            setIsUploading(false)
        } else if (isRepeat) {
            messageApi.open({ type: 'error', content: '产品材质、名称、规格不得重复', });
            setIsUploading(false)
        } else {
            Axios({
                method: 'post',
                baseURL: baseURL(),
                url: 'salesOrder',
                data: order,
                'Content-Type': 'application/json',
            }).then(res => {
                messageApi.open({ type: 'success', content: '保存成功', });
                setEditOrder(emptyInvoice(1))
                hideModal()
                removeDraft(order)
                if (props.refresh !== undefined) {
                    props.refresh()
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
        <Popover title={`草稿箱 (${draftOrders.length})`} placement="topLeft" zIndex={999} trigger='click' content={
            <Table className='draftTable' dataSource={draftOrders} size='small' pagination={{pageSize: 5, size: 'small'}} hideOnSinglePage bordered>
                <Column title='保存时间' dataIndex='draftTime' align='center' render={time => time.format('HH:mm:ss')} />
                <Column title='客户' dataIndex='partner' align='center' />
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
        <Modal title='新建销售清单' open={isModalOpen} width={1000} centered onCancel={hideModal} footer={
            <Space>
                <Button onClick={saveDraft}>保存草稿</Button>
                <Button onClick={upload} type='primary' loading={isUploading}>保存</Button>
            </Space>
        }>
            <Row style={{ marginTop: '20px', marginBottom: '15px' }}>
                <Col span={12}>客户：<PartnerInput style={{width: 200}} size='small' value={editOrder.partner} onChange={value => updatePartner(value)} /></Col>
                <Col span={12} align='right'>日期：<DatePicker size='small' value={editOrder.date} onChange={value => updateDate(value)}/></Col>
            </Row>

            <Table className='editTable' dataSource={editOrder.items} size='small' bordered style={{height: 400}} 
            scroll={{x: 'max-content', y: 400 }} pagination={false} rowKey={record => record.id}>
                <Column align='center' width={30} render={(_, __, idx) => idx+1} />
                <Column title='材质' dataIndex='material' align='center' width={45} render={(_, row) => 
                    <ProductInput field='material' size='small' style={{width: '100%'}} value={row.material} onChange={value => updateRow(row.id, 'material', value)} />
                } />
                <Column title='名称' dataIndex='name' align='center' width={80} render={(_, row) => 
                    <ProductInput field='name' size='small' style={{width: '100%'}} value={row.name} onChange={value => updateRow(row.id, 'name', value)} />
                } />
                <Column title='规格' dataIndex='spec' align='center' width={60}  render={(_, row) => 
                    <ProductInput field='spec' size='small' style={{width: '100%'}} value={row.spec} onChange={value => updateRow(row.id, 'spec', value)} />
                } />
                <Column title='数量' dataIndex='quantity' align='center' width={60} render={(_, row) => 
                    <InputNumber min={0} stringMode keyboard={false} size='small' controls={false} style={{width: '100%'}} value={row.quantity} onChange={value => updateRow(row.id, 'quantity', value)} />
                } />
                <Column title='单位' dataIndex='unit' align='center' width={50} render={(_, row) => 
                    <UnitInput size='small' align='center' style={{width: '100%'}} value={row.unit} 
                    onChange={value => updateRow(row.id, 'unit', value)} material={row.material} name={row.name} spec={row.spec} />
                } />
                <Column title='单价' dataIndex='price' align='center' width={70} render={(_, row) => 
                    <InputNumber min={0} stringMode keyboard={false} size='small' controls={false} 
                    style={{width: '100%'}} value={row.price} onChange={value => updateRow(row.id, 'price', value)} />
                } />
                <Column title='金额' dataIndex='originalAmount' align='center' width={80} render={originalAmount => 
                    originalAmount.toString()
                } />
                <Column title='折扣' dataIndex='discount' align='center' width={50} render={(_, row) => 
                    <InputNumber keyboard={false} size='small' min={0} max={100} controls={false} style={{width: '100%'}} 
                        value={row.discount} onChange={value => updateRow(row.id, 'discount', value)}
                        formatter={(value) => `${value}%`}
                        parser={(value) => value.replace('%', '')}
                    />
                } />
                <Column title='折后价' dataIndex='amount' align='center' width={80} render={amount => 
                    amount.toString()
                } />
                <Column title='备注' dataIndex='remark' align='center' width={90} render={(_, row) => 
                    <Input size='small' style={{width: '100%'}} value={row.remark} onChange={e => updateRow(row.id, 'remark', e.target.value)} />
                } />
            </Table>
            <Divider />
            <Row>
                <Col span={12}>总计：{editOrder.amount.toString()}</Col>
                <Col span={12}>
                    预付款：<InputNumber size='small' keyboard={false} stringMode controls={false} style={{width: '90%', maxWidth: '150px'}} 
                        value={editOrder.prepayment} onChange={value => updatePrepayment(value)}
                    />
                </Col>
            </Row>
        </Modal>
    </>)
}

export default SalesOrderFB