import React from 'react'
import Axios from 'axios'
import Decimal from 'decimal.js'
import { Form, Input, Table, Button, InputNumber, Select, Row, DatePicker } from 'antd'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'


const { Item } = Form


import { PartnerInput, PriceInput, ProductInput } from './PromptInput'
import { invoiceSettings, baseURL } from '../../utils/config'
import { isOrderItemEmpty, emptyInvoiceItem, calItemAmount, calTotalAmount } from '../../utils/invoiceUtils'
import './Invoice.css'



export default function OrderEditView() {
    const form = Form.useFormInstance()

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
                            return (
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
                            return (
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
                            return (
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
                title: '数量', dataIndex: 'quantity', align: 'center', width: 70, 
                render: (_, field, idx) => (
                    <Item shouldUpdate>
                        {({ getFieldValue, setFieldValue }) => {
                            const record = (getFieldValue('items') || [])?.[idx] || {}
                            return (
                                <InputNumber min={0} stringMode keyboard={false} size='small' controls={false} style={{ width: '100%' }} 
                                value={record.quantity} 
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
                            if (!record.productExisting) {
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
                            return <PriceInput partner={getFieldValue('partner')}
                                material={record.material} name={record.name} spec={record.spec}
                                min={0} stringMode keyboard={false} size='small' controls={false} style={{ width: '100%' }} 
                                value={record.price} 
                                onChange={value => {
                                    setFieldValue(['items', idx, 'price'], value)
                                    updateTableRows()
                                    updateItemAmount(idx)
                                }} />
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
                            return (
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
            <Row style={{ justifyContent: 'space-between', marginTop: '15px' }}>
                <Item label='客户' name='partner' style={{ margin: 0 }}>
                    <PartnerInput style={{ width: 160 }} size='small' />
                </Item>
                <Item label='日期' name='date' style={{ margin: 0 }}>
                    <DatePicker style={{ width: 150 }} size='small' />
                </Item>
            </Row>
            <Row style={{ justifyContent: 'space-between', marginBottom: '10px' }}>
                <Item label='总金额' shouldUpdate style={{ margin: 0 }}>
                    { ({ getFieldValue }) => {
                        return <div style={{ width: 150 }}>
                            {parseFloat(getFieldValue('amount')).toLocaleString()}
                        </div>
                    } }
                </Item>
                <Item label='订金' name='prepayment' style={{ margin: 0 }}>
                    <InputNumber style={{ width: 150 }} size='small' keyboard={false} stringMode controls={false} />
                </Item>
                <Item label='尾款' shouldUpdate style={{ margin: 0 }}>
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
        </>
    )
}