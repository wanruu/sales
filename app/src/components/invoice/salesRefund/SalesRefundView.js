import React, { useState, useEffect } from 'react'
import Axios from 'axios'
import Decimal from 'decimal.js'
import { Button, Col, Space } from 'antd'
import { EditOutlined, PrinterOutlined } from '@ant-design/icons'


import { baseURL } from '../../../utils/config'
import InvoicePrintView from '../InvoicePrintView'
import SalesRefundEditView from './SalesRefundEditView'
import InvoiceView from '../InvoiceView'


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
            newRefund.paid = Decimal(newRefund.prepayment).plus(newRefund.payment).toNumber()
            newRefund.unpaid = Decimal(newRefund.amount).minus(newRefund.paid).toNumber()
            newRefund.items = newRefund.items.map(item => {
                item.delivered = item.delivered === 1
                item.orderId = newRefund.orderId
                return item
            })
            setRefund(newRefund)
        }).catch(_ => { })
    }

    const refresh = () => {
        load()
        props.refresh()
    }

    const modeDict = {
        'edit': <SalesRefundEditView refund={refund} dismiss={_ => setMode('view')} messageApi={props.messageApi} refresh={refresh} />,
        'view': refund ? <>
            <InvoiceView type='salesRefund' invoice={refund} />
            <Col align='end'>
                <Space>
                    <Button icon={<EditOutlined/>} type='primary' onClick={_ => setMode('edit')}>编辑</Button>
                    {/* <Button icon={<TableOutlined/>} onClick={exportFile}>导出</Button> */}
                    <Button icon={<PrinterOutlined/>} onClick={_ => setMode('print')}>打印预览</Button>
                </Space>
            </Col>
        </> : null,
        'print': <InvoicePrintView invoice={refund} dismiss={_ => setMode('view')} type='salesRefund' />
    }

    useEffect(load, [])

    return modeDict[mode]
}