import React, { useEffect, useState, useRef } from 'react'
import Axios from 'axios'
import Decimal from 'decimal.js'
import { Table, Button, Col, Row, Divider, Space, Popover } from 'antd'
import { EditOutlined, PrinterOutlined, TableOutlined, RollbackOutlined } from '@ant-design/icons'
import { useReactToPrint } from 'react-to-print'


import { baseURL } from '../../utils/config'
import { getExportData, exportExcel } from '../../utils/export'
import InvoiceView from '../common/InvoiceView'
import '../common/Invoice.css'
import SalesOrderEditView from './SalesOrderEditView'


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
            <SalesOrderEditView order={order} dismiss={_ => setMode('view')} messageApi={props.messageApi} refresh={_ => { load(); props.refresh() }} /> 
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
        { title: '', align: 'center', width: 30, fixed: 'left', render: (_, __, idx) => idx + 1 },
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
        },
        { title: '退货状态', align: 'center', width: 75, fixed: 'right', export: true, render: (_, record) => 
            <Popover trigger='click' content={
                <Space direction='vertical'>
                    <span>退货数量：{record.refundQuantity}</span>
                    <span>退货金额：{record.refundOriginalAmount}</span>
                    <span>折后价：{record.refundAmount}</span>
                </Space>
            }>
                <a>{ Decimal(record.refundQuantity || 0).equals(record.quantity) ? '全部退货' :
                    (Decimal(record.refundQuantity || 0).gt(record.quantity) ? '退货超数' : (
                        Decimal(record.refundQuantity || 0).equals(0) ? null : '部分退货'
                    ))
                }</a>
            </Popover>
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


function PrintView(props) {
    // for print
    const componentRef = useRef(null)
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
    })

    return <Space direction='vertical' size='middle' style={{ width: '100%', marginTop: '10px', marginBottom: '10px' }}>
        <Col align='middle' style={{ overflowX: 'auto', overflowY: 'clip' }}>
            <div ref={componentRef} >
                {!props.order ? null : <InvoiceView invoice={props.order} type='salesOrder' />}
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