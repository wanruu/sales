import React, { useState } from 'react'
import { Table, Modal, Button, message, FloatButton, Space, Popover } from 'antd'
import { PlusOutlined, InboxOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'


import { emptyInvoice } from '../../utils/invoiceUtils'
import InvoiceEditView from '../invoice/InvoiceEditView'
import './myFloatButton.css'

/*
    Required: type, refresh, drafts, setDrafts
*/
export default function MyFloatButton(props) {
    const [editInvoice, setEditInvoice] = useState(undefined)
    const [messageApi, contextHolder] = message.useMessage()

    const isSales = ['salesOrder', 'salesRefund'].includes(props.type)
    const isOrder = ['salesOrder', 'purchaseOrder'].includes(props.type)
    const modalTitle = {
        'salesOrder': '新建销售清单',
        'salesRefund': '新建销售退货',
        'purchaseOrder': '新建采购清单',
        'purchaseRefund': '新建采购退货'
    }[props.type] || '错误'

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
                    <Button type='link' danger size='small' onClick={_ => removeDraft(draft)}>删除</Button>
                </Space.Compact>
        }
    ]

    const getTitle = (type) => {
        switch (type) {
            case 'salesOrder': return '新建销售清单'
            case 'salesRefund': return '新建销售退货'
            case 'purchaseOrder': return '新建采购清单'
            case 'purchaseRefund': return '新建采购退货'
            default: return ''
        }
    }
    return <>
        {contextHolder}
        <Popover title={`草稿箱 (${props.drafts.length})`} placement='topLeft' zIndex={999} trigger='click' content={
            <Table className='draftTable' dataSource={props.drafts} size='small' pagination={{ pageSize: 5, size: 'small' }}
                hideOnSinglePage bordered columns={columns} />
        } destroyTooltipOnHide>
            <FloatButton icon={<InboxOutlined />} style={{ right: 80 }} badge={{ count: props.drafts.length, color: 'blue' }} />
        </Popover>

        <FloatButton icon={<PlusOutlined />} type='primary' style={{ right: 24 }} onClick={_ => {
            setEditInvoice(emptyInvoice(isOrder ? 1 : 0))
        }} />

        <Modal title={modalTitle} open={editInvoice} width={1000} centered onCancel={_ => setEditInvoice(undefined)} footer={null}>
            <InvoiceEditView invoice={editInvoice} messageApi={messageApi} type={props.type}
                dismiss={_ => setEditInvoice(undefined)} refresh={props.refresh}
                saveDraft={saveDraft} removeDraft={removeDraft} />
        </Modal>
    </>
}