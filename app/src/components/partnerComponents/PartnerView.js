import React, { useEffect, useState } from 'react'
import { Table, Divider, Space, Radio, Tag, Modal, message, Button, Row, Col, DatePicker } from 'antd'
import Axios from 'axios'
import Decimal from 'decimal.js'
import { TableOutlined, CloseOutlined, SearchOutlined } from '@ant-design/icons'


import { baseURL, invoiceSettings, DATE_FORMAT } from '../../utils/config'
import { MyWorkBook, MyWorkSheet } from '../../utils/export'
import SalesOrderView from '../salesOrderComponents/SalesOrderView'
import SalesRefundView from '../salesRefundComponents/SalesRefundView'
import PurchaseOrderView from '../purchaseOrderComponents/PurchaseOrderView'
import PurchaseRefundView from '../purchaseRefundComponents/PurchaseRefundView'


const { Column, ColumnGroup } = Table
const { RangePicker } = DatePicker


// CONSTANT SETTINGS
const INVOICE_TYPE_2_TAG = {
    sales: { str: '销售', color: 'blue' },
    purchase: { str: '采购', color: 'gold' }
}
const INVOICE_TYPE_TAG_FILTERS = Object.keys(INVOICE_TYPE_2_TAG).map(key => 
    ({ value: key, text: INVOICE_TYPE_2_TAG[key].str })
)

// TABLE
const DEFAULT_TABLE_SETTINGS = {
    pagination: false,
    scroll: { x: 'max-content', y: 400 },
    size: 'small',
    bordered: true
}
const NUMBER_COLUMN = <Column title='序号' align='center' fixed='left' width={50} render={(_, __, idx) => idx + 1} />
const TYPE_COLUMN = <Column title='类型' dataIndex='type' align='center' fixed='right' width={80} 
    filters={INVOICE_TYPE_TAG_FILTERS} onFilter={(val, record) => val === record.type}
    render={type => <Tag color={ INVOICE_TYPE_2_TAG[type].color }>{ INVOICE_TYPE_2_TAG[type].str }</Tag> } />

// EXPORT
const INVOICE_TABLE_HEADERS = [
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
    { title: '类型', dataIndex: 'type', render: type => INVOICE_TYPE_2_TAG[type].str }
]
const INVOICE_ITEM_TABLE_HEADERS = [
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
    { title: '类型', dataIndex: 'type', render: type => INVOICE_TYPE_2_TAG[type].str }
]
const PRODUCT_TABLE_HEADERS = [
    { title: '序号', render: (_, __, idx) => idx + 1 },
    { title: '产品信息', children: [
        { title: '材质', dataIndex: 'material' },
        { title: '名称', dataIndex: 'name' },
        { title: '规格', dataIndex: 'spec' },
        { title: '单位', dataIndex: 'unit' }
    ] },
    { title: '销售信息	', children: [
        { title: '数量', dataIndex: 'salesQuantity' },
        { title: '均价', dataIndex: 'salesPrice' },
        { title: '退货数量', dataIndex: 'salesRefundQuantity' },
    ] },
    { title: '采购信息', children: [
        { title: '数量', dataIndex: 'purchaseQuantity' },
        { title: '均价', dataIndex: 'purchasePrice' },
        { title: '退货数量', dataIndex: 'purchaseRefundQuantity' },
    ] }
]
const exportExcel = (sheets, filename) => {
    const getSheet = (items, headers, summaryRow, sheetName) => {
        let ws = new MyWorkSheet(sheetName)
        ws.writeJson(items, headers)
        ws.writeRow(summaryRow)
        return ws
    }
    let wb = new MyWorkBook(filename)
    sheets.forEach(sheet => { wb.writeSheet(getSheet(...sheet)) })
    wb.save()
}

function InvoiceTable(props) {
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(undefined)
    const [selectedInvoiceType, setSelectedInvoiceType] = useState(undefined)
    const INVOICE_TYPE_2_DICT = {
        salesOrder: { str: '销售单', view: _ => <SalesOrderView id={selectedInvoiceId} messageApi={props.messageApi} refresh={props.refresh} allowEditPartner={false} /> },
        salesRefund: { str: '销售退款单', view: _ => <SalesRefundView id={selectedInvoiceId} messageApi={props.messageApi} refresh={props.refresh} allowEditPartner={false} /> },
        purchaseOrder: { str: '采购单', view: _ => <PurchaseOrderView id={selectedInvoiceId} messageApi={props.messageApi} refresh={props.refresh} allowEditPartner={false} /> },
        purchaseRefund: { str: '采购退款单', view: _ => <PurchaseRefundView id={selectedInvoiceId} messageApi={props.messageApi} refresh={props.refresh} allowEditPartner={false} /> }
    }
    const getSummary = (items) => {
        const orderAmount = items.reduce((total, cur) => total.plus(cur.orderAmount || 0), Decimal(0))
        const orderPaid = items.reduce((total, cur) => total.plus(cur.orderPrepayment || 0).plus(cur.orderPayment || 0), Decimal(0))
        const orderUnpaid = orderAmount.sub(orderPaid)
        const refundAmount = items.reduce((total, cur) => total.plus(cur.refundAmount || 0), Decimal(0))
        const refundPaid = items.reduce((total, cur) => total.plus(cur.refundPrepayment || 0).plus(cur.refundPayment || 0), Decimal(0))
        const refundUnpaid = refundAmount.sub(refundPaid)
        const summaryRow = [
            '总计', '', orderAmount.toNumber(), orderPaid.toNumber(), orderUnpaid.toNumber(),
            '', refundAmount.toNumber(), refundPaid.toNumber(), refundUnpaid.toNumber(), ''
        ]
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
                <Table.Summary.Cell index={9} align='center'>
                    <Button type='primary' ghost onClick={_ => exportExcel([[items, INVOICE_TABLE_HEADERS, summaryRow]], '清单总览')}>导出</Button>
                </Table.Summary.Cell>
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
        <Table dataSource={props.invoices} rowKey={r => r.orderId} {...DEFAULT_TABLE_SETTINGS} summary={getSummary} footer={getFooter}>
            { NUMBER_COLUMN }
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
            { TYPE_COLUMN }
        </Table>
    </>
}

function InvoiceItemTable(props) {
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(undefined)
    const [selectedInvoiceType, setSelectedInvoiceType] = useState(undefined)
    const INVOICE_TYPE_2_DICT = {
        salesOrder: { str: '销售单', view: _ => <SalesOrderView id={selectedInvoiceId} messageApi={props.messageApi} refresh={props.refresh} allowEditPartner={false} /> },
        salesRefund: { str: '销售退款单', view: _ => <SalesRefundView id={selectedInvoiceId} messageApi={props.messageApi} refresh={props.refresh} allowEditPartner={false} /> },
        purchaseOrder: { str: '采购单', view: _ => <PurchaseOrderView id={selectedInvoiceId} messageApi={props.messageApi} refresh={props.refresh} allowEditPartner={false} /> },
        purchaseRefund: { str: '采购退款单', view: _ => <PurchaseRefundView id={selectedInvoiceId} messageApi={props.messageApi} refresh={props.refresh} allowEditPartner={false} /> }
    }

    const ifShowMaterial = invoiceSettings.get('ifShowMaterial') === 'true'
    const ifShowDiscount = invoiceSettings.get('ifShowDiscount') === 'true'

    const getSummary = (items) => {
        const orderOriginalAmount = items.reduce((total, cur) => total.plus(cur.orderOriginalAmount || 0), Decimal(0))
        const orderAmount = items.reduce((total, cur) => total.plus(cur.orderAmount || 0), Decimal(0))
        const refundOriginalAmount = items.reduce((total, cur) => total.plus(cur.refundOriginalAmount || 0), Decimal(0))
        const refundAmount = items.reduce((total, cur) => total.plus(cur.refundAmount || 0), Decimal(0))
        const summaryRow = [
            '总计', '', '', '', '', '', '', '', orderOriginalAmount.toNumber(), '', orderAmount.toNumber(), '',
            '', '', refundOriginalAmount.toNumber(), refundAmount.toNumber(), '', ''
        ]
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
                        <Button type='primary' ghost onClick={_ => exportExcel([[items, INVOICE_ITEM_TABLE_HEADERS, summaryRow]], '清单条目')}>导出</Button>
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
                    <Button onClick={_ => exportExcel([[items, INVOICE_ITEM_TABLE_HEADERS, summaryRow]], '清单条目')}>导出</Button>
                </Table.Summary.Cell>
            </Table.Summary.Row>
        </Table.Summary>
    }
    const getFooter = () => {
        return '注意：当“销售单”与“采购单”混合显示时，总计金额不能代表实际金额，请筛选后再查看。'
    }

    return <>
        <Modal title={selectedInvoiceType ? `${INVOICE_TYPE_2_DICT[selectedInvoiceType].str} (${selectedInvoiceId})` : ''} 
            open={selectedInvoiceId !== undefined} onCancel={_ => setSelectedInvoiceId(undefined)} width={900} footer={null} destroyOnClose>
            { selectedInvoiceType ? INVOICE_TYPE_2_DICT[selectedInvoiceType].view() : null }
        </Modal>
        <Table dataSource={props.invoiceItems} {...DEFAULT_TABLE_SETTINGS} rowKey={r => r.orderId + r.productId} footer={getFooter} summary={getSummary}>
            { NUMBER_COLUMN }
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
            { TYPE_COLUMN }
        </Table>
    </>
}

function ProductTable(props) {
    const getFooter = () => {
        return <Row style={{ justifyContent: 'space-between' }}>
            <span>注意：表格中显示的“数量”是减去“退货数量”之后的值。</span>
            <Button type='primary' ghost onClick={_ => exportExcel([[props.products, PRODUCT_TABLE_HEADERS]], '产品')}>导出</Button>
        </Row>
    }
    return <Table dataSource={props.products} {...DEFAULT_TABLE_SETTINGS} rowKey={r => r.id} footer={getFooter}>
        { NUMBER_COLUMN }
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
    Required: name, dismiss, refresh
*/
export default function PartnerView(props) {
    const [partner, setPartner] = useState(undefined)
    const [dataRange, setDataRange] = useState(null)
    const [tableType, setTableType] = useState('byInvoice')
    const [messageApi, contextHolder] = message.useMessage()

    const load = () => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: `/partner/summary`,
            params: {
                name: props.name,
                startDate: dataRange ? dataRange[0]?.format(DATE_FORMAT) ?? null : null,
                endDate: dataRange ? dataRange[1]?.format(DATE_FORMAT) ?? null : null
            },
            'Content-Type': 'application/json',
        }).then(res => {
            const data = res.data
            data.invoiceItems = processInvoiceItems(data.invoiceItems)
            setPartner(data)
        })
    }
    useEffect(load, [props.name])

    // Table
    const tableDict = {
        byInvoice: _ => <InvoiceTable invoices={partner.invoices} refresh={_ => { load(); props.refresh() }} messageApi={messageApi} />,
        byInvoiceItem: _ => <InvoiceItemTable invoiceItems={partner.invoiceItems} refresh={_ => { load(); props.refresh() }} messageApi={messageApi} />,
        byProduct: _ => <ProductTable products={partner.products} />
    }
    const tableOptions = [
        { label: '清单总览', value: 'byInvoice' },
        { label: '清单条目', value: 'byInvoiceItem' },
        { label: '产品', value: 'byProduct' }
    ]
    const processInvoiceItems = (invoiceItems) => {
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
    const exportAll = () => {
        const invoiceSR = (items => {
            const orderAmount = items.reduce((total, cur) => total.plus(cur.orderAmount || 0), Decimal(0))
            const orderPaid = items.reduce((total, cur) => total.plus(cur.orderPrepayment || 0).plus(cur.orderPayment || 0), Decimal(0))
            const orderUnpaid = orderAmount.sub(orderPaid)
            const refundAmount = items.reduce((total, cur) => total.plus(cur.refundAmount || 0), Decimal(0))
            const refundPaid = items.reduce((total, cur) => total.plus(cur.refundPrepayment || 0).plus(cur.refundPayment || 0), Decimal(0))
            const refundUnpaid = refundAmount.sub(refundPaid)
            return [
                '总计', '', orderAmount.toNumber(), orderPaid.toNumber(), orderUnpaid.toNumber(),
                '', refundAmount.toNumber(), refundPaid.toNumber(), refundUnpaid.toNumber(), ''
            ]
        })(partner.invoices)
        const getSum = (key, items) => {
            return items.reduce((total, item) => total.plus(item[key] || 0), Decimal(0)).toNumber()
        }
        const invoiceItemsSR = (items => [
            '总计', '', '', '', '', '', '', '', 
            getSum('orderOriginalAmount', items), '', getSum('orderAmount', items), '',
            '', '', getSum('refundOriginalAmount', items), getSum('refundAmount', items), '', ''
        ])(partner.invoiceItems)
        exportExcel([
            [partner.invoices, INVOICE_TABLE_HEADERS, invoiceSR, '清单总览'],
            [partner.invoiceItems, INVOICE_ITEM_TABLE_HEADERS, invoiceItemsSR, '清单条目'],
            [partner.products, PRODUCT_TABLE_HEADERS, null, '产品']
        ], partner.name)
    }

    return partner === undefined ? null : <>
        {contextHolder}
        <Space direction='vertical' style={{ width: '100%', marginTop: '10px', marginBottom: '15px' }}>
            <Row>
                <Col span={8}>姓名：{partner.name}</Col>
                <Col span={8}>电话：{partner.phone || '无'}</Col>
                <Col span={8}>文件位置：{partner.folder || '无'}</Col>
            </Row>
            <Row>
                <Col span={24}>地址：{partner.address || '无'}</Col>
            </Row>
        </Space>
        
        <Row style={{ marginBottom: '10px' }} align='middle'>
            <Col span={12} align='left'>
                销售/采购单：
                <Space.Compact>
                    <RangePicker allowEmpty={[true, true]} onChange={val => setDataRange(val)} />
                    <Button icon={<SearchOutlined />} onClick={load} />
                </Space.Compact>
            </Col>
            <Col span={12} align='right'>
                <Radio.Group value={tableType} onChange={e => setTableType(e.target.value)} options={tableOptions} />
            </Col>
        </Row>
        { tableDict[tableType]() }
        
        <Divider />
        
        <Row align='end'>
            <Space>
                <Button icon={<TableOutlined />} type='primary' ghost onClick={exportAll}>全部导出</Button>
                <Button icon={<CloseOutlined />} onClick={props.dismiss}>关闭</Button>
            </Space>
        </Row>
    </>
}