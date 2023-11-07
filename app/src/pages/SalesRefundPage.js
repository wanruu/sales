import React, { useState, useEffect } from 'react'
import Axios from 'axios'
import { Table, Space, Button, message, Modal, Form, Row, Input, DatePicker, Card } from 'antd'
import Decimal from 'decimal.js'
import { ExclamationCircleFilled, DeleteOutlined, TableOutlined, SearchOutlined } from '@ant-design/icons'


const { Column } = Table
const { confirm } = Modal
const { Item } = Form
const { RangePicker } = DatePicker


import { baseURL, dateFormat } from '../utils/config'
import SalesRefundFB from '../components/salesRefundComponents/SalesRefundFB'
import SalesRefundEditView from '../components/salesRefundComponents/SalesRefundEditView'
import SalesRefundPreview from '../components/salesRefundComponents/SalesRefundPreview'
import { exportExcel } from '../utils/export'


function SalesRefundPage() {
    const [salesRefunds, setSalesRefunds] = useState([])
    const [filteredSalesRefunds, setFilteredSalesRefunds] = useState([])
    const [form] = Form.useForm()

    const [previewRefundId, setPreviewRefundId] = useState(undefined)
    const [editRefundId, setEditRefundId] = useState(undefined)
    const [messageApi, contextHolder] = message.useMessage()
    const itemStyle = { marginTop: '8px', marginBottom: '8px', marginLeft: '10px', marginRight: '10px' }
    
    // load
    const load = () => {
        setSalesRefunds([])
        setFilteredSalesRefunds([])
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: 'salesRefund',
            'Content-Type': 'application/json',
        }).then(res => {
            setSalesRefunds(res.data)
            filterSalesRefunds(res.data)
        }).catch(_ => { })
    }

    // delete
    const showDeleteConfirm = (refundIds) => {
        const title = refundIds.length === 1 ? `是否删除销售退款单 ${refundIds[0]} ?` : `是否删除 ${refundIds.length} 张销售退款单?`
        confirm({
            title: title, icon: <ExclamationCircleFilled />,
            content: '确认删除后不可撤销，同时仓库中产品的库存会相应减少',
            okText: '删除', okType: 'danger', cancelText: '取消',
            onOk() {
                Axios({
                    method: 'delete',
                    baseURL: baseURL(),
                    url: `salesRefund`,
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
    const filterSalesRefunds = (salesRefunds) => {
        const conds = form.getFieldsValue()
        setFilteredSalesRefunds(salesRefunds.filter(o => 
            (!conds.refundId || o.id.includes(conds.refundId)) &&
            (!conds.date || !conds.date[0] || o.date >= conds.date[0].format(dateFormat)) &&
            (!conds.date || !conds.date[1] || o.date <= conds.date[1].format(dateFormat)) &&
            (!conds.partner || o.partner.includes(conds.partner)) &&
            (!conds.orderId || (o.orderId != null && o.orderId.includes(conds.orderId)))
        ))
    }

    // export
    const exportSalesRefunds = () => {
        const refunds = filteredSalesRefunds.map(f => {
            return {
                '单号': f.id,
                '日期': f.date,
                '客户': f.partner,
                '金额': parseFloat(f.amount),
                '预付款': parseFloat(f.prepayment),
                '付款': parseFloat(f.payment),
                '关联销售单': f.orderId,
            }
        })
        exportExcel('销售退款单', refunds)
    }

    useEffect(load, [])

    return <>
        {contextHolder}
        <SalesRefundFB refresh={load} />

        <Modal open={previewRefundId !== undefined} width={900} destroyOnClose 
            onCancel={_ => setPreviewRefundId(undefined)} footer={null}>
            <SalesRefundPreview id={previewRefundId} refresh={load} />
        </Modal>

        <Modal title='编辑销售退款单' open={editRefundId !== undefined} width={900} destroyOnClose 
            onCancel={_ => setEditRefundId(undefined)} footer={null}>
            <SalesRefundEditView id={editRefundId} refresh={load} />
        </Modal>

        <br />
        <Space direction='vertical'>
            {/* Function Box */}
            <Card size='small'><Form form={form} onFinish={_ => filterSalesRefunds(salesRefunds)}><Row>
                <Item label='单号' name='refundId' style={itemStyle}><Input allowClear placeholder='单号' /></Item>
                <Item label='客户' name='partner' style={itemStyle}><Input allowClear placeholder='客户' /></Item>
                <Item label='日期' name='date' style={itemStyle}><RangePicker format={dateFormat} allowEmpty={[true, true]} /></Item>
                <Item label='销售单号' name='orderId' style={itemStyle}><Input allowClear placeholder='销售单号' /></Item>
                <Space style={itemStyle}>
                    <Button icon={<SearchOutlined />} type='primary' htmlType='submit'>搜索</Button>
                    <Button icon={<TableOutlined />} onClick={exportSalesRefunds} disabled={filteredSalesRefunds.length === 0}>批量导出</Button>
                    <Button danger icon={<DeleteOutlined />} onClick={_ => showDeleteConfirm(filteredSalesRefunds.map(f => f.id) || [])} disabled={filteredSalesRefunds.length === 0}>批量删除</Button>
                </Space>
            </Row></Form></Card>

            {/* Sales Refund Table */}
            <Table dataSource={filteredSalesRefunds} size='small' rowKey={record => record.id} bordered
                pagination={{defaultPageSize: 50, pageSizeOptions: [50, 100], showQuickJumper: true, showSizeChanger: true}}>
                <Column title='序号' render={(_, __, idx) => idx+1} align='center' />
                <Column title='单号' dataIndex='id' align='center' render={id =>
                    <a onClick={_ => setEditRefundId(id)}>{id}</a>
                } />
                <Column title='日期' dataIndex='date' align='center' />
                <Column title='客户' dataIndex='partner' align='center' />
                <Column title='金额' dataIndex='amount' align='center' />
                <Column title='已付金额' dataIndex='payment' align='center' render={(_, record) => {
                    const amount = Decimal(record.payment)
                    const color = amount.equals(Decimal(record.amount)) ? 'black' : 'red'
                    return <span style={{color: color}}>{amount.toString()}</span>
                }} />
                <Column title='关联销售单' dataIndex='orderId' align='center' />
                <Column title='操作' align='center' render={(_, record) => 
                    <Space.Compact size='small'>
                        <Button type='link' onClick={_ => setPreviewRefundId(record.id)}>预览</Button>
                        <Button type='link' onClick={_ => showDeleteConfirm([record.id])} danger>删除</Button>
                    </Space.Compact>
                } />
            </Table>
        </Space>
    </>
}


export default SalesRefundPage