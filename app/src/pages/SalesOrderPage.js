import React from 'react'
import Axios from 'axios'
import { Table, Modal, Button, Space, message, AutoComplete, DatePicker, Switch, Col, Row } from "antd";
import { useEffect, useState, useRef } from "react";
import { Decimal } from 'decimal.js';
import { ExclamationCircleFilled } from '@ant-design/icons';

const { Column } = Table
const { confirm } = Modal;


import SalesOrderFB from '../components/salesOrderComponents/SalesOrderFB'
import SalesOrderPreview from '../components/salesOrderComponents/SalesOrderPreview';
import { baseURL } from '../utils/config';


function SalesOrderPage() {
    const [salesOrders, setSalesOrders] = useState([])
    const [previewOrderId, setPreviewOrderId] = useState(undefined)
    

    const load = () => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: 'salesOrder',
            params: {  },
            'Content-Type': 'application/json',
        }).then(res => {
            if (res.status === 200) {
                setSalesOrders(res.data)
            }
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
        }).then(res => {
            if (res.status === 200) {
                load()
            }
        }).catch(_ => {
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
        <SalesOrderFB refresh={load} />

        <Modal open={previewOrderId !== undefined} width={900} destroyOnClose onCancel={_ => setPreviewOrderId(undefined)}>
            <SalesOrderPreview id={previewOrderId} />
        </Modal>

        <Table dataSource={salesOrders} bordered size='small' 
        pagination={{defaultPageSize: 50, pageSizeOptions: [50, 100], showQuickJumper: true, showSizeChanger: true}}>
            <Column title='编号' align='center' render={(_, __, idx) => idx+1} />
            <Column title='单号' dataIndex='id' align='center' render={id => 
                `${id}`.padStart(6, '0')
            } />
            <Column title='收货单位' dataIndex='partner' align='center' />
            <Column title='金额' dataIndex='amount' align='center' render={amount => 
                `${amount}`
            } />
            <Column title='已付金额' align='center' render={(_, row) => {
                const amount = Decimal(row.payment).plus(row.prepayment)
                const color = amount.equals(Decimal(row.amount)) ? 'black' : 'red'
                const prepaymenStr = row.prepayment !== '0' ? ` (含预付${row.prepayment})` : ''
                return <span style={{color: color}}>{amount.toString()+prepaymenStr}</span>
            }} />
            <Column title='操作' align='center' render={(_, row) => (
                <Space.Compact size='small'>
                    <Button type='link'>编辑</Button>
                    <Button type='link' onClick={_ => setPreviewOrderId(row.id)}>预览</Button>
                    <Button type='link' onClick={_ => showDeleteConfirm(row.id)} danger>删除</Button>
                </Space.Compact>
            )} />
        </Table>
    </>)
}


export default SalesOrderPage