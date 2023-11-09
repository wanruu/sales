import React, { useEffect, useState, } from 'react'
import { Table, Modal, Button, message, FloatButton, Space, Popover } from 'antd'
import { PlusOutlined, InboxOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { Column } = Table

import { emptyInvoice } from '../../utils/invoiceUtils'
import '../common/Invoice.css'
import SalesOrderEditView from './SalesOrderEditView'


function SalesOrderFB(props) {
    const [editOrder, setEditOrder] = useState(undefined)
    
    const [draftOrders, setDraftOrders] = useState([])
    const [messageApi, contextHolder] = message.useMessage()

    // draft
    const saveDraft = (order) => {
        var newDraftOrders = draftOrders
        if (order.draftTime)
            newDraftOrders = newDraftOrders.filter(o => o.draftTime !== order.draftTime)
        order.draftTime = dayjs()
        newDraftOrders.unshift(order)
        setDraftOrders(newDraftOrders)
        setEditOrder(undefined)
    }
    const removeDraft = (draft) => {
        if (draft.draftTime)
            setDraftOrders(draftOrders.filter(d => d.draftTime !== draft.draftTime))
    }

    return (<>
        {contextHolder}
        <Popover title={`草稿箱 (${draftOrders.length})`} placement="topLeft" zIndex={999} trigger='click' content={
            <Table className='draftTable' dataSource={draftOrders} size='small' pagination={{pageSize: 5, size: 'small'}} hideOnSinglePage bordered>
                <Column title='保存时间' dataIndex='draftTime' align='center' render={time => time.format('HH:mm:ss')} />
                <Column title='客户' dataIndex='partner' align='center' />
                <Column title='产品数' dataIndex='items' align='center' render={items => items.length-1} />
                <Column title='操作' align='center' render={(_, draft) => (
                    <Space.Compact size='small'>
                        <Button type='link' size='small' onClick={_ => setEditOrder(draft)}>编辑</Button>
                        <Button type='link' danger size='small' onClick={_ => removeDraft(draft)}>删除</Button>
                    </Space.Compact>
                )} />
            </Table>
        } destroyTooltipOnHide>
            <FloatButton icon={<InboxOutlined />} style={{ right: 80 }} badge={{ count: draftOrders.length, color: 'blue' }} />
        </Popover>

        <FloatButton icon={<PlusOutlined />} type='primary' onClick={_ => setEditOrder(emptyInvoice(1))} style={{ right: 24 }} />
    
        <Modal title='新建销售清单' open={editOrder} width={1000} centered onCancel={_ => setEditOrder(undefined)} footer={null} maskClosable={false}>
            <SalesOrderEditView order={editOrder} dismiss={_ => setEditOrder(undefined)} messageApi={messageApi} 
                refresh={props.refresh} saveDraft={saveDraft} removeDraft={removeDraft} />
        </Modal>
    </>)
}

export default SalesOrderFB