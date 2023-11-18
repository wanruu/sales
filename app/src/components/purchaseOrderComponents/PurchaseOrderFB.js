import React, { useEffect, useState, } from 'react'
import { Table, Modal, Button, message, FloatButton, Space, Popover } from 'antd'
import { PlusOutlined, InboxOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'


import { emptyInvoice } from '../../utils/invoiceUtils'
import '../common/Invoice.css'
import PurchaseOrderEditView from './PurchaseOrderEditView'

/*
    Required: refresh, drafts, setDrafts
*/
export default function PurchaseOrderFB(props) {
    const [editOrder, setEditOrder] = useState(undefined)
    
    const [messageApi, contextHolder] = message.useMessage()

    // draft
    const saveDraft = (order) => {
        var newDraftOrders = props.drafts
        if (order.draftTime)
            newDraftOrders = newDraftOrders.filter(o => o.draftTime !== order.draftTime)
        order.draftTime = dayjs()
        newDraftOrders.unshift(order)
        props.setDrafts(newDraftOrders)
        setEditOrder(undefined)
    }
    const removeDraft = (draft) => {
        if (draft.draftTime) props.setDrafts(props.drafts.filter(d => d.draftTime !== draft.draftTime))
    }

    const columns = [
        { title: '保存时间', dataIndex: 'draftTime', align: 'center', render: time => time.format('HH:mm:ss') },
        { title: '客户', dataIndex: 'partner', align: 'center' },
        { title: '产品数', dataIndex: 'items', align: 'center', render: items => items.length - 1 },
        { title: '操作', align: 'center', render: (_, draft) => 
            <Space.Compact size='small'>
                <Button type='link' size='small' onClick={_ => setEditOrder(draft)}>编辑</Button>
                <Button type='link' danger size='small' onClick={_ => removeDraft(draft)}>删除</Button>
            </Space.Compact>
        }
    ]

    return (<>
        {contextHolder}
        <Popover title={`草稿箱 (${props.drafts.length})`} placement='topLeft' zIndex={999} trigger='click' content={
            <Table className='draftTable' dataSource={props.drafts} size='small' pagination={{pageSize: 5, size: 'small'}} 
                hideOnSinglePage bordered columns={columns} />
        } destroyTooltipOnHide>
            <FloatButton icon={<InboxOutlined />} style={{ right: 80 }} badge={{ count: props.drafts.length, color: 'blue' }} />
        </Popover>

        <FloatButton icon={<PlusOutlined />} type='primary' onClick={_ => setEditOrder(emptyInvoice(1))} style={{ right: 24 }} />
    
        <Modal title='新建采购清单' open={editOrder} width={1000} centered onCancel={_ => setEditOrder(undefined)} footer={null} maskClosable={false}>
            <PurchaseOrderEditView order={editOrder} dismiss={_ => setEditOrder(undefined)} messageApi={messageApi} 
                refresh={props.refresh} saveDraft={saveDraft} removeDraft={removeDraft} />
        </Modal>
    </>)
}
