import React, { useState, useEffect } from 'react'
import Axios from 'axios'
import { Table, Space, Button, message, Modal } from 'antd'
import Decimal from 'decimal.js'
import { ExclamationCircleFilled } from '@ant-design/icons';


const { Column } = Table
const { confirm } = Modal;


import { baseURL } from '../utils/config'
import SalesRefundFB from '../components/salesRefundComponents/SalesRefundFB'
import SalesRefundEditView from '../components/salesRefundComponents/SalesRefundEditView'
import SalesRefundPreview from '../components/salesRefundComponents/SalesRefundPreview';


function SalesRefundPage() {
    const [salesRefunds, setSalesRefunds] = useState([])
    const [previewRefundId, setPreviewRefundId] = useState(undefined)
    const [editRefundId, setEditRefundId] = useState(undefined)
    const [messageApi, contextHolder] = message.useMessage();


    const load = () => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: 'salesRefund',
            params: {  },
            'Content-Type': 'application/json',
        }).then(res => {
            if (res.status === 200) {
                setSalesRefunds(res.data)
            }
        }).catch(_ => {
            
        });
    };

    const showDeleteConfirm = (refundId) => {
        confirm({
            title: `是否删除销售退款单 ${refundId.toString().padStart(6, '0')}?`,
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
            if (res.status === 200) {
                load()
                messageApi.open({ type: 'success', content: '删除成功', });
            } else {
                messageApi.open({ type: 'error', content: '删除失败', });
            }
        }).catch(_ => {
            messageApi.open({ type: 'error', content: '删除失败', });
        }); 
    }

    useEffect(() => {
        load()
    }, [])

    
    return (<>
        {contextHolder}
        <SalesRefundFB refresh={load} />

        <Modal open={previewRefundId !== undefined} width={900} destroyOnClose 
        onCancel={_ => setPreviewRefundId(undefined)} footer={null}>
            <SalesRefundPreview id={previewRefundId} refresh={load} />
        </Modal>

        <Modal title='编辑销售退款单' open={editRefundId !== undefined} width={900} destroyOnClose 
        onCancel={_ => setEditRefundId(undefined)} footer={null}>
            <SalesRefundEditView id={editRefundId} />
        </Modal>

        <Table dataSource={salesRefunds}  size='small'
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
            <Column title='操作' align='center' render={(_, row) => 
                <Space.Compact size='small'>
                    <Button type='link' onClick={_ => setPreviewRefundId(row.id)}>预览</Button>
                    <Button type='link' onClick={_ => showDeleteConfirm(row.id)} danger>删除</Button>
                </Space.Compact>
            } />
        </Table>
    </>)
}


export default SalesRefundPage