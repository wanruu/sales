import React, { useEffect, useState, } from 'react'
import Axios from 'axios'
import { Table, Modal, Button, Space, message, Input, Form, DatePicker, Row, Card } from "antd";
import { Decimal } from 'decimal.js';
import { ExclamationCircleFilled, TableOutlined, DeleteOutlined } from '@ant-design/icons';

const { Column } = Table
const { confirm } = Modal;
const { Item } = Form
const { RangePicker } = DatePicker


import SalesOrderFB from '../components/salesOrderComponents/SalesOrderFB'
import SalesOrderPreview from '../components/salesOrderComponents/SalesOrderPreview';
import { baseURL, dateFormat } from '../utils/config';
import SalesOrderEditView from '../components/salesOrderComponents/SalesOrderEditView';


function SearchBar(props) {
    const updateConditions = (field, value) => {
        const conds = JSON.parse(JSON.stringify(props.filterConditions))
        conds[field] = value
        props.setFilterConditions(conds)
    }
    const style = { marginTop: '8px', marginBottom: '8px', marginLeft: '10px', marginRight: '10px' }
    return <Card size='small'>
        <Row>
            <Item label='单号' style={style}>
                <Input allowClear placeholder='单号' onChange={e => updateConditions('orderId', e.target.value)} />
            </Item>
            <Item label='客户' style={style}>
                <Input allowClear placeholder='客户' onChange={e => updateConditions('partner', e.target.value)} />
            </Item>
            <Item label='日期' style={style}>
                <RangePicker format={dateFormat} allowEmpty={[true, true]} onChange={vals => {
                    const s = vals && vals[0] ? vals[0].format(dateFormat) : ''
                    const e = vals && vals[1] ? vals[1].format(dateFormat) : ''
                    updateConditions('date', [s,e])
                }} />
            </Item>
            <Item label='退货单号' style={style}>
                <Input allowClear placeholder='退货单号' onChange={e => updateConditions('refundId', e.target.value)} />
            </Item>
            <Item style={style}>
                <Space>
                    <Button danger icon={<DeleteOutlined />}>批量删除</Button>
                    <Button icon={<TableOutlined />}>导出</Button>
                </Space>
            </Item>
        </Row>
    </Card>
}


function SalesOrderPage(props) {
    const [salesOrders, setSalesOrders] = useState([])
    const [filteredSalesOrders, setFilteredSalesOrders] = useState([])
    const [filterConditions, setFilterConditions] = useState({orderId: '', date: ['', ''], partner: '', refundId: ''})

    const [previewOrderId, setPreviewOrderId] = useState(undefined)
    const [editOrderId, setEditOrderId] = useState(undefined)
    const [messageApi, contextHolder] = message.useMessage();

    const load = () => {
        setSalesOrders([])
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: 'salesOrder',
            'Content-Type': 'application/json',
        }).then(res => {
            setSalesOrders(res.data)
        }).catch(_ => { })
    };

    const deleteOrder = (orderId) => {
        Axios({
            method: 'delete',
            baseURL: baseURL(),
            url: `salesOrder/id/${orderId}`,
            'Content-Type': 'application/json',
        }).then(_ => {
            load()
            messageApi.open({ type: 'success', content: '删除成功', });
        }).catch(_ => {
            messageApi.open({ type: 'error', content: '删除失败', });
        }); 
    }

    const showDeleteConfirm = (orderId) => {
        confirm({
            title: `是否删除销售清单 ${orderId}?`,
            icon: <ExclamationCircleFilled />,
            content: '确认删除后不可撤销，同时仓库中产品的库存会相应增加',
            okText: '删除',
            okType: 'danger',
            cancelText: '取消',
            onOk() { deleteOrder(orderId) },
        });
    }

    const filterSalesOrders = () => {
        setFilteredSalesOrders(salesOrders.filter(o => 
            (filterConditions.orderId === '' || o.id.includes(filterConditions.orderId)) &&
            (filterConditions.date[0] === '' || o.date >= filterConditions.date[0]) &&
            (filterConditions.date[1] === '' || o.date <= filterConditions.date[1]) &&
            (filterConditions.partner === '' || o.partner.includes(filterConditions.partner)) &&
            (filterConditions.refundId === '' || (o.refundId != null && o.refundId.includes(filterConditions.refundId)))
        ))
    }

    useEffect(() => {
        load()
    }, [])

    useEffect(() => {
        filterSalesOrders()
    }, [salesOrders, filterConditions])

    return (<div style={props.style || {}}>
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
        <Space direction='vertical' style={{ width: '100%' }} >
            <SearchBar setFilterConditions={setFilterConditions} filterConditions={filterConditions} />
            <Table dataSource={filteredSalesOrders} bordered size='small' rowKey={record => record.id}
            pagination={{defaultPageSize: 50, pageSizeOptions: [50, 100], showQuickJumper: true, showSizeChanger: true}}>
                <Column title='序号' align='center' render={(_, __, idx) => idx+1} />
                <Column title='单号' dataIndex='id' align='center' render={id => 
                    <a onClick={_ => setEditOrderId(id)}>{id}</a>
                } />
                <Column title='日期' dataIndex='date' align='center' />
                <Column title='客户' dataIndex='partner' align='center' />
                <Column title='金额' dataIndex='amount' align='center' />
                <Column title='已付金额' align='center' render={(_, row) => {
                    const amount = Decimal(row.payment).plus(row.prepayment)
                    const color = amount.equals(Decimal(row.amount)) ? 'black' : 'red'
                    const prepaymenStr = row.prepayment !== '0' ? ` (含预付${row.prepayment})` : ''
                    return <span style={{color: color}}>{amount.toString()+prepaymenStr}</span>
                }} />
                <Column title='关联退货单' dataIndex='refundId' align='center' />
                <Column title='操作' align='center' render={(_, row) => (
                    <Space.Compact size='small'>
                        <Button type='link' onClick={_ => setPreviewOrderId(row.id)}>预览</Button>
                        <Button type='link' onClick={_ => showDeleteConfirm(row.id)} danger>删除</Button>
                    </Space.Compact>
                )} />
            </Table>
        </Space>
    </div>)
}


export default SalesOrderPage