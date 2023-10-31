import React from 'react'
import Axios from 'axios'
import { Table, Modal, Button, Space, message, } from "antd";
import { useEffect, useState, } from "react";
import { Decimal } from 'decimal.js';
import { ExclamationCircleFilled } from '@ant-design/icons';

const { Column } = Table
const { confirm } = Modal;


import SalesOrderFB from '../components/salesOrderComponents/SalesOrderFB'
import SalesOrderPreview from '../components/salesOrderComponents/SalesOrderPreview';
import { baseURL } from '../utils/config';
import SalesOrderEditView from '../components/salesOrderComponents/SalesOrderEditView';


function SalesOrderPage() {
    const [salesOrders, setSalesOrders] = useState([])
    const [previewOrderId, setPreviewOrderId] = useState(undefined)
    const [editOrderId, setEditOrderId] = useState(undefined)
    const [messageApi, contextHolder] = message.useMessage();

    const load = () => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: 'salesOrder',
            'Content-Type': 'application/json',
        }).then(res => {
            setSalesOrders(res.data)
        }).catch(_ => {
            
        });
    };

    const deleteOrder = (orderId) => {
        Axios({
            method: 'delete',
            baseURL: baseURL(),
            url: `salesOrder/id/${orderId}`,
            params: {  },
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
            title: `是否删除销售清单 ${orderId.toString().padStart(6, '0')}?`,
            icon: <ExclamationCircleFilled />,
            content: '确认删除后不可撤销。同时仓库中产品的库存会相应增加，挂钩的销售退货条目会被删除（不影响退货清单中其他条目）',
            okText: '删除',
            okType: 'danger',
            cancelText: '取消',
            onOk() { deleteOrder(orderId) },
        });
    }

    useEffect(() => {
        load()
    }, [])

    return (<>
        {contextHolder}
        <SalesOrderFB refresh={load} />

        <Modal open={previewOrderId !== undefined} width={900} destroyOnClose 
        onCancel={_ => setPreviewOrderId(undefined)} footer={null}>
            <SalesOrderPreview id={previewOrderId} refresh={load} />
        </Modal>
        <Modal title='编辑销售清单' open={editOrderId !== undefined} width={900} destroyOnClose 
        onCancel={_ => setEditOrderId(undefined)} footer={null}>
            <SalesOrderEditView id={editOrderId} refresh={load}/>
        </Modal>

        <Table dataSource={salesOrders} bordered size='small' rowKey={record => record.id}
        pagination={{defaultPageSize: 50, pageSizeOptions: [50, 100], showQuickJumper: true, showSizeChanger: true}}>
            <Column title='序号' align='center' render={(_, __, idx) => idx+1} />
            <Column title='单号' dataIndex='id' align='center' />
            <Column title='日期' dataIndex='date' align='center' />
            <Column title='客户' dataIndex='partner' align='center' />
            <Column title='金额' dataIndex='amount' align='center' />
            <Column title='已付金额' align='center' render={(_, row) => {
                const amount = Decimal(row.payment).plus(row.prepayment)
                const color = amount.equals(Decimal(row.amount)) ? 'black' : 'red'
                const prepaymenStr = row.prepayment !== '0' ? ` (含预付${row.prepayment})` : ''
                return <span style={{color: color}}>{amount.toString()+prepaymenStr}</span>
            }} />
            <Column title='操作' align='center' render={(_, row) => (
                <Space.Compact size='small'>
                    <Button type='link' onClick={_ => setEditOrderId(row.id)}>编辑</Button>
                    <Button type='link' onClick={_ => setPreviewOrderId(row.id)}>预览</Button>
                    <Button type='link' onClick={_ => showDeleteConfirm(row.id)} danger>删除</Button>
                </Space.Compact>
            )} />
        </Table>
    </>)
}


export default SalesOrderPage