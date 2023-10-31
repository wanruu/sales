import React, { useState, useEffect } from "react";
import { Table, Input, Space, Button, Modal, Form, InputNumber, message } from "antd";
import  Axios  from "axios";
import { ExclamationCircleFilled } from '@ant-design/icons';

const { Column } = Table;
const { confirm } = Modal;

import { baseURL } from "../utils/config";
import { UnitInput } from "../components/common/PromptInput";


const emptyProduct = () => {
    return {
        material: '',
        name: '',
        spec: '',
        quantity: '0'
    }
}

function ProductPage() {
    const [products, setProducts] = useState([]);
    const [editProduct, setEditProduct] = useState(emptyProduct())
    const [messageApi, contextHolder] = message.useMessage();

    const updateEdit = (field, value) => {
        const p = JSON.parse(JSON.stringify(editProduct))
        p[field] = value
        setEditProduct(p)
    }

    const getStatus = (field) => {
        const product = products.find(p => p.id === editProduct.id)
        return (product !== undefined && product[field] === editProduct[field]) ? '' : 'warning'
    }

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
    const upload = () => {
        const p = editProduct
        p.quantity = p.quantity || '0'
        Axios({
            method: 'put',
            baseURL: baseURL(),
            url: `/product/id/${p.id}`,
            data: p,
            'Content-Type': 'application/json',
        }).then(res => {
            if (res.data.changes === 1) {
                messageApi.open({ type: 'success', content: '保存成功', });
                load()
                setEditProduct(emptyProduct())
            } else {
                messageApi.open({ type: 'error', content: `保存失败：${res.data.prompt}`, });
            }
        }).catch(err => {
            messageApi.open({ type: 'error', content: `保存失败：${err}`, });
        });
    }
    const deleteProduct = (productId) => {
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
    }

    const showDeleteConfirm = (productId) => {
        confirm({
            title: `是否删产品 ${productId.toString().padStart(6, '0')}?`,
            icon: <ExclamationCircleFilled />,
            content: '确认删除后不可撤销',
            okText: '删除',
            okType: 'danger',
            cancelText: '取消',
            onOk() { deleteProduct(productId) },
        });
    }
    

    useEffect(() => {
        load()
    }, [])

    return (<>
        {contextHolder}
        <Modal open={editProduct.id !== undefined} onCancel={_ => setEditProduct(emptyProduct())} title='编辑产品' footer={null} >
            <Form>
                <Form.Item label='材质'>
                    <Input value={editProduct.material} onChange={e => updateEdit('material', e.target.value)} status={getStatus('material')} />
                </Form.Item>
                <Form.Item label='名称'>
                    <Input value={editProduct.name} onChange={e => updateEdit('name', e.target.value)} status={getStatus('name')} />
                </Form.Item>
                <Form.Item label='规格'>
                    <Input value={editProduct.spec} onChange={e => updateEdit('spec', e.target.value)} status={getStatus('spec')} />
                </Form.Item>
                <Form.Item label='数量'>
                    <Space>
                        <InputNumber value={editProduct.quantity} onChange={val => updateEdit('quantity', val)} stringMode status={getStatus('quantity')} />
                        <UnitInput size='medium' style={{width: '80px'}} value={editProduct.unit} onChange={val => updateEdit('unit', val)} status={getStatus('unit')} />
                    </Space>
                </Form.Item>
                <Button type='primary' onClick={upload} disabled={editProduct.material===''||editProduct.name===''||editProduct.spec===''||editProduct.unit===''}>保存</Button>
            </Form>
        </Modal>

        <Table dataSource={products} size='small' bordered rowKey={record => record.id}
        pagination={{ defaultPageSize: 50, showSizeChanger: true, pageSizeOptions: [50, 100], showQuickJumper: true }} >
            <Column title='序号' align='center' render={(_, __, idx) => idx+1} />
            <Column title='材质' dataIndex='material' align='center' sorter={(a, b) => a.material > b.material ? 1 : (a.material === b.material ? 0 : -1)} render={(_, record, idx) => 
                record.editing === true ? <Input /> : record.material
            } />
            <Column title='名称' dataIndex='name' align='center' sorter={(a, b) => a.name > b.name ? 1 : (a.name === b.name ? 0 : -1)} />
            <Column title='规格' dataIndex='spec' align='center' sorter={(a, b) => a.spec > b.spec ? 1 : (a.spec === b.spec ? 0 : -1)} />
            <Column title='库存' dataIndex='quantity' align='center' render={quantity => 
                <span style={{color: quantity[0] == '-' ? 'red': 'black'}}>{quantity}</span>
            } />
            <Column title='单位' dataIndex='unit' align='center' />
            <Column title='销售单' dataIndex='salesOrders' align='center' render={salesOrders => salesOrders.length} />
            <Column title='销售退货' dataIndex='salesRefunds' align='center' render={salesRefunds => salesRefunds.length} />
            <Column title='采购单' dataIndex='purchaseOrders' align='center' render={purchaseOrders => purchaseOrders.length} />
            <Column title='采购退货' dataIndex='purchaseRefunds' align='center' render={purchaseRefunds => purchaseRefunds.length} />
            <Column title='操作' align='center' render={(_, record) => (
                <Space.Compact size='small'>
                    <Button type='link' onClick={_ => setEditProduct(record)}>编辑</Button>
                    <Button type='link' danger onClick={_ => showDeleteConfirm(record.id)} 
                    disabled={record.salesOrders.length!==0||record.salesRefunds.length!==0||record.purchaseOrders.length!==0||record.purchaseRefunds.length!==0}>删除</Button>
                </Space.Compact>
            )} />
        </Table>
    </>);
}

export default ProductPage