import React, { useState, useEffect } from 'react'
import Axios from 'axios'
import Decimal from 'decimal.js'
import { Table, Button, DatePicker, Col, Row, InputNumber, Input, Divider, Space, Modal, Popover } from 'antd'
import { ExclamationCircleOutlined, EditOutlined, SaveOutlined, DeleteOutlined, CloseOutlined, InboxOutlined } from '@ant-design/icons'


import { calItemAmount, calTotalAmount, dcInvoice, emptyInvoice } from '../../utils/invoiceUtils'
import { baseURL, DATE_FORMAT, invoiceSettings } from '../../utils/config'
import { DeliveredInput } from '../common/PromptInput'
import PurchaseRefundItemSelectView from './PurchaseRefundItemSelectView'
import '../common/Invoice.css'

/*
    Required: dismiss, refresh, messageApi
    Optional: refund, saveDraft, removeDraft
*/
export default function PurchaseRefundEditView(props) {
    const [refund, setRefund] = useState(emptyInvoice(0))
    const [isSelectionModalOpen, setSelectionModalOpen] = useState(false)
    
    const initRefund = () => {
        setRefund(props.refund ? dcInvoice(props.refund) : emptyInvoice(0))
    }
    const updateRow = (idx, field, value) => {
        const newRefund = dcInvoice(refund)
        newRefund.items[idx][field] = value
        if ('quantity' === field) {
            const { originalAmount, amount } = calItemAmount(newRefund.items[idx])
            newRefund.items[idx].originalAmount = originalAmount
            newRefund.items[idx].amount = amount
            newRefund.amount = calTotalAmount(newRefund.items)
        }
        setRefund(newRefund)
    }
    const updateRefund= (field, value) => {
        const newRefund = dcInvoice(refund)
        newRefund[field] = value
        setRefund(newRefund)
    }
    const getTableColumns = () => {
        const ifShowMaterial = invoiceSettings.get('ifShowMaterial') === 'true'
        const ifShowDiscount = invoiceSettings.get('ifShowDiscount') === 'true'
        const getQuantityStatus = (quantity, maxQuantity) => {
            return maxQuantity == null ? 'error' : (Decimal(quantity||0).gt(maxQuantity) ? 'warning' : '')
        }
        return [
            { title: '', align: 'center', width: 30, fixed: 'left', render: (_, __, idx) => idx + 1 },
            ifShowMaterial ? { title: '材质', dataIndex: 'material', align: 'center', width: 50 } : null,
            { title: '名称', dataIndex: 'name', align: 'center', width: 150 },
            { title: '规格', dataIndex: 'spec', align: 'center', width: 70 },
            { title: <span>数量 <Popover content={<>黄色：数量超过采购单上限。<br/>红色：产品已从采购单中移除。</>}><a style={{color: 'gray'}}><ExclamationCircleOutlined/></a></Popover></span>, 
                dataIndex: 'quantity', align: 'center', width: 70, render: (_, record, idx) => 
                <InputNumber min={0} stringMode keyboard={false} size='small' controls={false} style={{width: '100%'}} 
                    value={record.quantity} onChange={value => updateRow(idx, 'quantity', value)}
                    placeholder={record.maxQuantity} status={getQuantityStatus(record.quantity, record.maxQuantity)} />
            },
            { title: '单位', dataIndex: 'unit', align: 'center', width: 50 },
            { title: '单价', dataIndex: 'price', align: 'center', width: 70, render: p => p.toLocaleString() },
            ifShowDiscount ? { title: '金额', dataIndex: 'originalAmount', align: 'center', width: 80, render: a => parseFloat(a).toLocaleString() } : null,
            ifShowDiscount ? { title: '折扣', dataIndex: 'discount', align: 'center', width: 50, render: d => `${d}%`} : null,
            { title: ifShowDiscount ? '折后价' : '金额', dataIndex: 'amount', align: 'center', width: 80, render: a => parseFloat(a).toLocaleString() },
            { title: '预估重量', align: 'center', width: 80, render: (_, record) => 
                Decimal(record.unitWeight || 0).times(record.quantity || 0).toLocaleString()
            },
            { title: '备注', dataIndex: 'remark', align: 'center', width: 100, render: (_, record, idx) => 
                <Input size='small' style={{ width: '100%' }} value={record.remark} onChange={e => updateRow(idx, 'remark', e.target.value)} />
            },
            { title: '配送', dataIndex: 'delivered', align: 'center', width: 60, fixed: 'right', render: (_, record, idx) => 
                <DeliveredInput size='small' align='center' style={{ width: '100%' }} value={record.delivered} 
                    onChange={value => updateRow(idx, 'delivered', value)} />
            },
            { title: '', align: 'center', width: 30, fixed: 'right', render: (_, __, idx) => 
                <Button type='link' size='small' danger onClick={_ => {
                    const newRefund = dcInvoice(refund)
                    newRefund.items.splice(idx, 1)
                    newRefund.amount = calTotalAmount(newRefund.items)
                    if (newRefund.items.length === 0) newRefund.partner = ''
                    setRefund(newRefund)
                }}><DeleteOutlined /></Button>
            }
        ].filter(i => i != null)
    }
    const upload = () => {
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
            url: newRefund.id ? `purchaseRefund/id/${newRefund.id}` : 'purchaseRefund',
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

    useEffect(initRefund, [props.refund])

    return <>
        <Space direction='vertical' style={{ width: '100%', marginTop: '10px', marginBottom: '15px' }}>
            <Row style={{ justifyContent: 'space-between' }} align='middle'>
                <Col style={{ width: '30%' }}>供应商：
                    { refund.partner ? refund.partner : <span style={{color: 'gray'}}>(选择产品后自动显示)</span> }
                </Col>
                <Col style={{ width: '30%' }} align={'center'}>日期：
                    <DatePicker size='small' style={{ width: 150 }} value={refund.date} onChange={value => updateRefund('date', value)} />
                </Col>
                <Col style={{ width: '30%' }} align='right'>
                    <Button type='primary' onClick={_ => setSelectionModalOpen(true)}>选择采购单及产品</Button>
                </Col>
            </Row>
            <Row style={{ justifyContent: 'space-between' }} align='middle'>
                <Col style={{ width: '30%' }}>总金额：{parseFloat(refund.amount).toLocaleString()}</Col>
                <Col style={{ width: '30%' }} align='right'>付款：
                    <InputNumber size='small' keyboard={false} stringMode controls={false} style={{ width: 120 }}
                        placeholder={`应付 ${Decimal(refund.amount).minus(refund.prepayment || 0)}`}
                        value={refund.payment} onChange={value => updateRefund('payment', value)} />
                    <Button size='small' style={{ marginLeft: '5px' }} icon={<EditOutlined />}
                        onClick={_ => updateRefund('payment', Decimal(refund.amount).minus(refund.prepayment || 0).toString())} />
                </Col>
            </Row>
        </Space>
        <Table className='editTable' dataSource={refund.items} size='small' bordered pagination={false}
            rowKey={r => r.productId} style={{height: 400}} scroll={{x: 'max-content', y: 400 }} columns={getTableColumns()} />
    
        <Divider />
        <Col align='end'>
            <Space>
                <Button icon={<SaveOutlined/>} type='primary' onClick={upload} disabled={refund.partner === ''}>保存</Button>
                { refund.id ? null : <Button icon={<InboxOutlined/>} onClick={_ => props.saveDraft(refund)}>保存草稿</Button> }
                <Button icon={<CloseOutlined/>} onClick={_ => { initRefund(); props.dismiss() }}>取消</Button>
            </Space>
        </Col>

        <Modal title='选择采购单及产品' open={isSelectionModalOpen} width={1000} center onCancel={_ => setSelectionModalOpen(false)} footer={null} destroyOnClose>
            <PurchaseRefundItemSelectView editRefund={refund} setEditRefund={setRefund} dismiss={_ => setSelectionModalOpen(false)} />
        </Modal>
    </>
}