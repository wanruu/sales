import React, { useState, useEffect } from 'react'
import Axios from 'axios'
import Decimal from 'decimal.js'
import { Table, Button, Col, Row, Divider, Space } from 'antd'
import { EditOutlined, PrinterOutlined, TableOutlined } from '@ant-design/icons'


import { baseURL } from '../../../utils/config'
import { getExportData, exportExcel } from '../../../utils/export'
import InvoicePrintView from '../InvoicePrintView'
import PurchaseRefundEditView from './PurchaseRefundEditView'
import { getInvoiceViewTableColumns } from '../../../utils/invoiceUtils'


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

    const refresh = () => {
        load()
        props.refresh()
    }

    const modeDict = {
        'edit': <PurchaseRefundEditView refund={refund} dismiss={_ => setMode('view')} messageApi={props.messageApi} refresh={refresh} />,
        'view': <View refund={refund} setMode={setMode}  />,
        'print': <InvoicePrintView invoice={refund} dismiss={_ => setMode('view')} type='purchaseRefund' />
    }

    useEffect(load, [])

    return modeDict[mode]
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
                    <span style={{ color: props.refund.unpaid === 0 ? 'black' : 'red' }}>
                        {props.refund.unpaid.toLocaleString()}
                    </span>
                </Col>
            </Row>
        </Space>

        <Table dataSource={props.refund.items.filter(item => item.quantity != null)} 
        columns={getInvoiceViewTableColumns('purchaseRefund')} 
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