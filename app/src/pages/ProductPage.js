import React, { useState, useEffect } from "react";
import { Table, AutoComplete, Space, DatePicker, Button, Modal, Col } from "antd";
import  Axios  from "axios";

const { Column } = Table;

import { baseURL } from "../utils/config";

function ProductPage() {
    const [products, setProducts] = useState([]);

    const load = () => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: '/product',
            params: { },
            'Content-Type': 'application/json',
        }).then(res => {
            if (res.status === 200) {
                setProducts(res.data)
            } else {
                // TODO
            }
        }).catch(_ => {
            // TODO
        });
    };

    useEffect(() => {
        load()
    }, [])

    return (
        <Table dataSource={products} size='small' bordered 
        pagination={{ defaultPageSize: 50, showSizeChanger: true, pageSizeOptions: [50, 100], showQuickJumper: true }} >
            <Column title='编号' align='center' render={(_, __, idx) => idx+1} />
            <Column title='材质' dataIndex='material' align='center' sorter={(a, b) => a.material > b.material ? 1 : (a.material === b.material ? 0 : -1)} />
            <Column title='名称' dataIndex='name' align='center' sorter={(a, b) => a.name > b.name ? 1 : (a.name === b.name ? 0 : -1)} />
            <Column title='规格' dataIndex='spec' align='center' sorter={(a, b) => a.spec > b.spec ? 1 : (a.spec === b.spec ? 0 : -1)} />
            <Column title='库存' dataIndex='quantity' align='center' render={(quantity, p) => {
                const color = quantity[0] == '-' ? 'red': 'black'
                return <span style={{color: color}}>{quantity} {p.unit}</span>
            }} />
            {/* <Column title='销量' dataIndex='quantity' align='center' sorter={(a, b) => a.quantity - b.quantity} render={quantity => (
                quantity.toLocaleString(undefined, { maximumFractionDigits: 2 })
            )} /> */}
            {/* <Column title='金额' dataIndex='amount' align='center' sorter={(a, b) => a.amount - b.amount} render={amount => (
                '¥ ' + amount.toLocaleString(undefined, { maximumFractionDigits: 2 })
            )} /> */}
            {/* <Column title='操作' dataIndex='oper' align='center' render={(_, product) => (
                <Button type="primary" ghost onClick={() => loadProduct(product.material, product.name, product.spec, product.quantity, product.amount)}>详情</Button>
            )} /> */}
        </Table>
    );
}

export default ProductPage