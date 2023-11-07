import React, { useEffect, useState } from 'react'
import Axios from 'axios'
import { Table, Modal, Button, Space, message, Input, Form, DatePicker, Row, Card } from 'antd'
import { Decimal } from 'decimal.js'
import { ExclamationCircleFilled, TableOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'


const { confirm } = Modal
const { Item } = Form
const { RangePicker } = DatePicker


import SalesOrderFB from '../components/salesOrderComponents/SalesOrderFB'
import SalesOrderPreview from '../components/salesOrderComponents/SalesOrderPreview'
import SalesOrderEditView from '../components/salesOrderComponents/SalesOrderEditView'
import { baseURL, dateFormat } from '../utils/config'
import { exportExcel, getExportData } from '../utils/export'


function SalesOrderPage() {
    const [salesOrders, setSalesOrders] = useState([])
    const [filteredSalesOrders, setFilteredSalesOrders] = useState([])
    const [form] = Form.useForm()

    const [previewOrderId, setPreviewOrderId] = useState(undefined)
    const [editOrderId, setEditOrderId] = useState(undefined)
    const [messageApi, contextHolder] = message.useMessage()
    const itemStyle = { marginTop: '8px', marginBottom: '8px', marginLeft: '10px', marginRight: '10px' }

    // load (table data)
    const load = () => {
        setSalesOrders([])
        setFilteredSalesOrders([])
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: 'salesOrder',
            'Content-Type': 'application/json',
        }).then(res => {
            const orders = res.data.map(order => {
                order.totalPayment = Decimal(order.payment).plus(order.prepayment).toString()
                return order
            })
            setSalesOrders(orders)
            filterSalesOrders(orders)
        }).catch(_ => { })
    }
    const orderTableColumns = [
        { title: '序号', align: 'center', render: (_, __, idx) => idx + 1 },
        { title: '单号', dataIndex: 'id', align: 'center', export: true, summary: '总计', render: id => <a onClick={_ => setEditOrderId(id)}>{id}</a> },
        { title: '日期', dataIndex: 'date', align: 'center', export: true },
        { title: '客户', dataIndex: 'partner', align: 'center', export: true },
        { title: '金额', dataIndex: 'amount', align: 'center', export: true, summary: 'sum' },
        { title: '定金', dataIndex: 'prepayment', align: 'center', export: true, summary: 'sum' },
        { title: '尾款', dataIndex: 'payment', align: 'center', export: true, summary: 'sum' },
        { title: '已付款', dataIndex: 'totalPayment', align: 'center', export: true, summary: 'sum', render: (totalPayment, record) => 
            <span style={{ color: Decimal(totalPayment).equals(record.amount) ? 'black' : 'red' }}>{totalPayment}</span>
        },
        { title: '送货情况', dataIndex: 'delivered', align: 'center' },
        { title: '关联退货单', dataIndex: 'refundId', align: 'center' },
        { title: '操作', align: 'center', render: (_, record) => (
            <Space.Compact size='small'>
                <Button type='link' onClick={_ => setPreviewOrderId(record.id)}>预览</Button>
                <Button type='link' onClick={_ => showDeleteConfirm([record.id])} danger>删除</Button>
            </Space.Compact>
        ) }
    ]
    const pagination = {defaultPageSize: 50, pageSizeOptions: [50, 100], showQuickJumper: true, showSizeChanger: true}

    // delete
    const showDeleteConfirm = (orderIds) => {
        const title = orderIds.length === 1 ? `是否删除销售清单 ${orderIds[0]} ?` : `是否删除 ${orderIds.length} 张销售清单?`
        confirm({
            title: title, icon: <ExclamationCircleFilled />,
            content: '确认删除后不可撤销，同时仓库中产品的库存会相应增加',
            okText: '删除', okType: 'danger', cancelText: '取消',
            onOk() {
                Axios({
                    method: 'delete',
                    baseURL: baseURL(),
                    url: `salesOrder`,
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
    const filterSalesOrders = (salesOrders) => {
        const conds = form.getFieldsValue()
        setFilteredSalesOrders(salesOrders.filter(o => 
            (!conds.orderId || o.id.includes(conds.orderId)) &&
            (!conds.date || !conds.date[0] || o.date >= conds.date[0].format(dateFormat)) &&
            (!conds.date || !conds.date[1] || o.date <= conds.date[1].format(dateFormat)) &&
            (!conds.partner || o.partner.includes(conds.partner)) &&
            (!conds.refundId || (o.refundId != null && o.refundId.includes(conds.refundId)))
        ))
    }

    // export
    const exportSalesOrders = () => {
        exportExcel('销售单', getExportData(orderTableColumns, filteredSalesOrders))
    }

    useEffect(load, [])

    return <>
        {contextHolder}
        <SalesOrderFB refresh={load} />

        <Modal open={previewOrderId !== undefined} width={900} destroyOnClose 
            onCancel={_ => setPreviewOrderId(undefined)} footer={null}>
            <SalesOrderPreview id={previewOrderId} refresh={load} />
        </Modal>

        <Modal title='编辑销售清单' open={editOrderId !== undefined} width={900} destroyOnClose 
            onCancel={_ => setEditOrderId(undefined)} footer={null}>
            <SalesOrderEditView id={editOrderId} refresh={load} />
        </Modal>

        <br />
        <Space direction='vertical'>
            {/* Function Box */}
             <Card size='small'><Form form={form} onFinish={_ => filterSalesOrders(salesOrders)}><Row>
                <Item label='单号' name='orderId' style={itemStyle}><Input allowClear placeholder='单号' /></Item>
                <Item label='客户' name='partner' style={itemStyle}><Input allowClear placeholder='客户' /></Item>
                <Item label='日期' name='date' style={itemStyle}><RangePicker format={dateFormat} allowEmpty={[true, true]} /></Item>
                <Item label='退货单号' name='refundId' style={itemStyle}><Input allowClear placeholder='退货单号' /></Item>
                <Space style={itemStyle}>
                    <Button icon={<SearchOutlined />} type='primary' htmlType='submit'>搜索</Button>
                    <Button icon={<TableOutlined />} onClick={exportSalesOrders} disabled={filteredSalesOrders.length === 0}>批量导出</Button>
                    <Button icon={<DeleteOutlined />} onClick={_ => showDeleteConfirm(filteredSalesOrders.map(o => o.id) || [])} danger disabled={filteredSalesOrders.length === 0}>批量删除</Button>
                </Space>
            </Row></Form></Card>

            {/* Sales Order Table */}
            <Table dataSource={filteredSalesOrders} bordered size='small' rowKey={record => record.id} columns={orderTableColumns} pagination={pagination} />
        </Space>
    </>
}


export default SalesOrderPage