import React from "react";
import { useEffect, useState, } from "react";
import { Table, Modal, Button, message, Input, DatePicker, Col, InputNumber, 
    Row, FloatButton, Space, Popover, Divider 
} from "antd";
import { PlusOutlined, InboxOutlined } from '@ant-design/icons'
import { Decimal } from 'decimal.js';
import dayjs from 'dayjs'
import Axios from "axios";

const { Column } = Table

import SalesRefundItemSelectView from "./SalesRefundItemSelectView";
import { emptySalesRefund, calItemAmount, calTotalAmount, dcSalesRefund
} from '../../utils/salesRefundUtils'
import { baseURL, dateFormat } from "../../utils/config";


function SalesRefundFB(props) {
    const [isNewRefundModalOpen, setIsNewRefundModalOpen] = useState(false)
    const [isSelectionModalOpen, setSelectionModalOpen] = useState(false)
    const [editRefund, setEditRefund] = useState(emptySalesRefund())
    const [draftRefunds, setDraftRefunds] = useState([])
    const [isUploading, setIsUploading] = useState(false)
    const [messageApi, contextHolder] = message.useMessage();


    // modal show/hide
    const showNewRefundModal = () => {
        setIsNewRefundModalOpen(true)
    }
    const hideNewRefundModal = () => {
        setIsNewRefundModalOpen(false)
    }
    const showSelectionModal = () => {
        setSelectionModalOpen(true)
    }
    const hideSelectionModal = () => {
        setSelectionModalOpen(false)
    }

    // user editing
    const updateDate = (value) => {
        const newRefund = dcSalesRefund(editRefund)
        newRefund.date = value
        setEditRefund(newRefund)
    }
    const updatePayment = (value) => {
        const newRefund = dcSalesRefund(editRefund)
        newRefund.payment = value
        setEditRefund(newRefund)
    }
    const updateRow = (invoiceItemId, field, value) => {
        const ifUpdateAmount = field === 'quantity'
        const newEditRefund = dcSalesRefund(editRefund)
        newEditRefund.items = newEditRefund.items.map(item => {
            if (item.invoiceItemId === invoiceItemId) { item[field] = value }
            if (ifUpdateAmount) {
                const { originalAmount, amount } = calItemAmount(item)
                item.originalAmount = originalAmount
                item.amount = amount
            }
            return item
        })
        if (ifUpdateAmount) {
            newEditRefund.amount = calTotalAmount(newEditRefund.items)
        }
        setEditRefund(newEditRefund)
    }

    // draft
    const saveDraft = () => {
        const isOldDraft = editRefund.draftTime !== undefined
        const newRefund = dcSalesRefund(editRefund)
        newRefund.draftTime = dayjs()
        var newDraftRefunds = draftRefunds
        if (isOldDraft) {
            newDraftRefunds = newDraftRefunds.filter(refund => refund.draftTime !== editRefund.draftTime)
        }
        newDraftRefunds.unshift(newRefund)
        setDraftRefunds(newDraftRefunds)
        setEditRefund(emptySalesRefund())
        hideNewRefundModal()
    }
    const removeDraft = (draft) => {
        setDraftRefunds(draftRefunds.filter(d => d.draftTime !== draft.draftTime))
    }
    const openDraft = (draft) => {
        setEditRefund(draft)
        setIsNewRefundModalOpen(true)
    }

    // upload refund
    const upload = () => {
        setIsUploading(true)
        // clean data
        const refund = dcSalesRefund(editRefund);
        refund.date = refund.date.format(dateFormat);
        refund.items = refund.items.map(item => {
            item.quantity = item.quantity || '0'
            return item
        });
        refund.payment = refund.payment || '0'
        
        Axios({
            method: 'post',
            baseURL: baseURL(),
            url: 'salesRefund',
            data: refund,
            'Content-Type': 'application/json',
        }).then(res => {
            setEditRefund(emptySalesRefund())
            hideNewRefundModal()
            removeDraft(refund)
            if (props.refresh !== undefined) {
                props.refresh()
            }
            messageApi.open({ type: 'success', content: '保存成功', });
            setIsUploading(false)
        }).catch(_ => {
            messageApi.open({ type: 'error', content: '保存失败', });
            setIsUploading(false)
        });
    }

    return (<>
        {contextHolder}
        <Popover title={`草稿箱 (${draftRefunds.length})`} placement="topLeft" zIndex={999} trigger='click' content={
            <Table className='draftTable' dataSource={draftRefunds} size='small' pagination={{pageSize: 5, size: 'small'}} hideOnSinglePage bordered>
                <Column title='保存时间' dataIndex='draftTime' align='center' render={time => time.format('HH:mm:ss')} />
                <Column title='收货单位' dataIndex='partner' align='center' />
                <Column title='产品数' dataIndex='items' align='center' render={items => items.length} />
                <Column title='操作' align='center' render={(_, draft) => (
                    <Space.Compact size='small'>
                        <Button type='link' size='small' onClick={_ => openDraft(draft)}>编辑</Button>
                        <Button type='link' danger size='small' onClick={_ => removeDraft(draft)}>删除</Button>
                    </Space.Compact>
                )} />
            </Table>
        } destroyTooltipOnHide>
            <FloatButton icon={<InboxOutlined />} style={{ right: 80, }} badge={{
                count: draftRefunds.length,
                color: 'blue',
            }} />
        </Popover>
        
        <FloatButton icon={<PlusOutlined />} type='primary' onClick={showNewRefundModal} style={{ right: 24, }} />
        
        <Modal title='新建销售退货' open={isNewRefundModalOpen} width={1000} centered onCancel={hideNewRefundModal} footer={
            <Space>
                <Button onClick={saveDraft}>保存草稿</Button>
                <Button onClick={upload} type='primary' loading={isUploading} disabled={editRefund.items.length===0}>保存</Button>
            </Space>
        }>
            <Row style={{ marginTop: '20px', marginBottom: '15px' }}>
                <Col span={8}>
                    客户：{editRefund.partner === '' ? <span style={{color: 'gray'}}>(选择产品后自动显示)</span> : editRefund.partner}
                </Col>
                <Col span={8} align='center'>日期：<DatePicker size='small' value={editRefund.date} onChange={value => updateDate(value)}/></Col>
                <Col span={8} align='right'>
                    <Button type='primary' onClick={showSelectionModal}>选择销售单及产品</Button>
                    </Col>
            </Row>

            <Table className='editTable' dataSource={editRefund.items} size='small' bordered style={{height: 400}} 
            scroll={{x: 'max-content', y: 400 }} pagination={false} rowKey={r => r.invoiceItemId} >
                <Column align='center' width={30} render={(_, __, idx) => idx+1} />
                <Column title='材质' dataIndex='material' align='center' width={45} />
                <Column title='名称' dataIndex='name' align='center' width={80} />
                <Column title='规格' dataIndex='spec' align='center' width={60} />
                <Column title='数量' dataIndex='quantity' align='center' width={60} render={(_, row) => 
                    <InputNumber min={0} stringMode keyboard={false} size='small' controls={false} style={{width: '100%'}} 
                    value={row.quantity} onChange={value => updateRow(row.invoiceItemId, 'quantity', value)} />
                } />
                <Column title='单位' dataIndex='unit' align='center' width={50} />
                <Column title='单价' dataIndex='price' align='center' width={70} />
                <Column title='金额' dataIndex='originalAmount' align='center' width={80} render={originalAmount => 
                    originalAmount.toString()
                } />
                <Column title='折扣' dataIndex='discount' align='center' width={50} />
                <Column title='折后价' dataIndex='amount' align='center' width={80} render={amount => 
                    amount.toString()
                } />
                <Column title='备注' dataIndex='remark' align='center' width={90} render={(_, row) => 
                    <Input size='small' style={{width: '100%'}} value={row.remark} onChange={e => updateRow(row.invoiceItemId, 'remark', e.target.value)} />
                } />
                <Column title='操作' align="center" width={90} render={(_, __, idx) => 
                    <Button size='small' danger type='link' style={{fontSize: '12px'}} onClick={_ => {
                        const r = dcSalesRefund(editRefund)
                        r.items.splice(idx, 1)
                        r.amount = calTotalAmount(r.items)
                        if (r.items.length === 0) {
                            r.partner = ''
                        }
                        setEditRefund(r)
                    }}>删除</Button>
                } />
            </Table>
            <Divider />
            <Row>
                <Col span={12}>总计：{editRefund.amount.toString()}</Col>
                <Col span={12}>
                    付款：<InputNumber size='small' keyboard={false} stringMode controls={false} style={{width: '90%', maxWidth: '150px'}} 
                        value={editRefund.payment} onChange={value => updatePayment(value)}
                    />
                </Col>
            </Row>
        </Modal>
        <Modal title='选择销售单及产品' open={isSelectionModalOpen} width={1000} center onCancel={hideSelectionModal} footer={null} destroyOnClose>
            <SalesRefundItemSelectView editRefund={editRefund} setEditRefund={setEditRefund} dismiss={hideSelectionModal}/>
        </Modal>
    </>)
}

export default SalesRefundFB