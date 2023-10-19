import React, { useState, useEffect } from 'react'
import Axios from 'axios'
import { Table, Space, Button, Row, Col, Input, AutoComplete } from 'antd'
import Decimal from 'decimal.js'


const { Column } = Table


import { baseURL } from '../../utils/config'

function SalesRefundItemSelectView(props) {
    const [salesOrders, setSalesOrders] = useState([])
    const [selectedItems, setSelectedItems] = useState([]);

    const load = () => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: 'salesOrder/detailed',
            'Content-Type': 'application/json',
        }).then(res => {
            if (res.status === 200) {
                setSalesOrders(res.data.filter(order => order.partner === props.partner))
            }
        }).catch(_ => {
            
        });
    };

    useEffect(() => {
        load()
    }, [])


    const rowSelection = {
        getCheckboxProps: (record) => ({
            id: record.orderItemId,
        }),
        onSelect: (record, selected, selectedRows, nativeEvent) => {
            const orderId = record.orderId
            const newSelectedItems = selectedItems.filter(item => item.orderId !== orderId)
            setSelectedItems(newSelectedItems.concat(selectedRows))
        },
        onSelectAll: (selected, selectedRows, changeRows) => {
            const orderId = changeRows[0].orderId
            const newSelectedItems = selectedItems.filter(item => item.orderId !== orderId)
            setSelectedItems(newSelectedItems.concat(selectedRows))
        },
        onSelectMultiple: (selected, selectedRows, changeRows) => {
            const orderId = changeRows[0].orderId
            const newSelectedItems = selectedItems.filter(item => item.orderId !== orderId)
            setSelectedItems(newSelectedItems.concat(selectedRows))
        }
    };

    return (<>
        <Row>
            <Col span={12}>已选择 {selectedItems.length} 项</Col>
            <Col span={12} align='right'>
                <Space>
                    <Button onClick={_ => props.addSelections([])}>取消</Button>
                    <Button type='primary' onClick={_ => props.addSelections(selectedItems)}>添加</Button>
                </Space>
            </Col>
        </Row>
        <br/>
        
        <Table dataSource={salesOrders}  size='small' showHeader={false}
        rowKey={record => record.id}
        pagination={false}
        style={{height: 400}} scroll={{x: 'max-content', y: 400 }}
        expandable={{
            expandedRowRender: (record) => (
                <Table dataSource={record.items} pagination={false} bordered rowKey={record => record.orderItemId} rowSelection={rowSelection}>
                    <Column title='材质' dataIndex='material' align='center' />
                    <Column title='名称' dataIndex='name' align='center' />
                    <Column title='规格' dataIndex='spec' align='center' />
                    <Column title='数量' dataIndex='quantity' align='center' render={(_, record) => `${record.quantity} ${record.unit}` } />
                    <Column title='单价' dataIndex='price' align='center' />
                    <Column title='折后价' dataIndex='amount' align='center' />
                    <Column title='备注' dataIndex='remark' align='center' />
                </Table>
            ),
            rowExpandable: (record) => record.items !== undefined,
        }}>
            <Column render={(_, record) => 
                <Row>
                    <Col span={8}>
                        单号：{record.id.toString().padStart(6, '0')}
                    </Col>
                    <Col span={8}>
                        客户：{record.partner}
                    </Col>
                    <Col span={8}>
                        金额：{record.amount}
                    </Col>
                </Row>
            } />
        </Table>
    </>)
}


export default SalesRefundItemSelectView