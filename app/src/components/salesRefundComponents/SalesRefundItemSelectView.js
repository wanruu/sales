import React, { useState, useEffect } from 'react'
import Axios from 'axios'
import { Table, Space, Button, Row, Col, Divider } from 'antd'


const { Column } = Table

import { baseURL } from '../../utils/config'
import { dcInvoice, calTotalAmount } from '../../utils/invoiceUtils'


function SalesRefundItemSelectView(props) {
    const [salesOrders, setSalesOrders] = useState([])
    const [selectedItems, setSelectedItems] = useState(props.editRefund.items);
    

    const load = () => {
        setSalesOrders([])
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: 'salesOrder/detailed',
            'Content-Type': 'application/json',
        }).then(res => {
            var orders = res.data
            if (props.editRefund.partner !== '') {
                orders = orders.filter(o => o.partner === props.editRefund.partner)
            }
            setSalesOrders(orders)
            updateFilters(orders, { id: null, partner: null })
        }).catch(_ => { });
    };

    useEffect(() => {
        load()
    }, [])


    const rowSelection = {
        onChange: (selectedRowKeys, selectedRows) => {
            setSelectedItems(selectedRows)
        },
        selectedRowKeys: selectedItems.map(item => item.orderId + item.productId),
    };


    const onSubmit = () => {
        const newEditRefund = dcInvoice(props.editRefund)
        newEditRefund.items = selectedItems.map(item => {
            const existingItem = props.editRefund.items.find(i => i.orderId === item.orderId && i.productId === item.productId)
            return existingItem !== undefined ? existingItem : item
        })
        newEditRefund.amount = calTotalAmount(newEditRefund.items)
        if (selectedItems.length > 0) {
            newEditRefund.partner = salesOrders.find(o => o.id === selectedItems[0].orderId).partner
        }
        props.setEditRefund(newEditRefund)
        props.dismiss()
    }

    // -------------- filters --------------
    const [idFilters, setIdFilters] = useState([])
    const [partnerFilters, setPartnerFilters] = useState([])

    const updateFilters = (orders, filters) => {
        const newPartnerFilters = orders.filter(o => filters.id == null || filters.id.includes(o.id)).reduce((pre, cur) => {
            if (pre.find(o => o.value === cur.partner) === undefined) {
                pre.push({ text: cur.partner, value: cur.partner })
            }
            return pre
        }, [])
        setPartnerFilters(newPartnerFilters)
        const newIdFilters = orders.filter(o => filters.partner == null || filters.partner.includes(o.partner)).map(o => {
            return { text: o.id, value: o.id }
        })
        setIdFilters(newIdFilters)
    }
    const onTableChange = (pagination, filters, sorter, extra) => {
        updateFilters(salesOrders, filters)
    }
    // ------------------------------------------

    return (<>
        <Row>
            <Col span={12}>已选择 {selectedItems.length} 项</Col>
            <Col span={12} align='right'>
                <Space>
                    <Button onClick={props.dismiss}>取消</Button>
                    <Button type='primary' onClick={onSubmit}>确定</Button>
                </Space>
            </Col>
        </Row>
        <br/>
        
        <Table dataSource={salesOrders} size='small' rowKey={record => record.id} onChange={onTableChange}
        pagination={false} style={{height: 400}} scroll={{x: 'max-content', y: 400 }}
        expandable={{
            expandedRowRender: (record) => (
                <Table dataSource={record.items} pagination={false} bordered rowKey={record => record.orderId + record.productId} rowSelection={rowSelection}>
                    <Column title='材质' dataIndex='material' align='center' />
                    <Column title='名称' dataIndex='name' align='center' />
                    <Column title='规格' dataIndex='spec' align='center' />
                    <Column title='数量' dataIndex='quantity' align='center' />
                    <Column title='单位' dataIndex='unit' align='center' />
                    <Column title='单价' dataIndex='price' align='center' />
                    <Column title='折后价' dataIndex='amount' align='center' />
                    <Column title='备注' dataIndex='remark' align='center' />
                </Table>
            ),
            rowExpandable: (record) => record.items !== undefined,
            defaultExpandedRowKeys: props.editRefund.items.length === 0 ? [] : [props.editRefund.items[0].orderId]
        }}>
            <Column title='销售单号' dataIndex='id' width={180} 
                filterSearch onFilter={(value, record) => record.id.includes(value)} filters={idFilters}
                sorter={(a, b) =>  a.id > b.id} 
            /> 
            <Column title='客户' dataIndex='partner' 
                filterSearch onFilter={(value, record) => record.partner.includes(value)} filters={partnerFilters}
            />
            <Column title='总金额' dataIndex='amount' width={180} />
        </Table>
        <Divider />
    </>)
}


export default SalesRefundItemSelectView