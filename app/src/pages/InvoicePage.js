import React, { useEffect, useState } from 'react'
import Axios from 'axios'
import { Table, Modal, Button, Space, message, Tag } from 'antd'
import { Decimal } from 'decimal.js'
import { ExclamationCircleFilled } from '@ant-design/icons'


const { confirm } = Modal


import { baseURL, DEFAULT_PAGINATION, DELIVER_COLORS, invoiceSettings } from '../utils/config'
import { exportExcel, getExportData } from '../utils/export'
import InvoiceSearchBox from '../components/invoice/SearchBox'
import MyFloatButton from '../components/common/MyFloatButton'
import InvoiceFullView from '../components/invoice/InvoiceFullView'


/*
    Required: type
*/
export default function InvoicePage(props) {
    const [invoices, setInvoices] = useState([])
    const [filteredInvoices, setFilteredInvoices] = useState([])
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(undefined)
    const [messageApi, contextHolder] = message.useMessage()

    const isOrder = ['salesOrder', 'purchaseOrder'].includes(props.type)
    const isSales = ['salesOrder', 'salesRefund'].includes(props.type)
    const partnerTitle = isSales ? '客户' : '供应商'
    const relatedInvoiceTitle = isOrder ? '关联退货单' : ( isSales ? '关联销售单' : '关联采购单' )
    const relatedInvoiceDataIndex = isOrder ? 'refundId' : 'orderId'

    const load = () => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: props.type,
            'Content-Type': 'application/json',
        }).then(res => {
            const newInvoices = res.data.map(invoice => {
                invoice.paid = Decimal(invoice.payment).plus(invoice.prepayment).toNumber()
                invoice.unpaid = Decimal(invoice.amount).minus(invoice.paid).toNumber()
                return invoice
            })
            setInvoices(newInvoices)
        }).catch(_ => { })
    }

    const getTableColumns = () => {
        const ifShowDelivered = invoiceSettings.get('ifShowDelivered') == 'true'
        const amountSign = invoiceSettings.get('ifShowAmountSign') === 'true' ? invoiceSettings.get('amountSign') : ''
        return [
            { title: '序号', align: 'center', render: (_, __, idx) => idx + 1, fixed: 'left' },
            { title: '单号', dataIndex: 'id', align: 'center', render: id => <a onClick={_ => setSelectedInvoiceId(id)}>{id}</a> },
            { title: partnerTitle, dataIndex: 'partner', align: 'center' },
            { title: '日期', dataIndex: 'date', align: 'center' },
            { title: '金额', dataIndex: 'amount', align: 'center', render: amount => amountSign + amount.toLocaleString() },
            { title: '已付', dataIndex: 'paid', align: 'center', render: paid => amountSign + paid.toLocaleString() },
            { title: '未付', dataIndex: 'unpaid', align: 'center', render: unpaid => 
                <span style={{ color: unpaid === 0 ? 'black' : 'red' }}>{amountSign + unpaid.toLocaleString()}</span>
            },
            ifShowDelivered ? { 
                title: '配送情况', dataIndex: 'delivered', align: 'center', render: d => <Tag color={DELIVER_COLORS[d]}>{d}</Tag>
            } : null,
            { title: relatedInvoiceTitle, dataIndex: relatedInvoiceDataIndex, align: 'center', render: id => id ? <a onClick={_ => setSelectedInvoiceId(id)}>{id}</a> : null },
            { title: '操作', align: 'center', fixed: 'right', render: (_, record) => (
                <Space.Compact>
                    <Button onClick={_ => showDeleteConfirm([record.id])} danger>删除</Button>
                </Space.Compact>
            ) }
        ].filter(i => i != null)
    }

    const showDeleteConfirm = (invoiceIds) => {
        const invoiceName = {
            'salesOrder': '销售清单',
            'purchaseOrder': '采购清单',
            'salesRefund': '销售退货单',
            'purchaseRefund': '采购退货单'
        }[props.type]
        const title = invoiceIds.length === 1 ? `是否删除${invoiceName} ${invoiceIds[0]} ?` : `是否删除 ${invoiceIds.length} 张${invoiceName}?`
        confirm({
            title: title, icon: <ExclamationCircleFilled />,
            content: '确认删除后不可撤销，同时仓库中产品的库存会相应恢复。',
            okText: '删除', okType: 'danger', cancelText: '取消',
            onOk() {
                Axios({
                    method: 'delete',
                    baseURL: baseURL(),
                    url: props.type,
                    data: { ids: invoiceIds },
                    'Content-Type': 'application/json',
                }).then(_ => {
                    load()
                    messageApi.open({ type: 'success', content: '删除成功' })
                }).catch(_ => {
                    messageApi.open({ type: 'error', content: '删除失败' })
                })
            }
        })
    }

    // export
    // const exportSalesOrders = () => {
    //     const orderTableColumns = [
    //         { title: '单号', dataIndex: 'id', summary: '总计' },
    //         { title: '客户', dataIndex: 'partner' },
    //         { title: '日期', dataIndex: 'date' },
    //         { title: '金额', dataIndex: 'amount', summary: 'sum' },
    //         { title: '订金', dataIndex: 'prepayment', summary: 'sum' },
    //         { title: '尾款', dataIndex: 'payment', summary: 'sum' },
    //         { title: '已付', dataIndex: 'paid', summary: 'sum' },
    //         { title: '未付', dataIndex: 'unpaid', summary: 'sum' },
    //         { title: '配送情况', dataIndex: 'delivered' },
    //         { title: '关联退货单', dataIndex: 'refundId' }
    //     ]
    //     exportExcel('销售单', getExportData(orderTableColumns, filteredInvoices))
    // }


    useEffect(load, [props.type])

    return <>
        { contextHolder }
        <MyFloatButton type={props.type} refresh={load} />

        <Modal title={null} open={selectedInvoiceId} width={900} destroyOnClose 
            onCancel={_ => setSelectedInvoiceId(undefined)} footer={null} maskClosable={false}>
            <InvoiceFullView id={selectedInvoiceId} refresh={load} messageApi={messageApi} allowEditPartner={true} />
        </Modal>

        <br />
        <InvoiceSearchBox data={invoices} setFilteredData={setFilteredInvoices} type={props.type} />
        <br />
        <Table dataSource={filteredInvoices} bordered rowKey={record => record.id} size='middle'
        columns={getTableColumns()} pagination={DEFAULT_PAGINATION} scroll={{ x: 'max-content' }} />
    </>
}
