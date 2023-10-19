import Axios from 'axios'
import { Table, Modal, Button, Space, message, AutoComplete, DatePicker, 
    Select, Col, Row, InputNumber, Input, Divider, Badge, 
} from "antd";
import React, { useEffect, useState, useRef } from "react";
import { Decimal } from 'decimal.js';
const { Column } = Table
import { FieldNumberOutlined, EditOutlined, RedoOutlined } from '@ant-design/icons';


import { baseURL, dateFormat, unitOptions } from "../../utils/config";
import { emptySalesOrder, dcSalesOrder, calTotalAmount, calItemAmount, emptySalesOrderItem, 
    isSalesOrderItemEmpty, isSalesOrderItemComplete 
} from "../../utils/salesOrderConfig";
import './index.css';


function SalesOrderEditView(props) {
    const [order, setOrder] = useState(emptySalesOrder())
    const [editOrder, setEditOrder] = useState(emptySalesOrder())
    const [messageApi, contextHolder] = message.useMessage();

    const load = () => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: `salesOrder/id/${props.id}`,
            'Content-Type': 'application/json',
        }).then(res => {
            setOrder(res.data);
            setEditOrder(dcSalesOrder(res.data));
        }).catch(err => { });
    } 

    useEffect(() => {
        const newEditOrder = dcSalesOrder(editOrder)
        if (editOrder.items.length === 0 || !isSalesOrderItemEmpty(editOrder.items.at(-1))) {
            newEditOrder.items.push(emptySalesOrderItem())
            setEditOrder(newEditOrder)
        } else if (editOrder.items.length >= 2 && isSalesOrderItemEmpty(editOrder.items.at(-2))) {
            newEditOrder.items.pop()
            setEditOrder(newEditOrder)
        }
    }, [editOrder])

    useEffect(() => {
        load()
    }, [])

    const updatePartner = (value) => {
        const newOrder = dcSalesOrder(editOrder)
        newOrder.partner = value
        setEditOrder(newOrder)
    }
    const updateDate = (value) => {
        const newOrder = dcSalesOrder(editOrder)
        newOrder.date = value
        setEditOrder(newOrder)
    }
    const updatePrepayment = (value) => {
        const newOrder = dcSalesOrder(editOrder)
        newOrder.prepayment = value
        setEditOrder(newOrder)
    }
    const updatePayment = (value) => {
        const newOrder = dcSalesOrder(editOrder)
        newOrder.payment = value
        setEditOrder(newOrder)
    }
    const updateRow = (idx, field, value) => {
        const newEditOrder = dcSalesOrder(editOrder)
        newEditOrder.items[idx][field] = value
        const ifUpdateAmount = ['quantity', 'unit', 'price', 'discount'].includes(field)
        if (ifUpdateAmount) {
            const { originalAmount, amount } = calItemAmount(newEditOrder.items[idx])
            newEditOrder.items[idx].originalAmount = originalAmount.toString()
            newEditOrder.items[idx].amount = amount.toString()
        }
        if (ifUpdateAmount) {
            newEditOrder.amount = calTotalAmount(newEditOrder.items).toString()
        }
        setEditOrder(newEditOrder)
    }
    const getInputStatus = (rowIdx, field) => {
        if (rowIdx > order.items.length - 1 || order.items[rowIdx][field] === editOrder.items[rowIdx][field]) {
            return ''
        } 
        return 'warning'
    }
    const getDisabled = (rowIdx) => {
        if (editOrder.items[rowIdx].deleted === true) {
            return true
        }
        return false
    }
    const calPayment = () => {
        const total = Decimal(editOrder.amount)
        const prepayment = Decimal(editOrder.prepayment==null || editOrder.prepayment=='' ? '0' : editOrder.prepayment)
        return total.minus(prepayment).toString()
    }
    const removeItem = (rowIdx) => {
        const newEditOrder = dcSalesOrder(editOrder)
        if (rowIdx < order.items.length) {
            newEditOrder.items[rowIdx].deleted = true
        } else {
            newEditOrder.items.splice(rowIdx, 1)
        }
        setEditOrder(newEditOrder)
    }
    const recoverItem = (rowIdx) => {
        const newEditOrder = dcSalesOrder(editOrder)
        if (rowIdx < order.items.length) {
            newEditOrder.items[rowIdx].deleted = false
        }
        setEditOrder(newEditOrder)
    }
    
    // ----- upload data -----
    const getUploadData = () => {
        const readyItems = editOrder.items.filter(item => !isSalesOrderItemEmpty(item)) // include deleted
        // ------------------
        const salesOrderChange = {}
        if (editOrder.partner !== order.partner) {
            salesOrderChange.partner = editOrder.partner
        }
        if (editOrder.date.format(dateFormat) !== order.date) {
            salesOrderChange.date = editOrder.date.format(dateFormat)
        }
        if (editOrder.amount !== order.amount) {
            salesOrderChange.amount = editOrder.amount
        }
        if (editOrder.prepayment !== order.prepayment) {
            salesOrderChange.prepayment = editOrder.prepayment
        }
        if (editOrder.payment !== order.payment) {
            salesOrderChange.payment = editOrder.payment
        }
        // ------------------
        const deleteOrderItems = readyItems.filter(item => item.deleted === true).map(item => { 
            return {
                id: item.id, productId: item.productId, quantity: item.quantity
            }
        })
        // ------------------
        const newOrderItems = readyItems.slice(order.items.length, editOrder.items.length)
        // ------------------
        const updatedOrderItems = readyItems.slice(0, order.items.length).filter((item, idx, _) => {
            if (item.deleted === true) { return false }
            return ['material', 'name', 'spec', 'price', 'discount', 'quantity', 'originalAmount', 'amount', 'remark'].reduce((pre, cur) => {
               return item[cur] != order.items[idx][cur] || pre
            }, false)  // 有改变true，无改变false
        }).map(item => Object.assign(item, { 
            originalQuantity: order.items.find(i => i.id === item.id).quantity
        }))
        console.log(updatedOrderItems)
        // ------------------
        const updatedSalesRefundItems = []  // [{refundId,id,originalAmount,amount}]
        // TODO
        return { 
            salesOrderChange: salesOrderChange,
            deleteOrderItems: deleteOrderItems,
            newOrderItems: newOrderItems,
            updatedOrderItems: updatedOrderItems,
            updatedSalesRefundItems: updatedSalesRefundItems,
        }
    }

    const upload = () => {
        // check data
        const nIncomplete = editOrder.items.filter(item => !isSalesOrderItemComplete(item) && !isSalesOrderItemEmpty(item)).length;
        var isRepeat = false;
        for (const item1 of editOrder.items) {
            for (const item2 of editOrder.items) {
                if (item1.id !== item2.id && item1.name === item2.name && item1.spec === item2.spec && item1.material === item2.material) {
                    isRepeat = true;
                    break;
                }
            }
            if (isRepeat) {
                break;
            }
        }
        if (editOrder.partner === '') {
            messageApi.open({ type: 'error', content: '收货单位不得为空', });
        //     // setIsUploading(false)
        } else if (nIncomplete > 0) {
            messageApi.open({ type: 'error', content: '表格填写不完整', });
        //     // setIsUploading(false)
        } else if (isRepeat) {
            messageApi.open({ type: 'error', content: '产品材质、名称、规格不得重复', });
        //     // setIsUploading(false)
        } else {
            Axios({
                method: 'put',
                baseURL: baseURL(),
                url: `salesOrder/id/${order.id}`,
                data: getUploadData(),
                'Content-Type': 'application/json',
            }).then(res => {
                if (res.status === 200) {
                    messageApi.open({ type: 'success', content: '保存成功', });
                    load()
                    if (props.refresh !== undefined) {
                        props.refresh()
                    }
                    // hideModal()
                    // removeDraft(order)
                    // if (props.refresh !== undefined) {
                        // props.refresh()
                    // }
                } else {
                    messageApi.open({ type: 'error', content: `${res.status}: 保存失败`, });
                }
                // setIsUploading(false)
            }).catch(_ => {
                messageApi.open({ type: 'error', content: '保存失败', });
                // setIsUploading(false)
            });
        }
    }


    return (<>
        {contextHolder}
        <Row style={{marginTop: '20px', marginBottom: '15px'}}>
            <Col span={8}>
                客户：<AutoComplete status={editOrder.partner !== order.partner ? 'warning' : ''} 
                style={{width: 120}} size='small' value={editOrder.partner} 
                onChange={value => updatePartner(value)} />
            </Col>
            <Col span={8} align='center'>
                日期：<DatePicker status={editOrder.date.format(dateFormat) !== order.date ? 'warning' : ''}
                size='small' value={editOrder.date} onChange={value => updateDate(value)}/>
            </Col>
            <Col span={8} align='right'>
                <FieldNumberOutlined /> {props.id.toString().padStart(6, '0')} <Button size='small' icon={<RedoOutlined/>} />
            </Col>
        </Row>
        <Table className='editTable' dataSource={editOrder.items} size='small' bordered style={{height: 400}} 
        scroll={{x: 'max-content', y: 400 }} pagination={false}>
            <Column align='center' width={30} render={(_, row, idx) => {
                if (row.deleted === true) {
                    return ''
                }
                const no = editOrder.items.slice(0,idx).filter(item => item.deleted !== true).length + 1
                return idx < order.items.length ? no : <Badge dot status='success'>{no}</Badge>} 
            } />
            <Column title='材质' dataIndex='material' align='center' width={45} render={(_, row, idx) => 
                <AutoComplete size='small' style={{width: '100%'}} status={getInputStatus(idx, 'material')}
                value={row.material} disabled={getDisabled(idx)} onChange={value => updateRow(idx, 'material', value)} />
            } />
            <Column title='名称' dataIndex='name' align='center' width={80} render={(_, row, idx) => 
                <AutoComplete size='small' style={{width: '100%'}} status={getInputStatus(idx, 'name')}
                value={row.name} disabled={getDisabled(idx)} onChange={value => updateRow(idx, 'name', value)} />
            } />
            <Column title='规格' dataIndex='spec' align='center' width={60} render={(_, row, idx) => 
                <AutoComplete size='small' style={{width: '100%'}} status={getInputStatus(idx, 'spec')}
                value={row.spec} disabled={getDisabled(idx)} onChange={value => updateRow(idx, 'spec', value)} />
            } />
            <Column title='数量' dataIndex='quantity' align='center' width={60} render={(_, row, idx) => 
                <InputNumber stringMode keyboard={false} size='small' controls={false} style={{width: '100%'}} 
                status={getInputStatus(idx, 'quantity')} disabled={getDisabled(idx)}
                value={row.quantity} onChange={value => updateRow(idx, 'quantity', value)} />
            } />
            <Column title='单位' dataIndex='unit' align='center' width={50} render={(_, row, idx) => 
                <Select status={getInputStatus(idx, 'unit')} disabled={getDisabled(idx)}
                size='small' options={unitOptions} align='center' style={{width: '100%'}} value={row.unit} 
                onChange={value => updateRow(idx, 'unit', value)} />
            } />
            <Column title='单价' dataIndex='price' align='center' width={70} render={(_, row, idx) => 
                <InputNumber status={getInputStatus(idx, 'price')} disabled={getDisabled(idx)}
                stringMode keyboard={false} size='small' controls={false} style={{width: '100%'}} value={row.price} 
                onChange={value => updateRow(idx, 'price', value)} />
            } />
            <Column title='金额' dataIndex='originalAmount' align='center' width={80} render={(amount, _, idx) => {
                if (getDisabled(idx)) {
                    return <strike>{amount.toString()}</strike>
                }
                return amount
            }} />
            <Column title='折扣' dataIndex='discount' align='center' width={50} render={(_, row, idx) => 
                <InputNumber keyboard={false} size='small' min={0} max={100} controls={false} style={{width: '100%'}} 
                status={getInputStatus(idx, 'discount')} disabled={getDisabled(idx)}
                value={row.discount} onChange={value => updateRow(idx, 'discount', value)}
                formatter={(value) => `${value}%`}
                parser={(value) => value.replace('%', '')} />
            } />
            <Column title='折后价' dataIndex='amount' align='center' width={80} render={(amount, _, idx) => {
                if (getDisabled(idx)) {
                    return <strike>{amount.toString()}</strike>
                }
                return amount
            }} />
            <Column title='备注' dataIndex='remark' align='center' width={90} render={(_, row, idx) => 
                <Input size='small' style={{width: '100%'}} value={row.remark} 
                status={getInputStatus(idx, 'remark')} disabled={getDisabled(idx)}
                onChange={e => updateRow(idx, 'remark', e.target.value)} />
            } />
            <Column title='操作' align='center' width={80} render={(_, row, idx) => 
                <Space.Compact size='small'>
                    {idx < order.items.length ?
                        <Button type='link' style={{fontSize: '12px'}} disabled={row.refundIds===undefined}>退货单</Button> : null
                    }
                    {editOrder.items[idx].deleted === true ?
                        <Button type='link' style={{fontSize: '12px'}} onClick={_ => recoverItem(idx)}>恢复</Button>:
                        <Button type='link' danger style={{fontSize: '12px'}} onClick={_ => removeItem(idx)}>删除</Button>
                    }
                </Space.Compact>
            } />
        </Table>
        <Divider />
        <Row>
            <Col span={8}>总计：{editOrder.amount.toString()}</Col>
            <Col span={8}>
                预付款：<InputNumber size='small' keyboard={false} stringMode controls={false} style={{width: '90%', maxWidth: '150px'}} 
                    status={order.prepayment === editOrder.prepayment ? '' : 'warning'}
                    value={editOrder.prepayment} onChange={value => updatePrepayment(value)}
                />
            </Col>
            <Col span={8}>
                付款：<InputNumber size='small' keyboard={false} stringMode controls={false} style={{width: '90%', maxWidth: '150px'}} 
                    status={order.payment === editOrder.payment ? '' : 'warning'}
                    placeholder={`应付 ${calPayment()}`}
                    value={editOrder.payment} onChange={value => updatePayment(value)}
                /> 
                <Button size='small' style={{marginLeft: '5px'}} icon={<EditOutlined />}
                onClick={_ => updatePayment(calPayment())} />
            </Col>
        </Row>
        <br/>
        <Row>
            <Col span={8} offset={16} align='right'>
                <Button type='primary' onClick={upload}>保存</Button>
            </Col>
        </Row>
    </>)
}


export default SalesOrderEditView