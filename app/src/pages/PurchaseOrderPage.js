import React, { useEffect, useState } from 'react'
import Axios from 'axios'
import { Table, Modal, Button, Space, message, Form, Tag } from 'antd'
import { Decimal } from 'decimal.js'
import { ExclamationCircleFilled } from '@ant-design/icons'


const { confirm } = Modal


import { baseURL, DATE_FORMAT, DEFAULT_PAGINATION, DELIVER_COLORS, invoiceSettings } from '../utils/config'
import { exportExcel, getExportData } from '../utils/export'
import InvoiceSearchBox from '../components/invoice/SearchBox'
import PurchaseOrderView from '../components/invoice/purchaseOrder/PurchaseOrderView'
import PurchaseRefundView from '../components/invoice/purchaseRefund/PurchaseRefundView'
import MyFloatButton from '../components/common/MyFloatButton'


/*
    Required: drafts, setDrafts
*/
function PurchaseOrderPage(props) {
    const [purchaseOrders, setPurchaseOrders] = useState([])
    const [filteredPurchaseOrders, setFilteredPurchaseOrders] = useState([])
    const [form] = Form.useForm()

    const [selectedOrderId, setSelectedOrderId] = useState(undefined)
    const [selectedRefundId, setSelectedRefundId] = useState(undefined)
    const [messageApi, contextHolder] = message.useMessage()


    // load (table data)
    const load = () => {
        setPurchaseOrders([])
        setFilteredPurchaseOrders([])
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: 'purchaseOrder',
            'Content-Type': 'application/json',
        }).then(res => {
            const orders = res.data.map(order => {
                order.paid = Decimal(order.payment).plus(order.prepayment).toNumber()
                order.unpaid = Decimal(order.amount).minus(order.paid).toNumber()
                return order
            })
            setPurchaseOrders(orders)
            filterPurchaseOrders(orders)
        }).catch(_ => { })
    }

    const getTableColumns = () => {
        const ifShowDelivered = invoiceSettings.get('ifShowDelivered') == 'true'
        const amountSign = invoiceSettings.get('ifShowAmountSign') == 'true' ? invoiceSettings.get('amountSign') : ''
        return [
            { title: '序号', align: 'center', render: (_, __, idx) => idx + 1, fixed: 'left' },
            { title: '单号', dataIndex: 'id', align: 'center', render: id => <a onClick={_ => setSelectedOrderId(id)}>{id}</a> },
            { title: '供应商', dataIndex: 'partner', align: 'center' },
            { title: '日期', dataIndex: 'date', align: 'center' },
            { title: '金额', dataIndex: 'amount', align: 'center', render: amount => amountSign + amount.toLocaleString() },
            { title: '已付', dataIndex: 'paid', align: 'center', render: paid => amountSign + paid.toLocaleString() },
            { title: '未付', dataIndex: 'unpaid', align: 'center', render: unpaid => 
                <span style={{ color: unpaid === 0 ? 'black' : 'red' }}>{amountSign + unpaid.toLocaleString()}</span>
            },
            ifShowDelivered ? { 
                title: '配送情况', dataIndex: 'delivered', align: 'center', render: d => <Tag color={DELIVER_COLORS[d]}>{d}</Tag> 
            } : null,
            { title: '关联退货单', dataIndex: 'refundId', align: 'center', render: id => id ? <a onClick={_ => setSelectedRefundId(id)}>{id}</a> : null },
            { title: '操作', align: 'center', fixed: 'right', render: (_, record) => (
                <Space.Compact>
                    <Button onClick={_ => showDeleteConfirm([record.id])} danger>删除</Button>
                </Space.Compact>
            ) }
        ].filter(i => i != null)
    }

    // delete
    const showDeleteConfirm = (orderIds) => {
        const title = orderIds.length === 1 ? `是否删除采购清单 ${orderIds[0]} ?` : `是否删除 ${orderIds.length} 张采购清单?`
        confirm({
            title: title, icon: <ExclamationCircleFilled />,
            content: '确认删除后不可撤销，同时仓库中产品的库存会相应减少',
            okText: '删除', okType: 'danger', cancelText: '取消',
            onOk() {
                Axios({
                    method: 'delete',
                    baseURL: baseURL(),
                    url: `purchaseOrder`,
                    data: { ids: orderIds },
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

    // search (filter)
    const filterPurchaseOrders = (purchaseOrders) => {
        const conds = form.getFieldsValue()
        setFilteredPurchaseOrders(purchaseOrders.filter(o => 
            (!conds.orderId || o.id.includes(conds.orderId)) &&
            (!conds.date || !conds.date[0] || o.date >= conds.date[0].format(DATE_FORMAT)) &&
            (!conds.date || !conds.date[1] || o.date <= conds.date[1].format(DATE_FORMAT)) &&
            (!conds.partner || o.partner.includes(conds.partner)) &&
            (!conds.delivered || conds.delivered.length === 0 || conds.delivered.includes(o.delivered)) &&
            (!conds.refundId || (o.refundId != null && o.refundId.includes(conds.refundId)))
        ))
    }

    // export
    const exportPurchaseOrders = () => {
        const orderTableColumns = [
            { title: '单号', dataIndex: 'id', summary: '总计' },
            { title: '供应商', dataIndex: 'partner' },
            { title: '日期', dataIndex: 'date' },
            { title: '金额', dataIndex: 'amount', summary: 'sum' },
            { title: '订金', dataIndex: 'prepayment', summary: 'sum' },
            { title: '尾款', dataIndex: 'payment', summary: 'sum' },
            { title: '已付', dataIndex: 'paid', summary: 'sum' },
            { title: '未付', dataIndex: 'unpaid', summary: 'sum' },
            { title: '配送情况', dataIndex: 'delivered' },
            { title: '关联退货单', dataIndex: 'refundId' }
        ]
        exportExcel('采购单', getExportData(orderTableColumns, filteredPurchaseOrders))
    }

    useEffect(load, [])

    return <>
        {contextHolder}
        <MyFloatButton type='purchaseOrder' refresh={load} drafts={props.drafts} setDrafts={props.setDrafts} />

        <Modal title={`采购清单 (${selectedOrderId})`} open={selectedOrderId !== undefined} width={900} destroyOnClose 
            onCancel={_ => setSelectedOrderId(undefined)} footer={null} maskClosable={false}>
            <PurchaseOrderView id={selectedOrderId} refresh={load} messageApi={messageApi} allowEditPartner={true} />
        </Modal>

        <Modal title={`采购退货单 (${selectedRefundId})`} open={selectedRefundId !== undefined} width={900} destroyOnClose 
            onCancel={_ => setSelectedRefundId(undefined)} footer={null} maskClosable={false}>
            <PurchaseRefundView id={selectedRefundId} refresh={load} messageApi={messageApi} />
        </Modal>

        <br />
        <InvoiceSearchBox data={purchaseOrders} setFilteredData={setFilteredPurchaseOrders} type='purchaseOrder' />
        <br />
        <Table dataSource={filteredPurchaseOrders} bordered size='middle' rowKey={record => record.id} 
        columns={getTableColumns()} pagination={DEFAULT_PAGINATION} scroll={{ x: 'max-content' }} />
    </>
}


export default PurchaseOrderPage