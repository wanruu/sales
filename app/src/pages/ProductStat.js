import { Table, AutoComplete, Space, DatePicker, Button, Modal, Col } from "antd";
import { useState, useEffect } from "react";
import React from 'react';
import Axios from "axios";
import dayjs from 'dayjs';

import { baseURL, dateFormat } from '../config.js'

const { RangePicker } = DatePicker;
const { Column } = Table;


function ProductStat() {
    const [material, setMaterial] = useState('');
    const [name, setName] = useState('');
    const [spec, setSpec] = useState('');
    const [materialOptions, setMaterialOptions] = useState([]);
    const [nameOptions, setNameOptions] = useState([]);
    const [specOptions, setSpecOptions] = useState([]);
    const [dateRange, setDateRange] = useState(null);
    const [data, setData] = useState([]);
    const [selectedData, setSelectedData] = useState(undefined);

    // network
    const searchPrompt = (name, spec, n) => {
        if (name === '') {
            setNameOptions([]);
            return;
        }
        if (spec === '') {
            setSpecOptions([]);
            return;
        }
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: name !== undefined ? 'prompt/productName' : 'prompt/productSpec',
            params: { name: name, spec: spec, maxLen: n },
            'Content-Type': 'application/json',
        }).then(res => {
            if (name !== undefined) {
                setNameOptions(res.data.map(name => ({ value: name })));
            } else {
                setSpecOptions(res.data.map(spec => ({ value: spec })));
            }
        }).catch(_ => {
            setNameOptions([]);
            setSpecOptions([]);
        });
    };
    const searchMaterialPrompt = (material, n) => {
        setMaterialOptions([]);
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: 'prompt/productMaterial',
            params: { keyword: material, maxLen: n },
            'Content-Type': 'application/json',
        }).then(res => {
            setMaterialOptions(res.data.map(material => ({ value: material })));
        }).catch(_ => {
            // TODO
        });
    };
    const loadProducts = () => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: '/stat/product/overview',
            params: {
                material: material === '' ? undefined : material,
                name: name === '' ? undefined : name,
                spec: spec === '' ? undefined : spec,
                start: dateRange !== null && dateRange[0] !== null ? dateRange[0].format('YYYY-MM-DD') : undefined,
                end: dateRange !== null && dateRange[1] !== null ? dateRange[1].format('YYYY-MM-DD') : undefined,
            },
            'Content-Type': 'application/json',
        }).then(res => {
            if (res.status === 200) {
                setData(res.data.map((item, idx) => Object.assign(item, {key: idx+1})));
            } else {
                // TODO
            }
        }).catch(_ => {
            // TODO
        });
    };
    const loadProduct = (material, name, spec, quantity, amount) => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: '/stat/product/detail',
            params: {
                material: material,
                name: name,
                spec: spec,
                start: dateRange !== null && dateRange[0] !== null ? dateRange[0].format('YYYY-MM-DD') : undefined,
                end: dateRange !== null && dateRange[1] !== null ? dateRange[1].format('YYYY-MM-DD') : undefined,
            },
            'Content-Type': 'application/json',
        }).then(res => {
            if (res.status === 200) {
                setSelectedData({
                    material: material,
                    name: name, spec: spec,
                    quantity: quantity, amount: amount,
                    details: res.data.map((item, idx) => Object.assign(item, {key: idx+1})),
                });
            } else {
                setSelectedData(undefined);
            }
        }).catch(_ => {
            setSelectedData(undefined);
        });
    };

    // initial
    useEffect(() => {
        loadProducts();
    }, []);


    return (
        <div>
            <Modal
                open={selectedData !== undefined}
                onCancel={() => setSelectedData(undefined)}
                width='90%'
                footer={<Button onClick={() => setSelectedData(undefined)}>关闭</Button>}
            >
                <br />
                {selectedData === undefined ? '' :
                    <div style={{ fontSize: '14pt', fontWeight: 'bold' }}>
                        材质：{selectedData.material}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        品名：{selectedData.name}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        规格：{selectedData.spec}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        销量：{selectedData.quantity.toLocaleString(undefined, { maximumFractionDigits: 2 })}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        总金额：¥ {selectedData.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                }
                <p>以下为有关该产品的单号详情：</p>

                <Table dataSource={selectedData === undefined ? [] : selectedData.details} size='small' bordered 
                pagination={{ defaultPageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50], showQuickJumper: true }} >
                    <Column title='序号' dataIndex='key' align='center' />
                    <Column title='单号' dataIndex='no' align='center' sorter={(a, b) => a.no > b.no ? 1 : -1} />
                    <Column title='日期' dataIndex='date' align='center' sorter={(a, b) => a.date > b.date ? 1 : (a.date === b.date ? 0 : -1)} render={date => dayjs(date).format(dateFormat)} />
                    <Column title='客户' dataIndex='customer' align='center' sorter={(a, b) => a.customer > b.customer ? 1 : (a.customer === b.customer ? 0 : -1)} />
                    <Column title='数量' dataIndex='quantity' align='center' sorter={(a, b) => a.quantity - b.quantity} render={quantity => quantity.toLocaleString(undefined, { maximumFractionDigits: 2 })} />
                    <Column title='金额' dataIndex='amount' align='center' sorter={(a, b) => a.amount - b.amount} render={amount => '¥ ' + amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} />
                    <Column title='备注' dataIndex='remark' align='center' />
                </Table>
            </Modal>

            <h2>产品数据</h2>
            <Space.Compact block>
                <AutoComplete
                    style={{ width: '20%' }}
                    options={materialOptions}
                    placeholder='材质'
                    onChange={data => setMaterial(data)}
                    allowClear
                    onSearch={text => searchMaterialPrompt(text, 10)}
                    value={material}
                />
                <AutoComplete
                    style={{ width: '20%' }}
                    options={nameOptions}
                    placeholder='品名'
                    onChange={data => setName(data)}
                    allowClear
                    onSearch={text => searchPrompt(text, undefined, 10)}
                    value={name}
                />
                <AutoComplete
                    style={{ width: '20%' }}
                    options={specOptions}
                    placeholder='规格'
                    onChange={data => setSpec(data)}
                    allowClear
                    onSearch={text => searchPrompt(undefined, text, 10)}
                    value={spec}
                />
                <RangePicker
                    style={{ width: '45%' }}
                    format={dateFormat}
                    allowEmpty={[true, true]}
                    onChange={data => { setDateRange(data) }}
                />
                <Button type='primary' onClick={_ => loadProducts()}>搜索</Button>
            </Space.Compact>
            <p style={{ fontSize: '10pt', color: 'gray' }}>
                <em>*若材质、名称或规格为空，则搜索所有材质、名称或规格；开始日期与结束日期同理。</em>
            </p>


            <Table dataSource={data} size='small' bordered pagination={{ defaultPageSize: 20, showSizeChanger: true, pageSizeOptions: [20, 50, 100], showQuickJumper: true }} >
                <Column title='序号' dataIndex='key' align='center' />
                <Column title='材质' dataIndex='material' align='center' sorter={(a, b) => a.material > b.material ? 1 : (a.material === b.material ? 0 : -1)} />
                <Column title='名称' dataIndex='name' align='center' sorter={(a, b) => a.name > b.name ? 1 : (a.name === b.name ? 0 : -1)} />
                <Column title='规格' dataIndex='spec' align='center' sorter={(a, b) => a.spec > b.spec ? 1 : (a.spec === b.spec ? 0 : -1)} />
                <Column title='销量' dataIndex='quantity' align='center' sorter={(a, b) => a.quantity - b.quantity} render={quantity => (
                    quantity.toLocaleString(undefined, { maximumFractionDigits: 2 })
                )} />
                <Column title='金额' dataIndex='amount' align='center' sorter={(a, b) => a.amount - b.amount} render={amount => (
                    '¥ ' + amount.toLocaleString(undefined, { maximumFractionDigits: 2 })
                )} />
                <Column title='操作' dataIndex='oper' align='center' render={(_, product) => (
                    <Button type="primary" ghost onClick={() => loadProduct(product.material, product.name, product.spec, product.quantity, product.amount)}>详情</Button>
                )} />
            </Table>
        </div >
    );
}

export default ProductStat;