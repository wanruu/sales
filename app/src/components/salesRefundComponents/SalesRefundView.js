import React, { useState, useEffect, useRef } from 'react'
import Axios from 'axios'
import Decimal from 'decimal.js'
import { Table, Button, Col, Row, Divider, Space } from 'antd'
import { EditOutlined, PrinterOutlined, TableOutlined, RollbackOutlined } from '@ant-design/icons'
import { useReactToPrint } from 'react-to-print'


import { baseURL } from '../../utils/config'
import { getExportData, exportExcel } from '../../utils/export'
import InvoiceView from '../common/InvoiceView'
import SalesRefundEditView from '../salesRefundComponents/SalesRefundEditView'


/*
    Required: id, refresh, messageApi
*/
export default function SalesRefundView(props) {
    const [refund, setRefund] = useState(undefined)
    const [mode, setMode] = useState('view')

    const load = () => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: `salesRefund/id/${props.id}`,
            'Content-Type': 'application/json',
        }).then(res => {
            const newRefund = res.data
            newRefund.items = newRefund.items.map(item => {
                item.delivered = item.delivered === 1
                item.orderId = newRefund.orderId
                return item
            })
            newRefund.unpaid = Decimal(newRefund.amount).minus(newRefund.payment).toString()
            setRefund(newRefund)
        }).catch(_ => { })
    }

    useEffect(load, [])

    return <>
        <div style={{ display: mode === 'edit' ? 'block' : 'none' }}>
            <SalesRefundEditView refund={refund} dismiss={_ => setMode('view')} messageApi={props.messageApi} refresh={_ => { load(); props.refresh() }} /> 
        </div>
        <div style={{ display: mode === 'view' ? 'block' : 'none'}}>
            <View refund={refund} setMode={setMode} />
        </div>
        <div style={{ display: mode === 'print' ? 'block' : 'none'}}>
            <PrintView refund={refund} setMode={setMode} />
        </div>
    </>
}


/*
    Required: refund, setMode
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
        }
    ]
    const exportFile = () => {
        exportExcel(`销售退货单${props.refund.id}`, getExportData(itemColumns, props.refund.items))
    }
    return !props.refund ? null : <>
        <Space direction='vertical' style={{ width: '100%', marginTop: '10px', marginBottom: '15px' }}>
            <Row style={{ justifyContent: 'space-between' }}>
                <div>客户：{props.refund.partner}</div>
                <div>日期：{props.refund.date}</div>
                <div>关联销售单：{props.refund.orderId || '无'}</div>
            </Row>
            <Row style={{ justifyContent: 'space-between' }}>
                <div>总金额：{props.refund.amount}</div>
                <div align='right'>已付：{props.refund.payment}</div>
                <div align='right'>未付：
                    <span style={{ color: props.refund.unpaid === '0' ? 'black' : 'red' }}>{props.refund.unpaid}</span>
                </div>
            </Row>
        </Space>

        <Table dataSource={props.refund.items} columns={itemColumns} size='small' bordered style={{ height: 400 }} 
            rowKey={record => record.refundItemId} scroll={{x: 'max-content', y: 400 }} pagination={false} />

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

    return <>
        <Space direction='vertical' size='middle' style={{ width: '100%', marginTop: '10px', marginBottom: '10px' }}>
            <Col align='middle' style={{ overflowX: 'auto', overflowY: 'clip' }}>
                <div ref={componentRef} > 
                    {!props.refund ? null : <InvoiceView invoice={props.refund} type='salesRefund' />}
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