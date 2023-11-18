import React, { useEffect, useState, useRef } from 'react'
import Axios from 'axios'
import Decimal from 'decimal.js'
import { Table, Button, Col, Row, Divider, Space, Popover } from 'antd'
import { EditOutlined, PrinterOutlined, TableOutlined, RollbackOutlined } from '@ant-design/icons'
import { useReactToPrint } from 'react-to-print'


import { baseURL, invoiceSettings } from '../../utils/config'
import { getExportData, exportExcel } from '../../utils/export'
import InvoiceView from '../common/InvoiceView'
import PurchaseOrderEditView from './PurchaseOrderEditView'
import PartnerPopoverView from '../partnerComponents/PartnerPopoverView'

/*
    Required: id, refresh, messageApi
*/
export default function PurchaseOrderView(props) {
    const [order, setOrder] = useState(undefined)
    const [mode, setMode] = useState('view')

    const load = () => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: `purchaseOrder/id/${props.id}`,
            'Content-Type': 'application/json',
        }).then(res => {
            const newOrder = res.data
            newOrder.paid = Decimal(newOrder.prepayment).plus(newOrder.payment).toNumber()
            newOrder.unpaid = Decimal(newOrder.amount).minus(newOrder.paid).toNumber()
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
            <PurchaseOrderEditView order={order} dismiss={_ => setMode('view')} messageApi={props.messageApi} refresh={_ => { load(); props.refresh() }} /> 
        </div>
        <div style={{ display: mode === 'view' ? 'block' : 'none'}}>
            <View order={order} setMode={setMode} refresh={load} />
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
    const getTableColumns = () => {
        const ifShowMaterial = invoiceSettings.get('ifShowMaterial') === 'true'
        const ifShowDiscount = invoiceSettings.get('ifShowDiscount') === 'true'
        return [
            { title: '', align: 'center', width: 30, fixed: 'left', render: (_, __, idx) => idx + 1 },
            ifShowMaterial ? { title: '材质', dataIndex: 'material', align: 'center', width: 50 } : null,
            { title: '名称', dataIndex: 'name', align: 'center', width: 150 },
            { title: '规格', dataIndex: 'spec', align: 'center', width: 70 },
            { title: '数量', dataIndex: 'quantity', align: 'center', width: 70, render: q => q.toLocaleString() },
            { title: '单位', dataIndex: 'unit', align: 'center', width: 50 },
            { title: '单价', dataIndex: 'price', align: 'center', width: 70, render: p => p.toLocaleString() },
            ifShowDiscount ? { title: '金额', dataIndex: 'originalAmount', align: 'center', width: 80, render: a => a.toLocaleString() } : null,
            ifShowDiscount ? { title: '折扣', dataIndex: 'discount', align: 'center', width: 50, render: discount => `${discount}%` } : null,
            { title: ifShowDiscount ? '折后价' : '金额', dataIndex: 'amount', align: 'center', width: 80, render: d => d.toLocaleString() },
            { title: '重量', dataIndex: 'weight', align: 'center', width: 80 },
            { title: '备注', dataIndex: 'remark', align: 'center', width: 100 },
            { title: '配送', dataIndex: 'delivered', align: 'center', width: 60, fixed: 'right', render: delivered => 
                <span style={{ color: delivered ? 'black' : 'red' }}>{delivered ? '已配送' : '未配送'}</span>
            },
            { title: '退货状态', align: 'center', width: 75, fixed: 'right', render: (_, record) => 
                <Popover trigger='click' content={
                    <Space direction='vertical'>
                        <span>退货数量：{(record.refundQuantity || 0).toLocaleString()}</span>
                        { ifShowDiscount ? <span>金额：{(record.refundOriginalAmount || 0).toLocaleString()}</span> : null }
                        <span>{ifShowDiscount ? '折后价：': '金额：'}{(record.refundAmount || 0).toLocaleString()}</span>
                    </Space>
                }>
                    <a>{ Decimal(record.refundQuantity || 0).equals(record.quantity) ? '全部退货' :
                        (Decimal(record.refundQuantity || 0).gt(record.quantity) ? '退货超数' : (
                            Decimal(record.refundQuantity || 0).equals(0) ? null : '部分退货'
                        ))
                    }</a>
                </Popover>
            }
        ].filter(i => i != null)
    }
    const exportFile = () => {
        const ifShowMaterial = invoiceSettings.get('ifShowMaterial') === 'true'
        const ifShowDiscount = invoiceSettings.get('ifShowDiscount') === 'true'
        const itemColumns = [
            ifShowMaterial ? { title: '材质', dataIndex: 'material', summary: '总计' } : null,
            { title: '名称', dataIndex: 'name', summary: ifShowMaterial ? '' : '总计' },
            { title: '规格', dataIndex: 'spec' },
            { title: '数量', dataIndex: 'quantity' },
            { title: '单位', dataIndex: 'unit' },
            { title: '单价', dataIndex: 'price' },
            ifShowDiscount ? { title: '金额', dataIndex: 'originalAmount', summary: 'sum' } : null,
            ifShowDiscount ? { title: '折扣', dataIndex: 'discount', onExport: d => `${d}%` } : null,
            { title: ifShowDiscount ? '折后价' : '金额', dataIndex: 'amount', summary: 'sum' },
            { title: '重量', dataIndex: 'weight' },
            { title: '备注', dataIndex: 'remark' },
            { title: '配送', dataIndex: 'delivered', onExport: d => d ? '已配送' : '未配送' },
            { title: '退货状态', width: 75, onExport: (_, record) => 
                Decimal(record.refundQuantity || 0).equals(record.quantity) ? '全部退货' :
                (Decimal(record.refundQuantity || 0).gt(record.quantity) ? '退货超数' : (
                Decimal(record.refundQuantity || 0).equals(0) ? null : '部分退货'
            )) }
        ].filter(i => i != null)
        exportExcel(`采购单${props.order.id}`, getExportData(itemColumns, props.order.items))
    }
    return !props.order ? null : <>
        <Space direction='vertical' style={{ width: '100%', marginTop: '10px', marginBottom: '15px' }}>
            <Row style={{ justifyContent: 'space-between' }}>
                <div>供应商：<PartnerPopoverView refresh={props.refresh}
                    partner={_.fromPairs(['name', 'folder', 'phone', 'address'].map(key => [key, props.order[key]]))} />
                </div>
                <div>日期：{props.order.date}</div>
                <div>关联退货单：{props.order.refundId || '无'}</div>
            </Row>
            <Row style={{ justifyContent: 'space-between' }}>
                <div>总金额：{props.order.amount.toLocaleString()}</div>
                <div align='center'>订金：{props.order.prepayment.toLocaleString()}</div>
                <div align='right'>尾款：{props.order.payment.toLocaleString()}</div>
                <div align='right'>已付：{props.order.paid.toLocaleString()}</div>
                <div align='right'>未付：
                    <span style={{ color: props.order.unpaid === 0 ? 'black' : 'red' }}>{props.order.unpaid.toLocaleString()}</span>
                </div>
            </Row>
        </Space>

        <Table dataSource={props.order.items} columns={getTableColumns()} size='small' bordered style={{ height: 400 }} 
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


function PrintView(props) {
    // for print
    const componentRef = useRef(null)
    const handlePrint = useReactToPrint({ content: () => componentRef.current })

    return <>
        <Space direction='vertical' size='middle' style={{ width: '100%', marginTop: '10px', marginBottom: '10px' }}>
            <Col align='middle' style={{ overflowX: 'auto', overflowY: 'clip' }}>
                <div ref={componentRef} >
                    {!props.order ? null : <InvoiceView invoice={props.order} type='purchaseOrder' />}
                </div>
            </Col>
        </Space>
        <Col align='end'>
            <Space>
                <Button icon={<RollbackOutlined />} onClick={_ => props.setMode('view')}>返回</Button>
                <Button icon={<PrinterOutlined/>} onClick={handlePrint} type='primary'>打印</Button>
            </Space>
        </Col>
    </>
}