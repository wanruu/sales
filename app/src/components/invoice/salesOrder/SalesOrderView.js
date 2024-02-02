import React, { useEffect, useState } from 'react'
import Axios from 'axios'
import Decimal from 'decimal.js'
import { Table, Button, Col, Row, Divider, Space } from 'antd'
import { EditOutlined, PrinterOutlined, TableOutlined } from '@ant-design/icons'


import { baseURL } from '../../../utils/config'
import { getExportData, exportExcel } from '../../../utils/export'
import InvoicePrintView from '../InvoicePrintView'
import SalesOrderEditView from './SalesOrderEditView'
import PartnerPopoverView from '../../partner/PartnerPopoverView'
import { getInvoiceExportColumns, getInvoiceViewTableColumns } from '../../../utils/invoiceUtils'


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
            newOrder.paid = Decimal(newOrder.prepayment).plus(newOrder.payment).toNumber()
            newOrder.unpaid = Decimal(newOrder.amount).minus(newOrder.paid).toNumber()
            newOrder.items = newOrder.items.map(item => {
                item.delivered = item.delivered === 1
                return item
            })
            setOrder(newOrder)
        }).catch(_ => { })
    }

    const refresh = () => {
        load()
        props.refresh()
    }

    const modeDict = {
        'edit': <SalesOrderEditView order={order} dismiss={_ => setMode('view')} messageApi={props.messageApi} refresh={refresh} />,
        'view': <View order={order} setMode={setMode} refresh={load} allowEditPartner={props.allowEditPartner} />,
        'print': <InvoicePrintView invoice={order} type='salesOrder' dismiss={_ => setMode('view')} />
    }

    useEffect(load, [])

    return modeDict[mode]
}

/*
    Required: order, setMode, refresh
    Optional: allowEditPartner
*/
function View(props) {
    const exportFile = () => {
        const itemColumns = getInvoiceExportColumns('salesOrder')
        exportExcel(`销售单${props.order.id}`, getExportData(itemColumns, props.order.items))
    }
    return !props.order ? null : <>
        <Space direction='vertical' style={{ width: '100%', marginTop: '10px', marginBottom: '15px' }}>
            <Row>
                <Col span={8}>客户：{
                    props.allowEditPartner ?
                    <PartnerPopoverView refresh={props.refresh} partner={_.fromPairs(['name', 'folder', 'phone', 'address'].map(key => [key, props.order[key]]))} />
                    : props.order.name
                }</Col>
                <Col span={8}>日期：{props.order.date}</Col>
                <Col span={8}>关联退货单：{props.order.refundId || '无'}</Col>
            </Row>
            <Row style={{ justifyContent: 'space-between' }}>
                <Col span={8}>总金额：{props.order.amount.toLocaleString()}</Col>
                <Col span={8}>
                    已付：{props.order.paid.toLocaleString()}（订金：{props.order.prepayment.toLocaleString()}，尾款：{props.order.payment.toLocaleString()}）
                </Col>
                <Col span={8}>未付：
                    <span style={{ color: props.order.unpaid === 0 ? 'black' : 'red' }}>{props.order.unpaid.toLocaleString()}</span>
                </Col>
            </Row>
        </Space>

        <Table dataSource={props.order.items} columns={getInvoiceViewTableColumns('salesOrder')} 
            size='small' bordered style={{ height: 400 }} 
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