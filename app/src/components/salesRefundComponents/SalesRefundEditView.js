import React, { useState, useEffect } from 'react'
import Axios from 'axios'
import { Row, Col, Button, DatePicker, Table, Divider, InputNumber, Input, Modal, message 
} from 'antd'
import dayjs from 'dayjs'

const { Column } = Table

import { emptySalesRefund, dcSalesRefund, calTotalAmount, calItemAmount } from '../../utils/salesRefundUtils'
import { baseURL, dateFormat } from '../../utils/config'
import SalesRefundItemSelectView from "./SalesRefundItemSelectView";


function SalesRefundEditView(props) {
    const [refund, setRefund] = useState(emptySalesRefund())
    const [editRefund, setEditRefund] = useState(emptySalesRefund())
    const [isSelectionModalOpen, setSelectionModalOpen] = useState(false)
    const [messageApi, contextHolder] = message.useMessage();

    const load = () => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: `salesRefund/id/${props.id}`,
            'Content-Type': 'application/json',
        }).then(res => {
            console.log(res.data)
            setRefund(res.data);
            setEditRefund(dcSalesRefund(res.data));
        }).catch(err => { });
    }

    const upload = () => {
        const data = dcSalesRefund(editRefund)
        data.date = data.date.format(dateFormat)
        data.items = data.items.map(item => {
            item.quantity = item.quantity || "0"
            return item
        })
        data.payment = data.payment || "0"
        data.orderId = data.items[0].invoiceId
        Axios({
            method: 'put',
            baseURL: baseURL(),
            url: `salesRefund/id/${props.id}`,
            data: data,
            'Content-Type': 'application/json',
        }).then(res => {
            messageApi.open({ type: 'success', content: '保存成功', });
            load()
            if (props.refresh !== undefined) {
                props.refresh()
            }
        }).catch(err => {
            messageApi.open({ type: 'error', content: '保存失败', });
        });
    }

    // update data
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
    const updateRow = (id, field, value) => {
        const ifUpdateAmount = field === 'quantity'
        const newEditRefund = dcSalesRefund(editRefund)
        newEditRefund.items = newEditRefund.items.map(item => {
            if (item.id === id) { item[field] = value }
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

    useEffect(() => {
        load()
    }, [])

    const showSelectionModal = () => {
        setSelectionModalOpen(true)
    }
    const hideSelectionModal = () => {
        setSelectionModalOpen(false)
    }

    return (<>
        {contextHolder}
        <Row style={{ marginTop: '20px', marginBottom: '15px' }}>
            <Col span={8}>
                客户：{editRefund.partner === '' ? <span style={{color: 'gray'}}>(选择产品后自动显示)</span> : editRefund.partner}
            </Col>
            <Col span={8} align='center'>日期：<DatePicker size='small' value={editRefund.date} onChange={value => updateDate(value)}/></Col>
            <Col span={8} align='right'>
                <Button type='primary' onClick={showSelectionModal}>选择销售单及产品</Button>
            </Col>
        </Row>

        <Table className='editTable' dataSource={editRefund.items} size='small' bordered pagination={false}
            rowKey={r => r.invoiceItemId} style={{height: 400}} scroll={{x: 'max-content', y: 400 }} >
            <Column align='center' width={30} render={(_, __, idx) => idx+1} />
            <Column title='材质' dataIndex='material' align='center' width={45} />
            <Column title='名称' dataIndex='name' align='center' width={80} />
            <Column title='规格' dataIndex='spec' align='center' width={60} />
            <Column title='数量' dataIndex='quantity' align='center' width={60} render={(_, row) => 
                <InputNumber min={0} stringMode keyboard={false} size='small' controls={false} style={{width: '100%'}} value={row.quantity} onChange={value => updateRow(row.id, 'quantity', value)} />
            } />
            <Column title='单位' dataIndex='unit' align='center' width={50} />
            <Column title='单价' dataIndex='price' align='center' width={70} />
            <Column title='金额' dataIndex='originalAmount' align='center' width={80} />
            <Column title='折扣' dataIndex='discount' align='center' width={50} />
            <Column title='折后价' dataIndex='amount' align='center' width={80} />
            <Column title='备注' dataIndex='remark' align='center' width={90} render={(_, row) => 
                <Input size='small' style={{width: '100%'}} value={row.remark} onChange={e => updateRow(row.id, 'remark', e.target.value)} />
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
            <Col span={8}>总计：{editRefund.amount.toString()}</Col>
            <Col span={8} align='center'>
                付款：<InputNumber size='small' keyboard={false} stringMode controls={false}
                    value={editRefund.payment} onChange={value => updatePayment(value)}
                />
            </Col>
            <Col span={8} align='right'>
                <Button type='primary' onClick={upload} disabled={editRefund.items.length===0}>保存</Button>
            </Col>
        </Row>

        <Modal title='选择销售单及产品' open={isSelectionModalOpen} width={1000} center onCancel={hideSelectionModal} footer={null} destroyOnClose>
            <SalesRefundItemSelectView editRefund={editRefund} setEditRefund={setEditRefund} dismiss={hideSelectionModal} />
        </Modal>
    </>)
}


export default SalesRefundEditView