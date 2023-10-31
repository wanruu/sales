import React, { useState, useEffect } from 'react'
import { Table, Button, Space, message, Modal, Form, Input } from 'antd'
import Axios from 'axios'
import { ExclamationCircleFilled, PlusOutlined, TableOutlined } from '@ant-design/icons';

const { Column } = Table
const { confirm } = Modal;

import { baseURL } from '../utils/config'

function PartnerPage() {
    const [partners, setPartners] = useState([])
    const [messageApi, contextHolder] = message.useMessage();
    const [editPartner, setEditPartner] = useState(undefined)
    
    const load = () => {
        setPartners([])
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: '/partner',
            params: { },
            'Content-Type': 'application/json',
        }).then(res => {
            setPartners(res.data)
        }).catch(_ => {
        });
    }

    const deletePartner = (name) => {
        Axios({
            method: 'delete',
            baseURL: baseURL(),
            url: `/partner/${name}`,
            'Content-Type': 'application/json',
        }).then(res => {
            messageApi.open({ type: 'success', content: '删除成功', });
            load()
        }).catch(err => {
            messageApi.open({ type: 'error', content: `删除失败：${err}`, });
        });
    }

    const showDeleteConfirm = (name) => {
        confirm({
            title: `是否删交易对象: ${name}?`,
            icon: <ExclamationCircleFilled />,
            content: '确认删除后不可撤销',
            okText: '删除',
            okType: 'danger',
            cancelText: '取消',
            onOk() { deletePartner(name) },
        });
    }

    const upload = () => {
        Axios({
            method: editPartner.originalName === undefined ? 'post' : 'put',
            baseURL: baseURL(),
            url: `/partner`,
            data: editPartner,
            'Content-Type': 'application/json',
        }).then(res => {
            messageApi.open({ type: 'success', content: '保存成功', });
            load()
            setEditPartner(undefined)
        }).catch(err => {
            messageApi.open({ type: 'error', content: `保存失败：${err}`, });
        });
    }

    const updateEditPartner = (field, value) => {
        const p = JSON.parse(JSON.stringify(editPartner))
        p[field] = value
        setEditPartner(p)
    }

    useEffect(() => {
        load()
    }, [])


    return (<>
        {contextHolder}

        <Modal open={editPartner !== undefined} destroyOnClose
        title={editPartner !== undefined && editPartner.originalName === undefined ? '新增交易对象' : '编辑交易对象'}
        onCancel={_ => setEditPartner(undefined)}
        onOk={upload} okText='保存' okButtonProps={{disabled: editPartner === undefined || editPartner.name === ''}}>
            <Form.Item label='姓名'>
                <Input onChange={e => updateEditPartner('name', e.target.value)} value={editPartner === undefined ? '' : editPartner.name} />
            </Form.Item>
            <Form.Item label='电话'>
                <Input onChange={e => updateEditPartner('phone', e.target.value)} value={editPartner === undefined ? '' : editPartner.phone} />
            </Form.Item>
            <Form.Item label='地址'>
                <Input onChange={e => updateEditPartner('address', e.target.value)} value={editPartner === undefined ? '' : editPartner.address} />
            </Form.Item>
        </Modal>

        <Space style={{marginBottom: '10px'}}>
            <Button icon={<PlusOutlined />} type='primary' onClick={_ => setEditPartner({name:'',phone:'',address:''})}>新增</Button>
            <Button icon={<TableOutlined />}>导出</Button>
        </Space>

        <Table dataSource={partners} size='small' bordered rowKey={record => record.name}>
            <Column title='序号' align='center' render={(_, __, idx) => idx+1} />
            <Column title='姓名' dataIndex='name' align='center' />
            <Column title='电话' dataIndex='phone' align='center' />
            <Column title='地址' dataIndex='address' align='center' />
            <Column title='操作' align='center' render={(_, row) => 
                <Space.Compact size='small'>
                    <Button type='link' onClick={_ => setEditPartner(Object.assign(row, {originalName: row.name}))}>编辑</Button>
                    <Button type='link' danger onClick={_ => showDeleteConfirm(row.name)}>删除</Button>
                </Space.Compact>
            } />
        </Table>
    </>)
}

export default PartnerPage