import React, { useEffect, useState, useRef } from 'react'
import Axios from 'axios'
import Decimal from 'decimal.js'
import { Table, Button, DatePicker, Col, Row, InputNumber, Input, Divider, Space } from 'antd'
import { FieldNumberOutlined, EditOutlined, PrinterOutlined, SaveOutlined, DeleteOutlined, 
    CloseOutlined, TableOutlined, RollbackOutlined
} from '@ant-design/icons'
import { useReactToPrint } from 'react-to-print'


import { baseURL, dateFormat } from '../../utils/config'
import { dcInvoice, calItemAmount, calTotalAmount, emptyInvoiceItem } from '../../utils/invoiceUtils'
import { isSalesOrderItemEmpty, isSalesOrderItemComplete } from '../../utils/salesOrderUtils'
import { PartnerInput, ProductInput, UnitInput, DeliveredInput } from '../common/PromptInput'
import { getExportData, exportExcel } from '../../utils/export'
import InvoicePreview from '../common/InvoicePreview'
import '../common/Invoice.css'


/*
    Required: id, refresh, messageApi
*/
export default function SalesOrderView(props) {
    const [order, setOrder] = useState(undefined)
    const [mode, setMode] = useState('view')

    const load = () => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: `salesOrder/id/${props.id}`,
            'Content-Type': 'application/json',
        }).then(res => {
            const newOrder = res.data
            newOrder.paid = Decimal(newOrder.prepayment).plus(newOrder.payment).toString()
            newOrder.unpaid = Decimal(newOrder.amount).minus(newOrder.paid).toString()
            newOrder.items = newOrder.items.map(item => {
                item.delivered = item.delivered === 1
                return item
            })
            setOrder(newOrder)
        }).catch(_ => { })
    }

    useEffect(load, [])

    return  <>
        <div style={{ display: mode === 'edit' ? 'block' : 'none' }}>
            <EditView order={order} setMode={setMode} messageApi={props.messageApi} refresh={_ => { load(); props.refresh() }} /> 
        </div>
        <div style={{ display: mode === 'view' ? 'block' : 'none'}}>
            <View order={order} setMode={setMode} />
        </div>
        <div style={{ display: mode === 'print' ? 'block' : 'none'}}>
            <PrintView order={order} setMode={setMode} />
        </div>
    </>
}

/*
    Required: order, setMode
*/
function View(props) {
    const itemColumns = [
        { title: '', align: 'center', width: 30, render: (_, __, idx) => idx + 1 },
        { title: '材质', dataIndex: 'material', align: 'center', width: 50, export: true, summary: '总计' },
        { title: '名称', dataIndex: 'name', align: 'center', width: 150, export: true },
        { title: '规格', dataIndex: 'spec', align: 'center', width: 70, export: true },
        { title: '数量', dataIndex: 'quantity', align: 'center', width: 70, export: true },
        { title: '单位', dataIndex: 'unit', align: 'center', width: 50, export: true },
        { title: '单价', dataIndex: 'price', align: 'center', width: 70, export: true },
        { title: '金额', dataIndex: 'originalAmount', align: 'center', width: 80, export: true, summary: 'sum' },
        { title: '折扣', dataIndex: 'discount', align: 'center', width: 50, export: true, onExport: d => `${d}%`, render: discount => `${discount}%` },
        { title: '折后价', dataIndex: 'amount', align: 'center', width: 80, export: true, summary: 'sum' },
        { title: '备注', dataIndex: 'remark', align: 'center', width: 100, export: true },
        { title: '配送', dataIndex: 'delivered', align: 'center', width: 60, fixed: 'right', export: true, onExport: d => d ? '已配送' : '未配送', 
            render: delivered => <span style={{ color: delivered ? 'black' : 'red' }}>{delivered ? '已配送' : '未配送'}</span>
        }
    ]
    const exportFile = () => {
        exportExcel(`销售单${props.order.id}`, getExportData(itemColumns, props.order.items))
    }
    return !props.order ? null : <>
        <Space direction='vertical' style={{ width: '100%', marginTop: '10px', marginBottom: '15px' }}>
            <Row style={{ justifyContent: 'space-between' }}>
                <div>客户：{props.order.partner}</div>
                <div>日期：{props.order.date}</div>
                <div>单号：{props.order.id}</div>
                <div>关联退货单：{props.order.refundId || '无'}</div>
            </Row>
            <Row style={{ justifyContent: 'space-between' }}>
                <div>总金额：{props.order.amount}</div>
                <div align='center'>订金：{props.order.prepayment}</div>
                <div align='right'>尾款：{props.order.payment}</div>
                <div align='right'>已付：{props.order.paid}</div>
                <div align='right'>未付：
                    <span style={{ color: props.order.unpaid === '0' ? 'black' : 'red' }}>{props.order.unpaid}</span>
                </div>
            </Row>
        </Space>

        <Table dataSource={props.order.items} columns={itemColumns} size='small' bordered style={{ height: 400 }} 
            rowKey={record => record.id} scroll={{x: 'max-content', y: 400 }} pagination={false} />

        <Divider />
        <Col align='end'>
            <Space>
                <Button icon={<EditOutlined/>} type='primary' onClick={_ => props.setMode('edit')}>编辑</Button>
                <Button icon={<TableOutlined/>} onClick={exportFile}>导出</Button>
                <Button icon={<PrinterOutlined/>} onClick={_ => props.setMode('print')}>打印预览</Button>
            </Space>
        </Col>
    </>
}


/*
    Required: order, setMode, refresh, messageApi
*/
function EditView(props) {
    const [order, setOrder] = useState(undefined)

    // Data
    const initOrder = () => {
        setOrder(props.order ? dcInvoice(props.order) : undefined)
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
        // 2. Upload
        const orderData = dcInvoice(order)
        orderData.date = orderData.date.format(dateFormat)
        orderData.items = orderData.items.filter(item => !isSalesOrderItemEmpty(item))
        Axios({
            method: 'put',
            baseURL: baseURL(),
            url: `salesOrder/id/${orderData.id}`,
            data: orderData,
            'Content-Type': 'application/json',
        }).then(_ => {
            props.messageApi.open({ type: 'success', content: '保存成功' })
            props.refresh()
            props.setMode('view')
        }).catch(_ => {
            props.messageApi.open({ type: 'error', content: '保存失败' })
        })
    }

    useEffect(initOrder, [props.order])

    useEffect(() => {
        if (order) {
            const newOrder = dcInvoice(order)
            if (order.items.length === 0 || !isSalesOrderItemEmpty(order.items.at(-1))) {
                newOrder.items.push(emptyInvoiceItem())
                setOrder(newOrder)
            } else if (order.items.length >= 2 && isSalesOrderItemEmpty(order.items.at(-2))) {
                newOrder.items.pop()
                setOrder(newOrder)
            }
        }
    }, [order])

    return !order ? null : <>
        <Space direction='vertical' style={{ width: '100%', marginTop: '10px', marginBottom: '15px' }}>
            <Row>
                <Col span={8}>客户：
                    <PartnerInput style={{ width: 120 }} size='small' value={order.partner} onChange={value => updateOrder('partner', value)}  />
                </Col>
                <Col span={8} align='center'>日期：
                    <DatePicker style={{ width: 120 }} size='small' value={order.date} onChange={value => updateOrder('date', value)} />
                </Col>
                <Col span={8} align='right'><FieldNumberOutlined style={{ marginRight: '4px' }} />{order.id}</Col>
            </Row>
            <Row>
                <Col span={8}>总金额：{order.amount}</Col>
                <Col span={8} align='center'>订金：
                    <InputNumber value={order.prepayment} style={{ width: 120 }} size='small' keyboard={false} stringMode controls={false} 
                        onChange={value => updateOrder('prepayment', value)}
                    />
                </Col>
                <Col span={8} align='right'>尾款：
                    <InputNumber size='small' keyboard={false} stringMode controls={false} 
                        placeholder={`应付 ${Decimal(order.amount).minus(order.prepayment || 0)}`}
                        value={order.payment} onChange={value => updateOrder('payment', value)} />
                    <Button size='small' style={{marginLeft: '5px'}} icon={<EditOutlined />}
                        onClick={_ => updateOrder('payment', Decimal(order.amount).minus(order.prepayment || 0).toString())} />
                </Col>
            </Row>
        </Space>

        <Table className='editTable' dataSource={order.items} columns={itemColumns} size='small' bordered style={{ height: 400 }} 
            rowKey={record => record.id} scroll={{x: 'max-content', y: 400 }} pagination={false} />
        <Divider />

        <Col align='end'>
            <Space>
                <Button icon={<SaveOutlined/>} type='primary' onClick={upload}>保存</Button>
                <Button icon={<CloseOutlined/>} onClick={_ => { initOrder(); props.setMode('view') }}>取消</Button>
            </Space>
        </Col>
    </>
}


function PrintView(props) {
    // for print
    const componentRef = useRef(null)
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
    })

    return <Space direction='vertical' size='middle' style={{ width: '100%', marginTop: '10px', marginBottom: '10px' }}>
            <Col align='middle' style={{ overflowX: 'auto', overflowY: 'clip' }}>
                <div ref={componentRef} >
                    {!props.order ? null : <InvoicePreview invoice={props.order} type='salesOrder' />}
                </div>
            </Col>
            <Col align='end'>
                <Space>
                    <Button icon={<RollbackOutlined />} onClick={_ => props.setMode('view')}>返回</Button>
                    <Button icon={<PrinterOutlined/>} onClick={handlePrint} type='primary'>打印</Button>
                </Space>
            </Col>
    </Space>
}