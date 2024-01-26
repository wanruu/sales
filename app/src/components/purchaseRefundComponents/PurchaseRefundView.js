import React, { useState, useEffect, useRef } from 'react'
import Axios from 'axios'
import Decimal from 'decimal.js'
import { Table, Button, Col, Row, Divider, Space } from 'antd'
import { EditOutlined, PrinterOutlined, TableOutlined, RollbackOutlined } from '@ant-design/icons'
import { useReactToPrint } from 'react-to-print'


import { baseURL } from '../../utils/config'
import { getExportData, exportExcel } from '../../utils/export'
import InvoicePrintView from '../common/InvoicePrintView'
import PurchaseRefundEditView from '../purchaseRefundComponents/PurchaseRefundEditView'
import { getInvoiceViewTableColumns } from '../../utils/invoiceUtils'


/*
    Required: id, refresh, messageApi
*/
export default function PurchaseRefundView(props) {
    const [refund, setRefund] = useState(undefined)
    const [mode, setMode] = useState('view')

    const load = () => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: `purchaseRefund/id/${props.id}`,
            'Content-Type': 'application/json',
        }).then(res => {
            const newRefund = res.data
            newRefund.items = newRefund.items.map(item => {
                item.delivered = item.delivered === 1
                item.orderId = newRefund.orderId
                return item
            })
            newRefund.unpaid = Decimal(newRefund.amount).minus(newRefund.payment).toNumber()
            setRefund(newRefund)
        }).catch(_ => { })
    }

    useEffect(load, [])

    return <>
        <div style={{ display: mode === 'edit' ? 'block' : 'none' }}>
            <PurchaseRefundEditView refund={refund} dismiss={_ => setMode('view')} messageApi={props.messageApi} refresh={_ => { load(); props.refresh() }} /> 
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
    const exportFile = () => {
        const itemColumns = getInvoiceViewTableColumns('purchaseRefund')
        exportExcel(`采购退货单${props.refund.id}`, getExportData(itemColumns, props.refund.items))
    }

    return !props.refund ? null : <>
        <Space direction='vertical' style={{ width: '100%', marginTop: '10px', marginBottom: '15px' }}>
            <Row>
                <Col span={8}>供应商：{props.refund.partner}</Col>
                <Col span={8}>日期：{props.refund.date}</Col>
                <Col span={8}>关联采购单：{props.refund.orderId || '无'}</Col>
            </Row>
            <Row>
                <Col span={8}>总金额：{props.refund.amount.toLocaleString()}</Col>
                <Col span={8}>已付：{props.refund.payment.toLocaleString()}</Col>
                <Col span={8}>未付：
                    <span style={{ color: props.refund.unpaid === 0 ? 'black' : 'red' }}>{props.refund.unpaid.toLocaleString()}</span>
                </Col>
            </Row>
        </Space>

        <Table dataSource={props.refund.items} columns={getInvoiceViewTableColumns('purchaseRefund')} 
            size='small' bordered style={{ height: 400 }} 
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
                    {!props.refund ? null : <InvoicePrintView invoice={props.refund} type='purchaseRefund' />}
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