import React, { useState } from 'react'
import Axios from 'axios'
import Decimal from 'decimal.js'
import { Form, Input, Table, Button, InputNumber, Select, Row, DatePicker, Popover, Modal, Collapse, Space } from 'antd'
import { DeleteOutlined, EditOutlined, ExclamationCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { evaluate } from 'mathjs'

const { Item } = Form


import { PartnerInput, PriceInput, ProductInput } from '../common/PromptInput'
import { invoiceSettings, baseURL, DATE_FORMAT } from '../../utils/config'
import { isOrderItemEmpty, emptyInvoiceItem, calItemAmount, calTotalAmount, dcInvoice } from '../../utils/invoiceUtils'
import RefundSelectionView from './RefundSelectionView'
import './invoiceEditView.css'

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
        const allowEditAmount = invoiceSettings.get('allowEditAmount') === 'true'
        const ifShowRemarkCalculator = invoiceSettings.get('ifShowRemarkCalculator') === 'true'
        return [
            { 
                title: '', align: 'center', width: 30, fixed: 'left', 
                render: (_, __, idx) => idx + 1 
            },
            ifShowMaterial ? { 
                title: '材质', dataIndex: 'material', align: 'center', width: 60,
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
                title: '名称', dataIndex: 'name', align: 'center', width: 140, 
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
                title: '规格', dataIndex: 'spec', align: 'center', width: 120, 
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
                dataIndex: 'quantity', align: 'center', width: 80, 
                render: (_, field, idx) => (
                    <Item shouldUpdate>
                        {({ getFieldValue, setFieldValue }) => {
                            const record = (getFieldValue('items') || [])?.[idx] || {}
                            return (
                                <InputNumber min={0} stringMode keyboard={false} size='small' controls={false} style={{ width: '100%' }} 
                                value={record.quantity} 
                                placeholder={record.maxQuantity}
                                status={
                                    isRefund ? (
                                        record.maxQuantity == null ? 'error' : (
                                            Decimal(record.quantity || 0).gt(record.maxQuantity) ? 'warning' : ''
                                        )
                                    ) : ''
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
                title: '单价', dataIndex: 'price', align: 'center', width: 90, 
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
                            if (allowEditAmount) {
                                return (
                                    <InputNumber keyboard={false} size='small' controls={false} style={{ width: '100%' }} 
                                    value={record.originalAmount}
                                    onChange={value => {
                                        setFieldValue(['items', idx, 'originalAmount'], value)
                                        setFieldValue(['items', idx, 'amount'], Decimal(value || 0).times(record.discount).dividedBy(100).toString())
                                        updateTableRows()
                                        updateTotalAmount()
                                    }} />
                                )
                            }
                            return parseFloat(record.originalAmount).toLocaleString()
                        }}
                    </Item>
                )
            } : null,
            ifShowDiscount ? 
            { 
                title: '折扣', dataIndex: 'discount', align: 'center', width: 65, 
                render: (_, field, idx) => (
                    <Item shouldUpdate>
                        {({ getFieldValue, setFieldValue }) => {
                            const record = (getFieldValue('items') || [])?.[idx] || {}
                            return isRefund ? `${record.discount}%` : (
                                <InputNumber keyboard={false} size='small' 
                                min={0} max={100} controls={false} style={{ width: '100%' }} 
                                // formatter={(value) => `${value}%`} parser={(value) => value.replace('%', '')}
                                value={record.discount} 
                                onChange={value => {
                                    setFieldValue(['items', idx, 'discount'], value)
                                    updateTableRows()
                                    updateItemAmount(idx)
                                }}
                                addonAfter='%' />
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
                            if (allowEditAmount) {
                                return (
                                    <InputNumber keyboard={false} size='small' controls={false} style={{ width: '100%' }} 
                                    value={record.amount}
                                    onChange={value => {
                                        setFieldValue(['items', idx, 'amount'], value)
                                        updateTableRows()
                                        updateTotalAmount()
                                    }} />
                                )
                            }
                            return parseFloat(record.amount).toLocaleString()
                        }}
                    </Item>
                )
            },
            { 
                title: '备注', dataIndex: 'remark', align: 'center', width: 180, 
                render: (_, field, idx) => (
                    <Item shouldUpdate>
                        {({ getFieldValue, setFieldValue }) => {
                            const record = (getFieldValue('items') || [])?.[idx] || {}
                            return (<Space size={3}>
                                <Input size='small' 
                                    value={record.remark} 
                                    onChange={e => {
                                        setFieldValue(['items', idx, 'remark'], e.target.value)
                                        updateTableRows()
                                    }} />
                                { ifShowRemarkCalculator ?
                                    <Button size='small' style={{ paddingLeft: '4px', paddingRight: '4px' }}
                                    onClick={_ => {
                                        const quantity = calRemark(record.remark)
                                        if (quantity) {
                                            setFieldValue(['items', idx, 'quantity'], quantity)
                                        }
                                    }}> = </Button> :null
                                }
                            </Space>)
                        }}
                    </Item>
                )
            },
            ifShowDelivered ? 
            { 
                title: '配送', dataIndex: 'delivered', align: 'center', width: 60, 
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
                render: (_, field, idx) => {
                    return <Button type='link' size='small' danger onClick={_ => {
                        addToUnrefundedItems(idx)
                        remove(idx)
                        updateTotalAmount()
                        updateTableRows()
                    }}>
                        <DeleteOutlined />
                    </Button>
                }
            }
        ].filter(i => i != null)
    }

    const getUnrefundedTableColumns = (add, remove) => {
        const ifShowDiscount = invoiceSettings.get('ifShowDiscount') === 'true'
        const ifShowMaterial = invoiceSettings.get('ifShowMaterial') === 'true'
        return [
            { title: '', align: 'center', render: (_, __, idx) => idx + 1},
            ifShowMaterial ? { title: '材质', dataIndex: 'material', align: 'center', render: (_, field, idx) => (
                form.getFieldValue(['unrefundedItems', idx, 'material'])
            ) } : null,
            { title: '名称', dataIndex: 'name', align: 'center', render: (_, field, idx) => (
                form.getFieldValue(['unrefundedItems', idx, 'name'])
            )},
            { title: '规格', dataIndex: 'spec', align: 'center', render: (_, field, idx) => (
                form.getFieldValue(['unrefundedItems', idx, 'spec'])
            ) },
            { title: '数量', dataIndex: 'maxQuantity', align: 'center', render: (_, field, idx) => (
                form.getFieldValue(['unrefundedItems', idx, 'maxQuantity']).toLocaleString()
            ) },
            { title: '单位', dataIndex: 'unit', align: 'center', render: (_, field, idx) => (
                form.getFieldValue(['unrefundedItems', idx, 'unit'])
            ) },
            { title: '单价', dataIndex: 'price', align: 'center', render: (_, field, idx) => {
                const amountSign = invoiceSettings.get('ifShowAmountSign') === 'true' ? invoiceSettings.get('amountSign') : ''
                return amountSign + form.getFieldValue(['unrefundedItems', idx, 'price']).toLocaleString()
            } },
            ifShowDiscount ? { title: '折扣', dataIndex: 'discount', align: 'center', render: (_, field, idx) => (
                `${form.getFieldValue(['unrefundedItems', idx, 'discount'])}%`
            ) } : null,
            { title: '', width: 30, fixed: 'right', render: (_, field, idx) => {
                return <Button type='link' size='small' onClick={_ => {
                    const item = form.getFieldValue(['unrefundedItems', idx])
                    item.quantity = item.maxQuantity
                    const { originalAmount, amount } = calItemAmount(item)
                    item.originalAmount = originalAmount
                    item.amount = amount
                    const items = [...(form.getFieldValue('items') || []), item]
                    form.setFieldValue('items', items)
                    updateTotalAmount()
                    remove(idx)
                }}><PlusOutlined /></Button>
            }}
        ].filter(c => c != null)
    }

    const calRemark = (remark) => {
        try {
            const newRemark = remark.replace(/）/g, ')').replace(/（/g, '(')
            const equation = newRemark.match(/[0-9\+\-\*\/()\.]+/)[0]
            const quantity = parseFloat(evaluate(equation).toFixed(5))
            return quantity
        } catch (err) { }
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

    const addToUnrefundedItems = (index) => {
        if (isRefund) {
            const item = (form.getFieldValue('items') || [])?.[index] || {}
            if (item.maxQuantity != null) {
                item.quantity = item.maxQuantity
                const unrefundedItems = [...(form.getFieldValue('unrefundedItems') || []), item]
                form.setFieldValue('unrefundedItems', unrefundedItems)
            }
        }
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
                <Item label='日期' shouldUpdate style={{ margin: 0 }}>
                    { ({ getFieldValue, setFieldValue }) => {
                        return typeof(getFieldValue('date')) === 'object' ? 
                        <DatePicker style={{ width: 150 }} size='small' 
                        value={getFieldValue('date')}
                        onChange={val => setFieldValue('date', val)} /> : typeof(getFieldValue('date'))
                    } }
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
                    <Table className='editTable' size='small' bordered 
                        dataSource={fields} columns={getTableColumns(add, remove)}
                        style={isRefund ? {} : { height: 400 }} scroll={isRefund ? {} : {x: 'max-content', y: 400 }}
                        pagination={false}
                        rowKey={field => field.key}
                    />
                )}
            </Form.List>
            {
                isRefund ? 
                <>
                    <br />
                    <Form.List name="unrefundedItems">
                        {(fields, { add, remove }) => (
                            <Collapse defaultActiveKey={'1'}>
                                <Collapse.Panel header={`待退货产品 (${fields.length})`} key='1'>
                                    { fields.length > 0 ? 
                                        <Table size='small' bordered dataSource={fields} rowKey={r => r.key}
                                        pagination={false}
                                        columns={getUnrefundedTableColumns(add, remove)} /> : null
                                    }
                                </Collapse.Panel>
                            </Collapse>
                        )}
                    </Form.List>

                    <Modal title='选择退货' open={isSelectionModalOpen} width={1000} center 
                    onCancel={_ => setSelectionModalOpen(false)} footer={null} destroyOnClose>
                        {
                            props.type === 'salesRefund' ? 
                            <RefundSelectionView 
                            type='salesOrder'
                            refund={form.getFieldsValue(true)} 
                            setRefund={r => form.setFieldsValue(r)}
                            dismiss={_ => setSelectionModalOpen(false)} />
                            : null
                        }
                        {
                            props.type === 'purchaseRefund' ?
                            <RefundSelectionView 
                            type='purchaseOrder'
                            refund={form.getFieldsValue(true)} 
                            setRefund={r => form.setFieldsValue(r)}
                            dismiss={_ => setSelectionModalOpen(false)} /> 
                            : null
                        }
                    </Modal>
                </> : null
            }
        </>
    )
}