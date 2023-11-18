import React, { useState, useEffect } from 'react'
import Axios from 'axios'
import { Table, Space, Button, message, Modal, Form, Row, Input, DatePicker, Card } from 'antd'
import Decimal from 'decimal.js'
import { ExclamationCircleFilled, DeleteOutlined, TableOutlined, SearchOutlined } from '@ant-design/icons'


const { confirm } = Modal
const { Item } = Form
const { RangePicker } = DatePicker


import { baseURL, DATE_FORMAT, DEFAULT_PAGINATION } from '../utils/config'
import { exportExcel, getExportData } from '../utils/export'
import PurchaseRefundView from '../components/purchaseRefundComponents/PurchaseRefundView'
import PurchaseOrderView from '../components/purchaseOrderComponents/PurchaseOrderView'
import MyFloatButton from '../components/common/MyFloatButton'


/*
    Required: drafts, setDrafts
*/
function PurchaseRefundPage(props) {
    const [purchaseRefunds, setPurchaseRefunds] = useState([])
    const [filteredPurchaseRefunds, setFilteredPurchaseRefunds] = useState([])
    const [form] = Form.useForm()

    const [selectedRefundId, setSelectedRefundId] = useState(undefined)
    const [selectedOrderId, setSelectedOrderId] = useState(undefined)

    const [messageApi, contextHolder] = message.useMessage()
    const itemStyle = { marginTop: '8px', marginBottom: '8px', marginLeft: '10px', marginRight: '10px' }
    
    // load
    const load = () => {
        setPurchaseRefunds([])
        setFilteredPurchaseRefunds([])
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: 'purchaseRefund',
            'Content-Type': 'application/json',
        }).then(res => {
            const refunds = res.data.map(r => {
                r.unpaid = Decimal(r.amount).minus(r.payment).toNumber()
                return r
            })
            setPurchaseRefunds(refunds)
            filterPurchaseRefunds(refunds)
        }).catch(_ => { })
    }

    const getTableColumns = () => {
        return [
            { title: '序号', align: 'center', render: (_, __, idx) => idx + 1, fixed: 'left' },
            { title: '单号', dataIndex: 'id', align: 'center', render: id => <a onClick={_ => setSelectedRefundId(id)}>{id}</a> },
            { title: '供应商', dataIndex: 'partner', align: 'center' },
            { title: '日期', dataIndex: 'date', align: 'center' },
            { title: '金额', dataIndex: 'amount', align: 'center', render: amount => amount.toLocaleString() },
            { title: '已付', dataIndex: 'payment', align: 'center', render: payment => payment.toLocaleString() },
            { title: '未付', dataIndex: 'unpaid', align: 'center', render: unpaid => <span style={{ color: unpaid === 0 ? 'black' : 'red' }}>{unpaid.toLocaleString()}</span> },
            { title: '配送情况', dataIndex: 'delivered', align: 'center' },
            { title: '关联采购单', dataIndex: 'orderId', align: 'center', render: id => <a onClick={_ => setSelectedOrderId(id)}>{id}</a> },
            { title: '操作', align: 'center', fixed: 'right', render: (_, record) => 
                <Space.Compact>
                    <Button onClick={_ => showDeleteConfirm([record.id])} danger>删除</Button>
                 </Space.Compact>
            }
        ]
    }

    // delete
    const showDeleteConfirm = (refundIds) => {
        const title = refundIds.length === 1 ? `是否删除采购退货单 ${refundIds[0]} ?` : `是否删除 ${refundIds.length} 张采购退货单?`
        confirm({
            title: title, icon: <ExclamationCircleFilled />,
            content: '确认删除后不可撤销，同时仓库中产品的库存会相应减少',
            okText: '删除', okType: 'danger', cancelText: '取消',
            onOk() {
                Axios({
                    method: 'delete',
                    baseURL: baseURL(),
                    url: `purchaseRefund`,
                    data: { ids: refundIds },
                    'Content-Type': 'application/json',
                }).then(_ => {
                    load()
                    messageApi.open({ type: 'success', content: '删除成功', })
                }).catch(_ => {
                    messageApi.open({ type: 'error', content: '删除失败', })
                })
            }
        })
    }

    // search (filter)
    const filterPurchaseRefunds = (purchaseRefunds) => {
        const conds = form.getFieldsValue()
        setFilteredPurchaseRefunds(purchaseRefunds.filter(o => 
            (!conds.refundId || o.id.includes(conds.refundId)) &&
            (!conds.date || !conds.date[0] || o.date >= conds.date[0].format(DATE_FORMAT)) &&
            (!conds.date || !conds.date[1] || o.date <= conds.date[1].format(DATE_FORMAT)) &&
            (!conds.partner || o.partner.includes(conds.partner)) &&
            (!conds.orderId || (o.orderId != null && o.orderId.includes(conds.orderId)))
        ))
    }

    // export
    const exportPurchaseRefunds = () => {
        const purchaseTableColumns = [
            { title: '单号', dataIndex: 'id' },
            { title: '供应商', dataIndex: 'partner' },
            { title: '日期', dataIndex: 'date' },
            { title: '金额', dataIndex: 'amount' },
            { title: '已付', dataIndex: 'payment' },
            { title: '未付', dataIndex: 'unpaid' },
            { title: '配送情况', dataIndex: 'delivered' },
            { title: '关联采购单', dataIndex: 'orderId' }
        ]
        exportExcel('采购退货单', getExportData(purchaseTableColumns, filteredPurchaseRefunds))
    }

    useEffect(load, [])

    return <>
        {contextHolder}
        <MyFloatButton type='purchaseRefund' refresh={load} drafts={props.drafts} setDrafts={props.setDrafts} />

        <Modal title={`采购退货单 (${selectedRefundId})`} open={selectedRefundId !== undefined} width={900} destroyOnClose 
            onCancel={_ => setSelectedRefundId(undefined)} footer={null} maskClosable={false}>
            <PurchaseRefundView id={selectedRefundId} refresh={load} messageApi={messageApi} />
        </Modal>

        <Modal title={`采购清单 (${selectedOrderId})`} open={selectedOrderId !== undefined} width={900} destroyOnClose 
            onCancel={_ => setSelectedOrderId(undefined)} footer={null} maskClosable={false}>
            <PurchaseOrderView id={selectedOrderId} refresh={load} messageApi={messageApi} />
        </Modal>

        <br />
        <Space direction='vertical' style={{ width: '100%' }}>
            {/* Function Box */}
            <Card size='small'><Form form={form} onFinish={_ => filterPurchaseRefunds(purchaseRefunds)}><Row>
                <Item label='单号' name='refundId' style={itemStyle}><Input allowClear placeholder='单号' /></Item>
                <Item label='供应商' name='partner' style={itemStyle}><Input allowClear placeholder='供应商' /></Item>
                <Item label='日期' name='date' style={itemStyle}><RangePicker format={DATE_FORMAT} allowEmpty={[true, true]} /></Item>
                <Item label='采购单号' name='orderId' style={itemStyle}><Input allowClear placeholder='采购单号' /></Item>
                <Space wrap style={itemStyle}>
                    <Button icon={<SearchOutlined />} type='primary' htmlType='submit'>搜索</Button>
                    <Button icon={<TableOutlined />} onClick={exportPurchaseRefunds} disabled={filteredPurchaseRefunds.length === 0}>批量导出</Button>
                    <Button danger icon={<DeleteOutlined />} onClick={_ => showDeleteConfirm(filteredPurchaseRefunds.map(f => f.id) || [])} disabled={filteredPurchaseRefunds.length === 0}>批量删除</Button>
                </Space>
            </Row></Form></Card>

            {/* Purchase Refund Table */}
            <Table dataSource={filteredPurchaseRefunds} size='middle' rowKey={record => record.id} 
                bordered columns={getTableColumns()} pagination={DEFAULT_PAGINATION} scroll={{ x: 'max-content' }} />
        </Space>
    </>
}


export default PurchaseRefundPage