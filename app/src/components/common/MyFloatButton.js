import React, { useState } from 'react'
import { Table, Modal, Button, message, FloatButton, Space, Popover } from 'antd'
import { PlusOutlined, InboxOutlined } from '@ant-design/icons'
import { useSelector, useDispatch } from 'react-redux'


import { emptyInvoice } from '../../utils/invoiceUtils'
import InvoiceEditView from '../invoice/InvoiceEditView'
import './myFloatButton.css'
import NewInvoiceView from '../invoice/NewInvoiceView'



/*
    Required: type, refresh
*/
export default function MyFloatButton(props) {
    const [editInvoice, setEditInvoice] = useState(undefined)
    const [messageApi, contextHolder] = message.useMessage()
    const drafts = useSelector(state => state.draft.value)
    const dispatch = useDispatch()

    const isSales = ['salesOrder', 'salesRefund'].includes(props.type)
    const isOrder = ['salesOrder', 'purchaseOrder'].includes(props.type)

    const columns = [
        { title: '保存时间', dataIndex: 'draftTime', align: 'center', render: time => time.format('HH:mm:ss') },
        { title: isSales ? '客户' : '供应商', dataIndex: 'partner', align: 'center' },
        {
            title: '产品数', dataIndex: 'items', align: 'center', render: items => {
                if (isOrder) return items.length - 1
                return items.length
            }
        },
        {
            title: '操作', align: 'center', render: (_, draft) =>
                <Space.Compact size='small'>
                    <Button type='link' size='small' onClick={_ => setEditInvoice(draft)}>编辑</Button>
                    <Button type='link' danger size='small' onClick={_ => dispatch({ type: 'draft/remove', payload: draft })}>删除</Button>
                </Space.Compact>
        }
    ]

    return <>
        {contextHolder}
        <Popover title={`草稿箱 (${drafts.filter(d => d.type === props.type).length})`} placement='topLeft' zIndex={999} trigger='click' destroyTooltipOnHide
            content={
                <Table className='draftTable' dataSource={drafts.filter(d => d.type === props.type)} rowKey={r => r.draftTime}
                    size='small' pagination={{ pageSize: 5, size: 'small' }}
                    hideOnSinglePage bordered columns={columns} />
            }>
            <FloatButton icon={<InboxOutlined />} style={{ right: 80 }} badge={{ count: drafts.filter(d => d.type === props.type).length, color: 'blue' }} />
        </Popover>

        <FloatButton icon={<PlusOutlined />} type='primary' style={{ right: 24 }} onClick={_ => {
            setEditInvoice(emptyInvoice(isOrder ? 1 : 0))
        }} />

        <Modal title={null} open={editInvoice} width={1000} centered destroyOnClose
            onCancel={_ => setEditInvoice(undefined)} footer={null}>
            {/* <InvoiceEditView invoice={editInvoice} messageApi={messageApi} type={props.type}
                dismiss={_ => setEditInvoice(undefined)} refresh={props.refresh} /> */}
            <NewInvoiceView invoice={editInvoice} dismiss={_ => setEditInvoice(undefined)}
                messageApi={messageApi} type={props.type} refresh={props.refresh} />
        </Modal>
    </>
}