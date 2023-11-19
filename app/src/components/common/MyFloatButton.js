import React, { useState } from 'react'
import { Table, Modal, Button, message, FloatButton, Space, Popover } from 'antd'
import { PlusOutlined, InboxOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'


import { emptyInvoice } from '../../utils/invoiceUtils'
import SalesOrderEditView from '../salesOrderComponents/SalesOrderEditView'
import SalesRefundEditView from '../salesRefundComponents/SalesRefundEditView'
import PurchaseOrderEditView from '../purchaseOrderComponents/PurchaseOrderEditView'
import PurchaseRefundEditView from '../purchaseRefundComponents/PurchaseRefundEditView'

/*
    Required: type, refresh, drafts, setDrafts
*/
export default function MyFloatButton(props) {
    const [editInvoice, setEditInvoice] = useState(undefined)
    const [messageApi, contextHolder] = message.useMessage()

    // draft
    const saveDraft = (draft) => {
        var newDrafts = props.drafts
        if (draft.draftTime !== undefined) {
            newDrafts = newDrafts.filter(d => d.draftTime !== draft.draftTime)
        }
        draft.draftTime = dayjs()
        newDrafts.unshift(draft)
        props.setDrafts(newDrafts)
        setEditInvoice(undefined)
    }
    const removeDraft = (draft) => {
        if (draft.draftTime) {
            props.setDrafts(props.drafts.filter(d => d.draftTime !== draft.draftTime))
        }
    }

    const columns = [
        { title: '保存时间', dataIndex: 'draftTime', align: 'center', render: time => time.format('HH:mm:ss') },
        { title: '客户', dataIndex: 'partner', align: 'center' },
        { title: '产品数', dataIndex: 'items', align: 'center', render: items => {
            if (props.type === 'salesOrder' || props.type === 'purchaseOrder') return items.length - 1
            return items.length
        } },
        { title: '操作', align: 'center', render: (_, draft) => 
            <Space.Compact size='small'>
                <Button type='link' size='small' onClick={_ => setEditInvoice(draft)}>编辑</Button>
                <Button type='link' danger size='small' onClick={_ => removeDraft(draft)}>删除</Button>
            </Space.Compact>
        }
    ]

    return <>
        {contextHolder}
        <Popover title={`草稿箱 (${props.drafts.length})`} placement='topLeft' zIndex={999} trigger='click' content={
            <Table className='draftTable' dataSource={props.drafts} size='small' pagination={{pageSize: 5, size: 'small'}} 
                hideOnSinglePage bordered columns={columns} />
        } destroyTooltipOnHide>
            <FloatButton icon={<InboxOutlined />} style={{ right: 80 }} badge={{ count: props.drafts.length, color: 'blue' }} />
        </Popover>
        
        <FloatButton icon={<PlusOutlined />} type='primary' onClick={_ => setEditInvoice(emptyInvoice(0))} style={{ right: 24 }} />
        
        <Modal title='新建销售退货' open={editInvoice} width={1000} centered onCancel={_ => setEditInvoice(undefined)} footer={null}>
            { props.type === 'salesOrder' ? <SalesOrderEditView order={editInvoice} messageApi={messageApi} dismiss={_ => setEditInvoice(undefined)} 
                refresh={props.refresh} saveDraft={saveDraft} removeDraft={removeDraft} /> : null }
            { props.type === 'salesRefund' ? <SalesRefundEditView refund={editInvoice} messageApi={messageApi} dismiss={_ => setEditInvoice(undefined)} 
                refresh={props.refresh} saveDraft={saveDraft} removeDraft={removeDraft} /> : null }
            { props.type === 'purchaseOrder' ? <PurchaseOrderEditView order={editInvoice} messageApi={messageApi} dismiss={_ => setEditInvoice(undefined)} 
                refresh={props.refresh} saveDraft={saveDraft} removeDraft={removeDraft} /> : null }
            { props.type === 'purchaseRefund' ? <PurchaseRefundEditView refund={editInvoice} messageApi={messageApi} dismiss={_ => setEditInvoice(undefined)} 
                refresh={props.refresh} saveDraft={saveDraft} removeDraft={removeDraft} /> : null }
        </Modal>
    </>
}