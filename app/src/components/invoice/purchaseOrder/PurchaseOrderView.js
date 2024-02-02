import React, { useEffect, useState } from 'react'
import Axios from 'axios'
import Decimal from 'decimal.js'
import { Button, Col, Space } from 'antd'
import { EditOutlined, PrinterOutlined } from '@ant-design/icons'


import { baseURL } from '../../../utils/config'
import InvoicePrintView from '../InvoicePrintView'
import PurchaseOrderEditView from './PurchaseOrderEditView'
import InvoiceView from '../InvoiceView'

/*
    Required: id, refresh, messageApi
    Optional: allowEditPartner
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

    const refresh = () => {
        load()
        props.refresh()
    }

    const modeDict = {
        'edit': <PurchaseOrderEditView order={order} dismiss={_ => setMode('view')} messageApi={props.messageApi} refresh={refresh} />,
        'view': order ? <>
            <InvoiceView type='purchaseOrder' invoice={order} allowEditPartner={true} refresh={refresh} />
            <Col align='end'>
                <Space>
                    <Button icon={<EditOutlined/>} type='primary' onClick={_ => setMode('edit')}>编辑</Button>
                    {/* <Button icon={<TableOutlined/>} onClick={exportFile}>导出</Button> */}
                    <Button icon={<PrinterOutlined/>} onClick={_ => setMode('print')}>打印预览</Button>
                </Space>
            </Col>
        </> : null,
        'print': <InvoicePrintView invoice={order} type='purchaseOrder' dismiss={_ => setMode('view')} />
    }

    useEffect(load, [])

    return  modeDict[mode]
}