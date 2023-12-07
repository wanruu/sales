import React, { useEffect, useState } from 'react'
import { Table, Divider, Space, Radio, Tag, Modal, message } from 'antd'
import Axios from 'axios'
import Decimal from 'decimal.js'


import { baseURL, invoiceSettings } from '../../utils/config'
import SalesOrderView from '../salesOrderComponents/SalesOrderView'
import SalesRefundView from '../salesRefundComponents/SalesRefundView'
import PurchaseOrderView from '../purchaseOrderComponents/PurchaseOrderView'
import PurchaseRefundView from '../purchaseRefundComponents/PurchaseRefundView'


const { Column, ColumnGroup } = Table


function InvoiceRefundTable(props) {
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(undefined)
    const [selectedInvoiceType, setSelectedInvoiceType] = useState(undefined)
    const INVOICE_TYPE_2_DICT = {
        sales: { str: '销售', color: 'blue' },
        purchase: { str: '采购', color: 'gold' },
        salesOrder: { str: '销售单', view: _ => <SalesOrderView id={selectedInvoiceId} messageApi={props.messageApi} refresh={props.refresh} /> },
        salesRefund: { str: '销售退款单', view: _ => <SalesRefundView id={selectedInvoiceId} messageApi={props.messageApi} refresh={props.refresh} /> },
        purchaseOrder: { str: '采购单', view: _ => <PurchaseOrderView id={selectedInvoiceId} messageApi={props.messageApi} refresh={props.refresh} /> },
        purchaseRefund: { str: '采购退款单', view: _ => <PurchaseRefundView id={selectedInvoiceId} messageApi={props.messageApi} refresh={props.refresh} /> }
    }
    const TYPE_FILTERS = Object.keys(INVOICE_TYPE_2_DICT).map(key => {
        return { value: key, text: INVOICE_TYPE_2_DICT[key].str }
    })
    const getSummary = (items) => {
        const orderAmount = items.reduce((total, cur) => total.plus(cur.orderAmount || 0), Decimal(0))
        const orderPaid = items.reduce((total, cur) => total.plus(cur.orderPrepayment || 0).plus(cur.orderPayment || 0), Decimal(0))
        const orderUnpaid = orderAmount.sub(orderPaid)
        const refundAmount = items.reduce((total, cur) => total.plus(cur.refundAmount || 0), Decimal(0))
        const refundPaid = items.reduce((total, cur) => total.plus(cur.refundPrepayment || 0).plus(cur.refundPayment || 0), Decimal(0))
        const refundUnpaid = refundAmount.sub(refundPaid)
        return <Table.Summary fixed>
            <Table.Summary.Row>
                <Table.Summary.Cell index={0} align='center'>总计</Table.Summary.Cell>
                <Table.Summary.Cell index={1} />
                <Table.Summary.Cell index={2} align='center'>{orderAmount.toNumber().toLocaleString()}</Table.Summary.Cell>
                <Table.Summary.Cell index={3} align='center'>{orderPaid.toNumber().toLocaleString()}</Table.Summary.Cell>
                <Table.Summary.Cell index={4} align='center'><font color={orderUnpaid.equals(0) ? 'black' : 'red'}>{orderUnpaid.toNumber().toLocaleString()}</font></Table.Summary.Cell>
                <Table.Summary.Cell index={5} />
                <Table.Summary.Cell index={6} align='center'>{refundAmount.toNumber().toLocaleString()}</Table.Summary.Cell>
                <Table.Summary.Cell index={7} align='center'>{refundPaid.toNumber().toLocaleString()}</Table.Summary.Cell>
                <Table.Summary.Cell index={8} align='center'><font color={refundUnpaid.equals(0) ? 'black' : 'red'}>{refundUnpaid.toNumber().toLocaleString()}</font></Table.Summary.Cell>
                <Table.Summary.Cell index={9} />
            </Table.Summary.Row>
        </Table.Summary>
    }
    const getFooter = () => {
        return '注意：当“销售单”与“采购单”混合显示时，总计金额不能代表实际应付、已付、未付的金额，请筛选后再查看。'
    }
    return <>
        <Modal title={selectedInvoiceType ? `${INVOICE_TYPE_2_DICT[selectedInvoiceType].str} (${selectedInvoiceId})` : ''} 
            open={selectedInvoiceId !== undefined} onCancel={_ => setSelectedInvoiceId(undefined)} width={900} footer={null} destroyOnClose>
            { selectedInvoiceType ? INVOICE_TYPE_2_DICT[selectedInvoiceType].view() : null }
        </Modal>
        <Table dataSource={props.invoices} pagination={false} scroll={{ x: 'max-content', y: 400 }} size='small' rowKey={r => r.id} bordered 
            summary={getSummary} footer={getFooter}>
            <Column title='序号' align='center' fixed='left' width={50} render={(_, __, idx) => idx + 1} />
            <ColumnGroup title='销售/采购单' align='center'>
                <Column title='单号' dataIndex='orderId' align='center' width={130} render={(id, r) => 
                    <a onClick={_ => { setSelectedInvoiceId(id); setSelectedInvoiceType(r.type + 'Order') } }>{id}</a>
                } />
                <Column title='金额' dataIndex='orderAmount' align='center' width={80} render={amount => amount.toLocaleString()} />
                <Column title='已付' align='center' width={80} render={(_, r) => (r.orderPrepayment + r.orderPayment).toLocaleString()} />
                <Column title='未付' align='center' width={80} render={(_, r) => {
                    const unpaid = r.orderAmount - r.orderPrepayment - r.orderPayment
                    return <font color={unpaid===0 ? 'black' : 'red'}>{unpaid.toLocaleString()}</font>
                }} />

            </ColumnGroup>
            <ColumnGroup title='关联退货单' align='center'>
                <Column title='退货单号' dataIndex='refundId' align='center' width={130} render={(id, r) => 
                    <a onClick={_ => { setSelectedInvoiceId(id); setSelectedInvoiceType(r.type + 'Refund') } }>{id}</a>
                } />
                <Column title='退款' dataIndex='refundAmount' align='center' width={80} render={amount => amount ? amount.toLocaleString() : null} />
                <Column title='已付' align='center' width={80} render={(_, r) => r.refundPayment ? (r.refundPrepayment + r.refundPayment).toLocaleString() : null} />
                <Column title='未付' align='center' width={80} render={(_, r) => {
                    const unpaid = r.refundAmount - r.refundPrepayment - r.refundPayment
                    return <font color={unpaid===0 ? 'black' : 'red'}>{r.refundPayment ? unpaid.toLocaleString() : null}</font>
                }} />
            </ColumnGroup>
            <Column title='类型' dataIndex='type' align='center' fixed='right' width={70} 
                filters={TYPE_FILTERS} onFilter={(val, record) => val === record.type}
                render={type => <Tag color={ INVOICE_TYPE_2_DICT[type].color }>{ INVOICE_TYPE_2_DICT[type].str }</Tag> } />
        </Table>
    </>
}

function ProductTable(props) {
    return <Table dataSource={props.products} pagination={false} scroll={{ x: 'max-content', y: 400 }} size='small' rowKey={r => r.id} bordered 
        footer={() => '注意：表中显示的“数量”是减去“退货数量”之后的值。'}>
        <Column title='序号' align='center' fixed='left' width={50} render={(_, __, idx) => idx + 1} />
        <ColumnGroup title='产品信息' align='center'>
            { invoiceSettings.get('ifShowMaterial') === 'true' ? 
                <Column title='材质' dataIndex='material' align='center' width={50} /> : null }
            <Column title='名称' dataIndex='name' align='center' width={150} />
            <Column title='规格' dataIndex='spec' align='center' width={80} />
            <Column title='单位' dataIndex='unit' align='center' width={50} />
        </ColumnGroup>
        <ColumnGroup title='销售信息' align='center'>
            <Column title='数量' dataIndex='salesQuantity' align='center' width={70} render={p => p ? p.toLocaleString() : null} />
            <Column title='均价' dataIndex='salesPrice' align='center' width={70} render={p => p ? p.toLocaleString() : null} />
            <Column title='退货数量' dataIndex='salesRefundQuantity' align='center' width={80} render={p => p ? p.toLocaleString() : null} />
        </ColumnGroup>
        <ColumnGroup title='采购信息' align='center'>
            <Column title='数量' dataIndex='purchaseQuantity' align='center' width={70} render={p => p ? p.toLocaleString() : null} />
            <Column title='均价' dataIndex='purchasePrice' align='center' width={70} render={p => p ? p.toLocaleString() : null} />
            <Column title='退货数量' dataIndex='purchaseRefundQuantity' align='center' width={80} render={p => p ? p.toLocaleString() : null} />
        </ColumnGroup>
    </Table>
}


/*
    Required: name, dismiss
*/
export default function PartnerView(props) {
    const [partner, setPartner] = useState(undefined)
    const [tableType, setTableType] = useState('byInvoiceRefund')

    const [messageApi, contextHolder] = message.useMessage()

    const load = () => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: `/partner/name/${props.name}`,
            'Content-Type': 'application/json',
        }).then(res => {
            setPartner(res.data)
            console.log(res.data)
        })
    }
    useEffect(load, [props.name])

    const tableDict = {
        'byInvoiceRefund': _ => <InvoiceRefundTable invoices={partner.invoices} refresh={load} messageApi={messageApi} />,
        'byInvoiceItem': _ => '',
        'byProduct': _ => <ProductTable products={partner.products} />
    }

    return partner === undefined ? null : <>
        {contextHolder}
        <Space direction='vertical' style={{ width: '100%', marginTop: '10px', marginBottom: '15px' }}>
            
            <Radio.Group value={tableType} onChange={e => setTableType(e.target.value)}>
                <Radio value='byInvoiceRefund'>清单总览</Radio>
                <Radio value='byInvoiceItem'>清单条目</Radio>
                <Radio value='byProduct'>产品</Radio>
            </Radio.Group>

            { tableDict[tableType]() }

            <Divider />
        </Space>
    </>
}