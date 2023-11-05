import React, { useState, useEffect } from "react";
import { Table, Input, Space, Button, Modal, Form, message, Row, Card } from "antd";
import  Axios  from "axios";
import { ExclamationCircleFilled, TableOutlined, PlusOutlined, ClearOutlined } from '@ant-design/icons';


const { Column } = Table;
const { confirm } = Modal;
const { Item } = Form

import { baseURL } from "../utils/config";
import ProductEditView from "../components/productComponents/ProductEditView";


function FuncBar(props) {
    const updateConditions = (field, value) => {
        const conds = JSON.parse(JSON.stringify(props.filterConditions))
        conds[field] = value
        props.setFilterConditions(conds)
    }
    const style = { marginTop: '8px', marginBottom: '8px', marginLeft: '10px', marginRight: '10px' }
    return <Card size='small'>
        <Row>
            <Item label='材质' style={style}>
                <Input allowClear placeholder='材质' onChange={e => updateConditions('material', e.target.value)} />
            </Item>
            <Item label='名称' style={style}>
                <Input allowClear placeholder='名称' onChange={e => updateConditions('name', e.target.value)} />
            </Item>
            <Item label='规格' style={style}>
                <Input allowClear placeholder='规格' onChange={e => updateConditions('spec', e.target.value)} />
            </Item>
            <Item style={style}>
                <Space>
                    <Button icon={<PlusOutlined />} type='primary' onClick={props.create}>新增</Button>
                    <Button icon={<TableOutlined />}>导出</Button>
                    <Button icon={<ClearOutlined />} danger>批量清理</Button>
                </Space>
            </Item>
        </Row>
    </Card>
}


function ProductPage(props) {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([])
    const [filterConditions, setFilterConditions] = useState({material: '', name: '', spec: ''})

    const [newProduct, setNewProduct] = useState(false)
    const [editProduct, setEditProduct] = useState(undefined)

    const [messageApi, contextHolder] = message.useMessage();

    const load = () => {
        setProducts([])
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: '/product',
            'Content-Type': 'application/json',
        }).then(res => {
            setProducts(res.data)
        }).catch(_ => { })
    }

    const showDeleteConfirm = (productId) => {
        confirm({
            title: `是否删除产品 ${productId}?`,
            icon: <ExclamationCircleFilled />,
            content: '确认删除后不可撤销',
            okText: '删除',
            okType: 'danger',
            cancelText: '取消',
            onOk() { 
                Axios({
                    method: 'delete',
                    baseURL: baseURL(),
                    url: `/product/id/${productId}`,
                    'Content-Type': 'application/json',
                }).then(res => {
                    messageApi.open({ type: 'success', content: '删除成功', });
                    load()
                }).catch(err => {
                    messageApi.open({ type: 'error', content: `删除失败：${err}`, });
                });
            },
        });
    }

    const filterProducts = () => {
        setFilteredProducts(products.filter(p => 
            (filterConditions.material === '' || p.material.includes(filterConditions.material)) &&
            (filterConditions.name === '' || p.name.includes(filterConditions.name)) &&
            (filterConditions.spec === '' || p.spec.includes(filterConditions.spec))
        ))
    }

    useEffect(() => {
        load()
    }, [])

    useEffect(() => {
        filterProducts()
    }, [products, filterConditions])


    return (<div style={props.style || {}}>
        {contextHolder}
        <Modal open={editProduct !== undefined} onCancel={_ => setEditProduct(undefined)} title='编辑产品' footer={null} destroyOnClose>
            <ProductEditView product={editProduct} editProduct={editProduct} dismiss={_ => setEditProduct(undefined)} refresh={load} />
        </Modal>

        <Modal open={newProduct} onCancel={_ => setNewProduct(false)} title='新建产品' footer={null} destroyOnClose>
            <ProductEditView editProduct={{material:'',name:'',spec:'',quantity:'',unit:''}} dismiss={_ => setNewProduct(false)} refresh={load} />
        </Modal>

        <br />
        <Space direction="vertical" style={{ width: '100%' }}>
            <FuncBar filterConditions={filterConditions} setFilterConditions={setFilterConditions} create={_ => setNewProduct(true)} />

            <Table dataSource={filteredProducts} size='small' bordered rowKey={record => record.id}
            pagination={{ defaultPageSize: 50, showSizeChanger: true, pageSizeOptions: [50, 100], showQuickJumper: true }} >
                <Column title='序号' align='center' render={(_, __, idx) => idx+1} />
                <Column title='材质' dataIndex='material' align='center' />
                <Column title='名称' dataIndex='name' align='center' />
                <Column title='规格' dataIndex='spec' align='center' />
                <Column title='库存' dataIndex='quantity' align='center' render={quantity => 
                    <span style={{ color: quantity[0] == '-' ? 'red': 'black' }}>{quantity}</span>
                } />
                <Column title='单位' dataIndex='unit' align='center' />
                <Column title='操作' align='center' render={(_, record) => (
                    <Space.Compact size='small'>
                        <Button type='link' onClick={_ => setEditProduct(record)}>编辑</Button>
                        {record.invoiceNum > 0 ?
                            <Button type='link'>查看</Button> :
                            <Button type='link' danger onClick={_ => showDeleteConfirm(record.id)}>删除</Button>
                        }
                    </Space.Compact>
                )} />
            </Table>
        </Space>
    </div>)
}

export default ProductPage