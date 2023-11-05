import React, { useState, useEffect } from 'react'
import Axios from 'axios'
import { Table, Space, Button, message, Modal, Form, Row, Input, DatePicker, Card } from 'antd'
import Decimal from 'decimal.js'
import { ExclamationCircleFilled, DeleteOutlined, TableOutlined } from '@ant-design/icons';


const { Column } = Table
const { confirm } = Modal;
const { Item } = Form
const { RangePicker } = DatePicker


import { baseURL, dateFormat } from '../utils/config'
import SalesRefundFB from '../components/salesRefundComponents/SalesRefundFB'
import SalesRefundEditView from '../components/salesRefundComponents/SalesRefundEditView'
import SalesRefundPreview from '../components/salesRefundComponents/SalesRefundPreview';


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
                <Input allowClear placeholder='单号' onChange={e => updateConditions('refundId', e.target.value)} />
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
            <Item label='销售单号' style={style}>
                <Input allowClear placeholder='销售单号' onChange={e => updateConditions('orderId', e.target.value)} />
            </Item>
            <Item style={style}>
                <Space>
                    <Button icon={<TableOutlined />}>导出</Button>
                    <Button danger icon={<DeleteOutlined />}>批量删除</Button>
                </Space>
            </Item>
        </Row>
    </Card>
}


function SalesRefundPage(props) {
    const [salesRefunds, setSalesRefunds] = useState([])
    const [filteredSalesRefunds, setFilteredSalesRefunds] = useState([])
    const [filterConditions, setFilterConditions] = useState({orderId: '', date: ['', ''], partner: '', refundId: ''})
    
    const [previewRefundId, setPreviewRefundId] = useState(undefined)
    const [editRefundId, setEditRefundId] = useState(undefined)
    const [messageApi, contextHolder] = message.useMessage();


    const load = () => {
        setSalesRefunds([])
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: 'salesRefund',
            params: {  },
            'Content-Type': 'application/json',
        }).then(res => {
            setSalesRefunds(res.data)
        }).catch(_ => { });
    };

    const showDeleteConfirm = (refundId) => {
        confirm({
            title: `是否删除销售退款单 ${refundId}?`,
            icon: <ExclamationCircleFilled />,
            content: '确认删除后不可撤销，同时仓库中产品的库存会相应减少',
            okText: '删除',
            okType: 'danger',
            cancelText: '取消',
            onOk() { deleteRefund(refundId) },
        });
    }

    const deleteRefund = (refundId) => {
        Axios({
            method: 'delete',
            baseURL: baseURL(),
            url: `salesRefund/id/${refundId}`,
            params: {  },
            'Content-Type': 'application/json',
        }).then(res => {
            load()
            messageApi.open({ type: 'success', content: '删除成功', });
        }).catch(_ => {
            messageApi.open({ type: 'error', content: '删除失败', });
        }); 
    }

    const filterSalesRefunds = () => {
        setFilteredSalesRefunds(salesRefunds.filter(o => 
            (filterConditions.refundId === '' || o.id.includes(filterConditions.refundId)) &&
            (filterConditions.date[0] === '' || o.date >= filterConditions.date[0]) &&
            (filterConditions.date[1] === '' || o.date <= filterConditions.date[1]) &&
            (filterConditions.partner === '' || o.partner.includes(filterConditions.partner)) &&
            (filterConditions.orderId === '' || (o.orderId != null && o.orderId.includes(filterConditions.orderId)))
        ))
    }

    useEffect(() => {
        load()
    }, [])

    useEffect(() => {
        filterSalesRefunds()
    }, [salesRefunds, filterConditions])


    return (<div style={props.style || {}}>
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
        <Space direction="vertical" style={{ width: '100%' }}>
            <SearchBar setFilterConditions={setFilterConditions} filterConditions={filterConditions} />
            
            <Table dataSource={filteredSalesRefunds}  size='small'
            rowKey={record => record.id} bordered
            pagination={{defaultPageSize: 50, pageSizeOptions: [50, 100], showQuickJumper: true, showSizeChanger: true}}>
                <Column title='序号' render={(_,__,idx) => idx+1} align='center' />
                <Column title='单号' dataIndex='id' align='center' render={id =>
                    <a onClick={_ => setEditRefundId(id)}>{id}</a>
                } />
                <Column title='日期' dataIndex='date' align='center' />
                <Column title='客户' dataIndex='partner' align='center' />
                <Column title='金额' dataIndex='amount' align='center' />
                <Column title='已付金额' dataIndex='payment' align='center' render={(_, row) => {
                    const amount = Decimal(row.payment)
                    const color = amount.equals(Decimal(row.amount)) ? 'black' : 'red'
                    return <span style={{color: color}}>{amount.toString()}</span>
                }} />
                <Column title='关联销售单' dataIndex='orderId' align='center' />
                <Column title='操作' align='center' render={(_, row) => 
                    <Space.Compact size='small'>
                        <Button type='link' onClick={_ => setPreviewRefundId(row.id)}>预览</Button>
                        <Button type='link' onClick={_ => showDeleteConfirm(row.id)} danger>删除</Button>
                    </Space.Compact>
                } />
            </Table>
        </Space>
    </div>)
}


export default SalesRefundPage