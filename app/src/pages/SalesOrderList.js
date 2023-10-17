import React from 'react'
import Axios from 'axios'
import { Table, Modal, Button, Space, message, AutoComplete, DatePicker, Switch, Col, Row } from "antd";
import { useEffect, useState, useRef } from "react";
const Decimal = require('decimal')

const { Column } = Table

import SalesOrderFB from '../components/floatButtons/SalesOrderFB'
import { baseURL } from '../utils/config';

function SalesOrderList() {
    const [salesOrders, setSalesOrders] = useState([])

    const load = () => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: 'salesOrder',
            params: {  },
            'Content-Type': 'application/json',
        }).then(res => {
            if (res.status === 200) {
                setSalesOrders(res.data)
            }
        }).catch(_ => {
            
        });
    };

    useEffect(() => {
        load()
    }, [])

    return (<>
        <SalesOrderFB />
        <Table dataSource={salesOrders} bordered size='small' 
        pagination={{defaultPageSize: 50, pageSizeOptions: [50, 100], showQuickJumper: true, showSizeChanger: true}}>
            <Column title='编号' align='center' render={(_, __, idx) => idx+1} />
            <Column title='单号' dataIndex='id' align='center' render={id => 
                `${id}`.padStart(6, '0')
            } />
            <Column title='收货单位' dataIndex='partner' align='center' />
            <Column title='金额' dataIndex='amount' align='center' render={amount => 
                `${amount}`
            } />
            <Column title='已付款' align='center' render={(_, row) => {
                const amount = Decimal(Decimal(row.payment).add(row.prepayment).toNumber())
                const color = amount.toString() === Decimal(row.amount).toString() ? 'black' : 'red'
                return <span style={{color: color}}>{amount.toString()}</span>
            }} />
            <Column title='操作' align='center' />
        </Table>
    </>)
}


export default SalesOrderList