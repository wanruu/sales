import React, { useEffect, useState } from 'react'
import { Table, Divider, Space, Radio, Tag, Modal, message, Button } from 'antd'
import Axios from 'axios'
import Decimal from 'decimal.js'


import { baseURL, invoiceSettings } from '../../utils/config'
import { MyWorkBook, MyWorkSheet } from '../../utils/export'
import SalesOrderView from '../salesOrderComponents/SalesOrderView'
import SalesRefundView from '../salesRefundComponents/SalesRefundView'
import PurchaseOrderView from '../purchaseOrderComponents/PurchaseOrderView'
import PurchaseRefundView from '../purchaseRefundComponents/PurchaseRefundView'


const { Column, ColumnGroup } = Table


function InvoiceTable(props) {
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
    const TYPE_FILTERS = [
        { value: 'sales', text: '销售' },
        { value: 'purchase', text: '采购' }
    ]
    const exportExcel = (items) => {
        let headers = [
            { title: '序号', render: (_, __, idx) => idx + 1 },
            { title: '销售/采购单', children: [
                { title: '单号', dataIndex: 'orderId' },
                { title: '金额', dataIndex: 'orderAmount' },
                { title: '已付', render: (_, r) => r.orderPrepayment + r.orderPayment },
                { title: '未付', render: (_, r) => r.orderAmount - r.orderPrepayment - r.orderPayment }
            ] },
            { title: '关联退货单', children: [
                { title: '单号', dataIndex: 'refundId' },
                { title: '金额', dataIndex: 'refundAmount' },
                { title: '已付', render: (_, r) => r.refundPayment ? r.refundPrepayment + r.refundPayment : null},
                { title: '未付', render: (_, r) => r.refundPayment ? r.refundAmount - r.refundPrepayment - r.refundPayment : null}
            ] },
            { title: '类型', dataIndex: 'type', render: type => INVOICE_TYPE_2_DICT[type].str },
        ]
        let wb = new MyWorkBook('清单总览')
        let ws = new MyWorkSheet()
        ws.writeJson(headers, items)
        wb.writeSheet(ws)
        wb.save()
    }
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
                <Table.Summary.Cell index={9} align='center'><Button type='primary' onClick={_ => exportExcel(items)}>导出</Button></Table.Summary.Cell>
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

function InvoiceItemTable(props) {
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
    const TYPE_FILTERS = [
        { value: 'sales', text: '销售' },
        { value: 'purchase', text: '采购' }
    ]

    const ifShowMaterial = invoiceSettings.get('ifShowMaterial') === 'true'
    const ifShowDiscount = invoiceSettings.get('ifShowDiscount') === 'true'

    const getSummary = (items) => {
        const orderOriginalAmount = items.reduce((total, cur) => total.plus(cur.orderOriginalAmount || 0), Decimal(0))
        const orderAmount = items.reduce((total, cur) => total.plus(cur.orderAmount || 0), Decimal(0))
        const refundOriginalAmount = items.reduce((total, cur) => total.plus(cur.refundOriginalAmount || 0), Decimal(0))
        const refundAmount = items.reduce((total, cur) => total.plus(cur.refundAmount || 0), Decimal(0))
        if (ifShowDiscount) {
            return <Table.Summary fixed>
                <Table.Summary.Row>
                    <Table.Summary.Cell index={0} align='center'>总计</Table.Summary.Cell>
                    <Table.Summary.Cell index={1} colSpan={ifShowMaterial ? 7 : 6}/>
                    <Table.Summary.Cell index={ifShowMaterial ? 8 : 7} align='center'>{orderOriginalAmount.toNumber().toLocaleString()}</Table.Summary.Cell>
                    <Table.Summary.Cell index={ifShowMaterial ? 9 : 8} />
                    <Table.Summary.Cell index={ifShowMaterial ? 10 : 9} align='center'>{orderAmount.toNumber().toLocaleString()}</Table.Summary.Cell>
                    <Table.Summary.Cell index={ifShowMaterial ? 11 : 10} colSpan={3} />
                    <Table.Summary.Cell index={ifShowMaterial ? 14 : 13} align='center'>{refundOriginalAmount.toNumber().toLocaleString()}</Table.Summary.Cell>
                    <Table.Summary.Cell index={ifShowMaterial ? 15 : 14} align='center'>{refundAmount.toNumber().toLocaleString()}</Table.Summary.Cell>
                    <Table.Summary.Cell index={ifShowMaterial ? 16 : 15} />
                    <Table.Summary.Cell index={ifShowMaterial ? 17 : 16} align='center'>
                        <Button type='primary' onClick={_ => exportExcel(items)}>导出</Button>
                    </Table.Summary.Cell>
                </Table.Summary.Row>
            </Table.Summary>
        }
        return <Table.Summary fixed>
            <Table.Summary.Row>
                <Table.Summary.Cell index={0} align='center'>总计</Table.Summary.Cell>
                <Table.Summary.Cell index={1} colSpan={ifShowMaterial ? 7 : 6}/>
                <Table.Summary.Cell index={ifShowMaterial ? 8 : 7} align='center'>{orderAmount.toNumber().toLocaleString()}</Table.Summary.Cell>
                <Table.Summary.Cell index={ifShowMaterial ? 9 : 8} colSpan={3} />
                <Table.Summary.Cell index={ifShowMaterial ? 12 : 11} align='center'>{refundAmount.toNumber().toLocaleString()}</Table.Summary.Cell>
                <Table.Summary.Cell index={ifShowMaterial ? 13 : 12} />
                <Table.Summary.Cell index={ifShowMaterial ? 14 : 13} align='center'>
                    <Button type='primary' onClick={_ => exportExcel(items)}>导出</Button>
                </Table.Summary.Cell>
            </Table.Summary.Row>
        </Table.Summary>
    }
    const getFooter = () => {
        return <>
            注意：<ol style={{ margin: 0 }}>
                <li>当“销售单”与“采购单”混合显示时，总计金额不能代表实际金额，请筛选后再查看。</li>
                <li>点击“导出”按钮将导出筛选后的表格数据。</li>
            </ol>
        </>
    }

    const exportExcel = (items) => {
        let headers = [
            { title: '序号', render: (_, __, idx) => idx + 1 },
            { title: '销售/采购单', children: [
                { title: '单号', dataIndex: 'orderId' },
                { title: '材质', dataIndex: 'material' },
                { title: '名称', dataIndex: 'name' },
                { title: '规格', dataIndex: 'spec' },
                { title: '数量', dataIndex: 'orderQuantity' },
                { title: '单位', dataIndex: 'unit' },
                { title: '单价', dataIndex: 'price' },
                { title: '金额', dataIndex: 'orderOriginalAmount' },
                { title: '折扣', dataIndex: 'discount' },
                { title: '折后价', dataIndex: 'orderAmount' },
                { title: '备注', dataIndex: 'orderRemark' }
            ] },
            { title: '关联退货单', children: [
                { title: '单号', dataIndex: 'refundId' },
                { title: '数量', dataIndex: 'refundQuantity' },
                { title: '金额', dataIndex: 'refundOriginalAmount' },
                { title: '折后价', dataIndex: 'refundAmount' },
                { title: '备注', dataIndex: 'refundRemark' }
            ] },
            { title: '类型', dataIndex: 'type', render: type => INVOICE_TYPE_2_DICT[type].str },
        ]
        let wb = new MyWorkBook('清单条目')
        let ws = new MyWorkSheet()
        ws.writeJson(headers, items)
        wb.writeSheet(ws)
        wb.save()
    }

    const process = (invoiceItems) => {
        return invoiceItems.reduce((result, item) => {
            if (result.indexOf(item.orderId) < 0) {
                result.push(item.orderId)
            }
            return result
        }, []).reduce((result, value) => {
            const children = invoiceItems.filter(item => item.orderId === value)
            result = result.concat(
                children.map((item, index) => ({ ...item, rowSpan: {
                    refundId: index === 0 ? children.length : 0,
                    orderId: index === 0 ? children.length : 0
                } }))
            )
            return result
        }, [])
    }
    return <>
        <Modal title={selectedInvoiceType ? `${INVOICE_TYPE_2_DICT[selectedInvoiceType].str} (${selectedInvoiceId})` : ''} 
            open={selectedInvoiceId !== undefined} onCancel={_ => setSelectedInvoiceId(undefined)} width={900} footer={null} destroyOnClose>
            { selectedInvoiceType ? INVOICE_TYPE_2_DICT[selectedInvoiceType].view() : null }
        </Modal>
        <Table dataSource={process(props.invoiceItems)} pagination={false} scroll={{ x: 'max-content', y: 400 }} size='small' 
            rowKey={r => r.id} bordered footer={getFooter} summary={getSummary}>
            <Column title='序号' align='center' fixed='left' width={50} render={(_, __, idx) => idx + 1} />
            <ColumnGroup title='销售/采购单' align='center'>
                <Column title='单号' dataIndex='orderId' align='center' width={130} render={(id, r) => {
                    return { 
                        children: <a onClick={_ => { setSelectedInvoiceId(id); setSelectedInvoiceType(r.type + 'Order') } }>{id}</a>,
                        props: { rowSpan: r.rowSpan.orderId }
                    }
                }} />
                { ifShowMaterial ? <Column title='材质' dataIndex='material' align='center' width={50} /> : null }
                <Column title='名称' dataIndex='name' align='center' width={120} />
                <Column title='规格' dataIndex='spec' align='center' width={80} />
                <Column title='数量' dataIndex='orderQuantity' align='center' width={80} render={q => q.toLocaleString()} />
                <Column title='单位' dataIndex='unit' align='center' width={50} />
                <Column title='单价' dataIndex='price' align='center' width={80} render={p => p.toLocaleString()} />
                { ifShowDiscount ? 
                    <Column title='金额' dataIndex='orderOriginalAmount' align='center' width={80} render={amount => amount.toLocaleString()} />
                    : null }
                { ifShowDiscount ? <Column title='折扣' dataIndex='discount' align='center' width={60} render={d => `${d}%`} /> : null }
                <Column title={ifShowDiscount ? '折后价' : '金额'} dataIndex='orderAmount' align='center' width={80} render={amount => amount.toLocaleString()} />
                <Column title='备注' dataIndex='orderRemark' align='center' width={100} />
            </ColumnGroup>
            <ColumnGroup title='关联退货单' align='center'>
                <Column title='单号' dataIndex='refundId' align='center' width={130} render={(id, r) => {
                    return { 
                        children: <a onClick={_ => { setSelectedInvoiceId(id); setSelectedInvoiceType(r.type + 'Refund') } }>{id}</a>,
                        props: { rowSpan: r.rowSpan.orderId }
                    }
                }} /> 
                <Column title='数量' dataIndex='refundQuantity' align='center' width={80} render={q => q ? q.toLocaleString() : null} />
                { ifShowDiscount ? 
                    <Column title='金额' dataIndex='refundOriginalAmount' align='center' width={80} render={amount => amount ? amount.toLocaleString() : null} />
                    : null }
                <Column title={ifShowDiscount ? '折后价' : '金额'} dataIndex='refundAmount' align='center' width={80} render={amount => amount ? amount.toLocaleString() : null} />
                <Column title='备注' dataIndex='refundRemark' align='center' width={100} />
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
    const [tableType, setTableType] = useState('byInvoice')
    const [messageApi, contextHolder] = message.useMessage()

    const load = () => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: `/partner/name/${props.name}`,
            'Content-Type': 'application/json',
        }).then(res => {
            setPartner(res.data)
        })
    }
    useEffect(load, [props.name])

    const tableDict = {
        byInvoice: _ => <InvoiceTable invoices={partner.invoices} refresh={load} messageApi={messageApi} />,
        byInvoiceItem: _ => <InvoiceItemTable invoiceItems={partner.invoiceItems} refresh={load} messageApi={messageApi} />,
        byProduct: _ => <ProductTable products={partner.products} />
    }
    const tableOptions = [
        { label: '清单总览', value: 'byInvoice' },
        { label: '清单条目', value: 'byInvoiceItem' },
        { label: '产品', value: 'byProduct' },
    ]

    return partner === undefined ? null : <>
        {contextHolder}
        <Space direction='vertical' style={{ width: '100%', marginTop: '10px', marginBottom: '15px' }}>
            <Radio.Group value={tableType} onChange={e => setTableType(e.target.value)} options={tableOptions} />
            { tableDict[tableType]() }
            <Divider />
        </Space>
    </>
}