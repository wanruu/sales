import React from 'react'
import Decimal from 'decimal.js'
import { Table, Col, Row, Divider, Space, Popover, Tag, Button } from 'antd'
import _ from 'lodash'
import { EditOutlined, PrinterOutlined } from '@ant-design/icons'


import { invoiceSettings, DELIVER_COLORS, DATE_FORMAT } from '../../utils/config'
import PartnerPopoverView from '../partner/PartnerPopoverView'


/*
    Required: type, invoice (refund的话items需要过滤quantity不为null), setMode
    Optional: allowEditPartner (false by default), refresh (required if allowEditPartner=true),
        allowEdit (true by default), allowPrint (true by default), 
        setMode (required if allowEdit=true or allowPrint=true)
*/
export default function InvoiceView(props) {
    const isSales = ['salesOrder', 'salesRefund'].includes(props.type)
    const isRefund = ['salesRefund', 'purchaseRefund'].includes(props.type)


    // const getInvoiceExportColumns = (type) => {
    //     const ifShowMaterial = invoiceSettings.get('ifShowMaterial') === 'true'
    //     const ifShowDiscount = invoiceSettings.get('ifShowDiscount') === 'true'
    //     const ifShowWeight = type === 'purchaseOrder'
    //     const isRefund = type === 'salesRefund' || type === 'purchaseRefund'
    //     return [
    //         { title: '序号', onExport: (_,__,idx) => idx+1, summary: '总计'},
    //         ifShowMaterial ? { title: '材质', dataIndex: 'material' } : null,
    //         { title: '名称', dataIndex: 'name' },
    //         { title: '规格', dataIndex: 'spec' },
    //         { title: '数量', dataIndex: 'quantity' },
    //         { title: '单位', dataIndex: 'unit' },
    //         { title: '单价', dataIndex: 'price' },
    //         ifShowDiscount ? { title: '金额', dataIndex: 'originalAmount', summary: 'sum' } : null,
    //         ifShowDiscount ? { title: '折扣', dataIndex: 'discount', onExport: d => `${d}%` } : null,
    //         { title: ifShowDiscount ? '折后价' : '金额', dataIndex: 'amount', summary: 'sum' },
    //         ifShowWeight ? { title: '重量', dataIndex: 'weight' } : null,
    //         { title: '备注', dataIndex: 'remark' },
    //         { title: '配送', dataIndex: 'delivered', onExport: d => d ? '已配送' : '未配送' },
    //         isRefund ? null : { title: '退货状态', width: 75, onExport: (_, record) => 
    //             Decimal(record.refundQuantity || 0).equals(record.quantity) ? '全部退货' :
    //             (Decimal(record.refundQuantity || 0).gt(record.quantity) ? '退货超数' : (
    //             Decimal(record.refundQuantity || 0).equals(0) ? null : '部分退货'
    //         )) }
    //     ].filter(i => i != null)
    // }

    // const exportFile = () => {
    //     const itemColumns = getInvoiceExportColumns('salesOrder')
    //     exportExcel(`销售单${props.order.id}`, getExportData(itemColumns, props.order.items))
    // }
    const getColumns = () => {
        const ifShowMaterial = invoiceSettings.get('ifShowMaterial') === 'true'
        const ifShowDiscount = invoiceSettings.get('ifShowDiscount') === 'true'
        const ifShowDelivered = invoiceSettings.get('ifShowDelivered') === 'true'
        const amountSign = invoiceSettings.get('ifShowAmountSign') === 'true' ? invoiceSettings.get('amountSign') : null
        const ifShowWeight = props.type === 'purchaseOrder'
        return [
            { title: '', align: 'center', width: 30, fixed: 'left', render: (_, __, idx) => idx + 1 },
            ifShowMaterial ? { title: '材质', dataIndex: 'material', align: 'center', width: 50 } : null,
            { title: '名称', dataIndex: 'name', align: 'center', width: 120 },
            { title: '规格', dataIndex: 'spec', align: 'center', width: 70 },
            { title: '数量', dataIndex: 'quantity', align: 'center', width: 70, render: q => q.toLocaleString() },
            { title: '单位', dataIndex: 'unit', align: 'center', width: 50 },
            {
                title: '单价', dataIndex: 'price', align: 'center', width: 70, render: p =>
                    amountSign + p.toLocaleString()
            },
            ifShowDiscount ? {
                title: '金额', dataIndex: 'originalAmount', align: 'center', width: 80, render: a =>
                    amountSign + a.toLocaleString()
            } : null,
            ifShowDiscount ? { title: '折扣', dataIndex: 'discount', align: 'center', width: 50, render: discount => `${discount}%` } : null,
            {
                title: ifShowDiscount ? '折后价' : '金额', dataIndex: 'amount', align: 'center', width: 80, render: d =>
                    amountSign + d.toLocaleString()
            },
            ifShowWeight ? {
                title: '重量', dataIndex: 'weight', align: 'center', width: 80, render: w => w ? w.toLocaleString() : w
            } : null,
            { title: '备注', dataIndex: 'remark', align: 'center', width: 160 },
            ifShowDelivered ? {
                title: '配送', dataIndex: 'delivered', align: 'center', width: 60, fixed: 'right', render: delivered => {
                    const text = delivered ? '已配送' : '未配送'
                    return <Tag color={DELIVER_COLORS[text]}>{text}</Tag>
                }
            } : null,
            isRefund ? null : {
                title: '退货状态', align: 'center', width: 75, fixed: 'right', render: (_, record) =>
                    <Popover trigger='click' content={
                        <Space direction='vertical'>
                            <span>退货数量：{(record.refundQuantity || 0).toLocaleString()}</span>
                            {ifShowDiscount ? <span>金额：{(record.refundOriginalAmount || 0).toLocaleString()}</span> : null}
                            <span>{ifShowDiscount ? '折后价：' : '金额：'}{(record.refundAmount || 0).toLocaleString()}</span>
                        </Space>
                    }>
                        <a>{Decimal(record.refundQuantity || 0).equals(record.quantity) ? '全部退货' :
                            (Decimal(record.refundQuantity || 0).gt(record.quantity) ? '退货超数' : (
                                Decimal(record.refundQuantity || 0).equals(0) ? null : '部分退货'
                            ))
                        }</a>
                    </Popover>
            }
        ].filter(i => i != null)
    }

    return (<>
        <Space direction='vertical' style={{ width: '100%', marginTop: '10px', marginBottom: '15px' }}>
            <Row>
                <Col span={8}>{isSales ? '客户' : '供应商'}：
                    {
                        props.allowEditPartner === true ?
                            <PartnerPopoverView refresh={props.refresh}
                                partner={_.fromPairs(['name', 'folder', 'phone', 'address'].map(key => [key, props.invoice[key]]))} />
                            : props.invoice.partner
                    }
                </Col>
                <Col span={8}>日期：{
                    typeof (props.invoice.date) === 'string' ? props.invoice.date : props.invoice.date.format(DATE_FORMAT)
                }</Col>
                {
                    isRefund ?
                        <Col span={8}>关联{isSales ? '销售' : '采购'}单：{props.invoice.orderId || '无'}</Col> :
                        <Col span={8}>关联退货单：{props.invoice.refundId || '无'}</Col>
                }
            </Row>
            <Row>
                <Col span={8}>总金额：{(props.invoice.amount || 0).toLocaleString()}</Col>
                {
                    invoiceSettings.get('ifShowPayment') === 'true' ?
                        <>
                            <Col span={8}>
                                已付： {(props.invoice.paid || 0).toLocaleString()}
                                {
                                    isRefund ? null :
                                        <>（订金：{(props.invoice.prepayment || 0).toLocaleString()}，尾款：{(props.invoice.payment || 0).toLocaleString()}）</>
                                }
                            </Col>
                            <Col span={8}>未付：
                                <span style={{ color: props.invoice.unpaid === 0 ? 'black' : 'red' }}>
                                    {(props.invoice.unpaid || 0).toLocaleString()}
                                </span>
                            </Col>
                        </> : null
                }
            </Row>
        </Space>

        <Table dataSource={props.invoice.items.filter(item => item.quantity != null)} columns={getColumns()}
            size='small' bordered style={{ height: 400 }} scroll={{ x: 'max-content', y: 400 }} pagination={false}
            rowKey={record => record.id || record.refundItemId} />
        <Divider />

        <Col align='end'>
            <Space>
                {
                    props.allowEdit === false ? null :
                        <Button icon={<EditOutlined />} type='primary' onClick={_ => props.setMode('edit')}>编辑</Button>
                }
                {/* <Button icon={<TableOutlined/>} onClick={exportFile}>导出</Button> */}
                {
                    props.allowPrint === false ? null :
                        <Button icon={<PrinterOutlined />} onClick={_ => props.setMode('print')}>打印预览</Button>
                }
            </Space>
        </Col>
    </>)
}