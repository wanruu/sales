import React, { useState, } from 'react'
import { Table, Modal, Button, message, FloatButton, Space, Popover } from 'antd'
import { PlusOutlined, InboxOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'


import { emptyInvoice } from '../../utils/invoiceUtils'
import SalesRefundEditView from '../salesRefundComponents/SalesRefundEditView'


/*
    Required: refresh, drafts, setDrafts
*/
function SalesRefundFB(props) {
    const [editRefund, setEditRefund] = useState(undefined)
    const [messageApi, contextHolder] = message.useMessage()

    // draft
    const saveDraft = (refund) => {
        var newDraftRefunds = props.drafts
        if (refund.draftTime !== undefined)
            newDraftRefunds = newDraftRefunds.filter(r => r.draftTime !== refund.draftTime)
        refund.draftTime = dayjs()
        newDraftRefunds.unshift(refund)
        props.setDrafts(newDraftRefunds)
        setEditRefund(undefined)
    }
    const removeDraft = (draft) => {
        if (draft.draftTime)
            props.setDrafts(props.drafts.filter(d => d.draftTime !== draft.draftTime))
    }

    const columns = [
        { title: '保存时间', dataIndex: 'draftTime', align: 'center', render: time => time.format('HH:mm:ss') },
        { title: '客户', dataIndex: 'partner', align: 'center' },
        { title: '产品数', dataIndex: 'items', align: 'center', render: items => items.length },
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
        
        <FloatButton icon={<PlusOutlined />} type='primary' onClick={_ => setEditRefund(emptyInvoice(0))} style={{ right: 24 }} />
        
        <Modal title='新建销售退货' open={editRefund} width={1000} centered onCancel={_ => setEditRefund(undefined)} footer={null}>
            <SalesRefundEditView refund={editRefund} messageApi={messageApi} dismiss={_ => setEditRefund(undefined)} 
                refresh={props.refresh} saveDraft={saveDraft} removeDraft={removeDraft} />
        </Modal>
    </>)
}

export default SalesRefundFB