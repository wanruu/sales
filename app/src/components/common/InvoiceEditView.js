import React, { useState } from 'react'
import Axios from 'axios'
import Decimal from 'decimal.js'
import { Form, Input, Table, Button, InputNumber, Select, Row, DatePicker, Popover, Modal } from 'antd'
import { DeleteOutlined, EditOutlined, ExclamationCircleOutlined, PlusOutlined } from '@ant-design/icons'


const { Item } = Form


import { PartnerInput, PriceInput, ProductInput } from './PromptInput'
import { invoiceSettings, baseURL } from '../../utils/config'
import { isOrderItemEmpty, emptyInvoiceItem, calItemAmount, calTotalAmount, dcInvoice } from '../../utils/invoiceUtils'
import './Invoice.css'
import SalesRefundItemSelectView from '../salesRefundComponents/SalesRefundItemSelectView'
import PurchaseRefundItemSelectView from '../purchaseRefundComponents/PurchaseRefundItemSelectView'


/*
    Required: type
*/
export default function InvoiceEditView(props) {
    const form = Form.useFormInstance()
    const [isSelectionModalOpen, setSelectionModalOpen] = useState(false)

    const isRefund = props.type === 'salesRefund' || props.type === 'purchaseRefund'
    const isSales = props.type === 'salesRefund' || props.type === 'salesOrder'

    const getTableColumns = (add, remove) => {
        const ifShowDiscount = invoiceSettings.get('ifShowDiscount') === 'true'
        const ifShowMaterial = invoiceSettings.get('ifShowMaterial') === 'true'
        const ifShowDelivered = invoiceSettings.get('ifShowDelivered') === 'true'
        return [
            { 
                title: '', align: 'center', width: 30, fixed: 'left', 
                render: (_, __, idx) => idx + 1 
            },
            ifShowMaterial ? { 
                title: '材质', dataIndex: 'material', align: 'center', width: 50,
                render: (_, field, idx) => (
                    <Item shouldUpdate>
                        {({ getFieldValue, setFieldValue }) => {
                            const record = (getFieldValue('items') || [])?.[idx] || {}
                            return isRefund ? record.material : (
                                <ProductInput field='material' size='small' style={{ width: '100%' }}
                                value={record.material}
                                onChange={value => { 
                                    setFieldValue(['items', idx, 'material'], value)
                                    updateUnit(idx)
                                    updateTableRows()
                                }} />
                            )
                        }}
                    </Item>
                )
            } : null,
            { 
                title: '名称', dataIndex: 'name', align: 'center', width: 100, 
                render: (_, field, idx) => (
                    <Item shouldUpdate>
                        {({ getFieldValue, setFieldValue }) => {
                            const record = (getFieldValue('items') || [])?.[idx] || {}
                            return isRefund ? record.name : (
                                <ProductInput field='name' size='small' style={{ width: '100%' }} 
                                value={record.name} 
                                onChange={value => {
                                    setFieldValue(['items', idx, 'name'], value)
                                    updateUnit(idx)
                                    updateTableRows()
                                }} />
                            )
                        }}
                    </Item>
                )
            },
            { 
                title: '规格', dataIndex: 'spec', align: 'center', width: 60, 
                render: (_, field, idx) => (
                    <Item shouldUpdate>
                        {({ getFieldValue, setFieldValue }) => {
                            const record = (getFieldValue('items') || [])?.[idx] || {}
                            return isRefund ? record.spec : (
                                <ProductInput field='spec' size='small' style={{ width: '100%' }} 
                                value={record.spec} 
                                onChange={value => {
                                    setFieldValue(['items', idx, 'spec'], value)
                                    updateUnit(idx)
                                    updateTableRows()
                                }} />
                            )
                        }}
                    </Item>
                )
            },
            { 
                title: (
                    isRefund ? 
                    <span>数量 
                        <Popover content={<>黄色：数量超过采购单上限。<br/>红色：产品已从采购单中移除。</>}>
                            <ExclamationCircleOutlined style={{ color: 'gray', marginLeft: '2px'  }}/>
                        </Popover>
                    </span> : '数量'
                ), 
                dataIndex: 'quantity', align: 'center', width: 70, 
                render: (_, field, idx) => (
                    <Item shouldUpdate>
                        {({ getFieldValue, setFieldValue }) => {
                            const record = (getFieldValue('items') || [])?.[idx] || {}
                            return (
                                <InputNumber min={0} stringMode keyboard={false} size='small' controls={false} style={{ width: '100%' }} 
                                value={record.quantity} 
                                placeholder={record.maxQuantity}
                                status={
                                    record.maxQuantity == null ? 'error' : (
                                        record.maxQuantity != undefined && Decimal(record.quantity||0).gt(record.maxQuantity) ? 'warning' : ''
                                    )
                                }
                                onChange={value => {
                                    setFieldValue(['items', idx, 'quantity'], value)
                                    updateTableRows()
                                    updateItemAmount(idx)
                                }} />
                            )
                        }}
                    </Item>
                )
            },
            { 
                title: '单位', dataIndex: 'unit', align: 'center', width: 50, 
                render: (_, field, idx) => (
                    <Item shouldUpdate>
                        {({ getFieldValue, setFieldValue }) => {
                            const record = (getFieldValue('items') || [])?.[idx] || {}
                            if (!record.productExisting && !isRefund) {
                                return (
                                    <Select size='small'
                                    options={JSON.parse(invoiceSettings.get('unitOptions')).filter(unit => unit.showing)} 
                                    align='center' style={{ width: '100%' }}
                                    value={record.unit} 
                                    onChange={value => setFieldValue(['items', idx, 'unit'], value)} />
                                )
                            }
                            return record.unit
                        }}
                    </Item>
                )
            },
            { 
                title: '单价', dataIndex: 'price', align: 'center', width: 70, 
                render: (_, field, idx) => (
                    <Item shouldUpdate>
                        {({ getFieldValue, setFieldValue }) => {
                            const record = (getFieldValue('items') || [])?.[idx] || {}
                            return isRefund ? record.price : (
                                <PriceInput partner={getFieldValue('partner')}
                                material={record.material} name={record.name} spec={record.spec}
                                min={0} stringMode keyboard={false} size='small' controls={false} style={{ width: '100%' }} 
                                value={record.price} 
                                onChange={value => {
                                    setFieldValue(['items', idx, 'price'], value)
                                    updateTableRows()
                                    updateItemAmount(idx)
                                }} />
                            )
                        }}
                    </Item>
                ) 
            },
            ifShowDiscount ? 
            { 
                title: '金额', dataIndex: 'originalAmount', align: 'center', width: 80, 
                render: (_, field, idx) => (
                    <Item shouldUpdate>
                        {({ getFieldValue, setFieldValue }) => {
                            const record = (getFieldValue('items') || [])?.[idx] || {}
                            return parseFloat(record.originalAmount).toLocaleString()
                        }}
                    </Item>
                )
            } : null,
            ifShowDiscount ? 
            { 
                title: '折扣', dataIndex: 'discount', align: 'center', width: 60, 
                render: (_, field, idx) => (
                    <Item shouldUpdate>
                        {({ getFieldValue, setFieldValue }) => {
                            const record = (getFieldValue('items') || [])?.[idx] || {}
                            return isRefund ? `${record.discount}%` : (
                                <InputNumber keyboard={false} size='small' 
                                min={0} max={100} controls={false} style={{ width: '100%' }} 
                                formatter={(value) => `${value}%`} parser={(value) => value.replace('%', '')}
                                value={record.discount} 
                                onChange={value => {
                                    setFieldValue(['items', idx, 'discount'], value)
                                    updateTableRows()
                                    updateItemAmount(idx)
                                }} />
                            )
                        }}
                    </Item>
                )
            } : null,
            { 
                title: ifShowDiscount ? '折后价' : '金额', dataIndex: 'amount', align: 'center', width: 80, 
                render: (_, field, idx) => (
                    <Item shouldUpdate>
                        {({ getFieldValue, setFieldValue }) => {
                            const record = (getFieldValue('items') || [])?.[idx] || {}
                            return parseFloat(record.amount).toLocaleString()
                        }}
                    </Item>
                )
            },
            { 
                title: '备注', dataIndex: 'remark', align: 'center', width: 100, 
                render: (_, field, idx) => (
                    <Item shouldUpdate>
                        {({ getFieldValue, setFieldValue }) => {
                            const record = (getFieldValue('items') || [])?.[idx] || {}
                            return <Input size='small' style={{ width: '100%' }} 
                                value={record.remark} 
                                onChange={e => {
                                    setFieldValue(['items', idx, 'remark'], e.target.value)
                                    updateTableRows()
                                }} />
                        }}
                    </Item>
                )
            },
            ifShowDelivered ? 
            { 
                title: '配送', dataIndex: 'delivered', align: 'center', width: 60, fixed: 'right', 
                render: (_, field, idx) => (
                    <Item shouldUpdate>
                        {({ getFieldValue, setFieldValue }) => {
                            const record = (getFieldValue('items') || [])?.[idx] || {}
                            return <Select size='small' style={{ width: '100%' }}
                                options={[{ label: '未配送', value: false }, { label: '已配送', value: true }]} 
                                value={record.delivered}
                                align='center'
                                onChange={value => setFieldValue(['items', idx, 'delivered'], value)}
                            />
                        }}
                    </Item>
                )
            } : null,
            { 
                title: '', align: 'center', width: 30, fixed: 'right', 
                render: (_, field, idx) => (
                    <Button type='link' size='small' danger onClick={_ => {
                        remove(idx)
                        updateTotalAmount()
                        updateTableRows()
                    }}>
                        <DeleteOutlined />
                    </Button>
                )
            }
        ].filter(i => i != null)
    }

    const updateUnit = (index) => {
        if (isRefund) {
            return
        }
        const item = (form.getFieldValue('items') || [])?.[index] || {}
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: `product/unit`,
            params: { material: item.material, name: item.name, spec: item.spec },
            'Content-Type': 'application/json',
        }).then(res => {
            if (res.data.unit) {
                form.setFieldValue(['items', index, 'unit'], res.data.unit)
                form.setFieldValue(['items', index, 'productExisting'], true)
            } else {
                form.setFieldValue(['items', index, 'productExisting'], false)
            }
        }).catch(err => {
            console.error(err)
        })
    }

    const updateTableRows = () => {
        if (isRefund) {
            return
        }
        const items = form.getFieldValue('items') || []
        const newItems = [...items]
        if (items.length === 0 || !isOrderItemEmpty(items.at(-1))) {
            newItems.push(emptyInvoiceItem())
            form.setFieldValue('items', newItems)
        } else if (items.length >= 2 && isOrderItemEmpty(items.at(-2))) {
            newItems.pop()
            form.setFieldValue('items', newItems)
        }
    }

    const updateItemAmount = (index) => {
        const record = (form.getFieldValue('items') || [])?.[index] || {}
        const { originalAmount, amount } = calItemAmount(record)
        form.setFieldValue(['items', index, 'originalAmount'], originalAmount)
        form.setFieldValue(['items', index, 'amount'], amount)
        updateTotalAmount()
    }

    const updateTotalAmount = () => {
        const records = form.getFieldValue('items') || []
        form.setFieldValue('amount', calTotalAmount(records))
    }

    return (
        <>
            <Row style={{ justifyContent: 'space-between', marginTop: '15px', marginBottom: '5px' }}>
                {
                    isRefund ? (
                        <Item label={isSales ? '客户' : '供应商'} style={{ margin: 0 }}>
                            { form.getFieldValue('partner') || <span style={{ color: 'gray' }}>(选择产品后自动显示)</span> }
                        </Item>
                    ) : (
                        <Item label={isSales ? '客户' : '供应商'} name='partner' style={{ margin: 0 }}>
                            <PartnerInput style={{ width: 160 }} size='small' />
                        </Item>
                    )
                }
                <Item label='日期' name='date' style={{ margin: 0 }}>
                    <DatePicker style={{ width: 150 }} size='small' />
                </Item>
                {
                    isRefund ? 
                        <Button icon={<PlusOutlined />} type='primary' ghost onClick={_ => setSelectionModalOpen(true)}>选择退货产品</Button> : null
                }
            </Row>
            <Row style={{ justifyContent: 'space-between', marginBottom: '10px' }}>
                <Item label='总金额' shouldUpdate style={{ margin: 0 }}>
                    { ({ getFieldValue }) => {
                        return <div style={{ width: 150 }}>
                            { parseFloat(getFieldValue('amount')).toLocaleString() }
                        </div>
                    } }
                </Item>
                {
                    isRefund ? null :
                    <Item label='订金' name='prepayment' style={{ margin: 0 }}>
                        <InputNumber style={{ width: 150 }} size='small' keyboard={false} stringMode controls={false} />
                    </Item>
                }
                
                <Item label={isRefund ? '付款' : '尾款'} shouldUpdate style={{ margin: 0 }}>
                    { ({ getFieldValue, setFieldValue }) => {
                        const p = Decimal(getFieldValue('amount') || 0).minus(getFieldValue('prepayment') || 0)
                        return (
                            <>
                                <InputNumber size='small' keyboard={false} stringMode controls={false} style={{ width: 120 }}
                                    placeholder={`应付 ${p.toNumber().toLocaleString()}`} 
                                    value={getFieldValue('payment')} 
                                    onChange={val => setFieldValue('payment', val)}/>
                                <Button size='small' style={{ marginLeft: '5px' }} icon={<EditOutlined />}
                                    onClick={_ => setFieldValue('payment', p.toString())} 
                                />
                            </>
                        )
                    }}
                </Item>
            </Row>
            <Form.List name="items">
                {(fields, { add, remove }) => (
                    <Table className='editTable' size='small' bordered style={{ height: 400 }}
                        dataSource={fields} columns={getTableColumns(add, remove)}
                        scroll={{x: 'max-content', y: 400 }} pagination={false}
                        rowKey={field => field.key}
                    />
                )}
            </Form.List>
            <Modal title='选择退货产品' open={isSelectionModalOpen} width={1000} center onCancel={_ => setSelectionModalOpen(false)} footer={null} destroyOnClose>
                {
                    props.type === 'salesRefund' ? 
                    <SalesRefundItemSelectView
                    editRefund={form.getFieldsValue(true)} 
                    setEditRefund={r => form.setFieldsValue(dcInvoice(r))}
                    dismiss={_ => setSelectionModalOpen(false)} /> : null
                }
                {
                    props.type === 'purchaseRefund' ?
                    <PurchaseRefundItemSelectView
                    editRefund={form.getFieldsValue(true)} 
                    setEditRefund={r => form.setFieldsValue(dcInvoice(r))}
                    dismiss={_ => setSelectionModalOpen(false)} /> : null
                }
            </Modal>
        </>
    )
}