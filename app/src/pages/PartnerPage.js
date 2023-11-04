import React, { useState, useEffect } from 'react'
import { Table, Button, Space, message, Modal, Form, Input, Card, Row } from 'antd'
import Axios from 'axios'
import { ExclamationCircleFilled, PlusOutlined, TableOutlined, ClearOutlined } from '@ant-design/icons';

const { Column } = Table
const { confirm } = Modal;
const { Item } = Form

import { baseURL } from '../utils/config'


function FuncBar(props) {
    const updateConditions = (field, value) => {
        const conds = JSON.parse(JSON.stringify(props.filterConditions))
        conds[field] = value
        props.setFilterConditions(conds)
    }
    const style = { marginTop: '8px', marginBottom: '8px', marginLeft: '10px', marginRight: '10px' }
    return <Card size='small'>
        <Row>
            <Item label='姓名' style={style}>
                <Input allowClear placeholder='姓名' onChange={e => updateConditions('name', e.target.value)} />
            </Item>
            <Item label='电话' style={style}>
                <Input allowClear placeholder='电话' onChange={e => updateConditions('phone', e.target.value)} />
            </Item>
            <Item label='地址' style={style}>
                <Input allowClear placeholder='地址' 
                    onChange={e => updateConditions('address', e.target.value)} style={{ width: '300px' }} />
            </Item>
            <Item style={style}>
                <Space>
                    <Button icon={<PlusOutlined />} type='primary'>新增</Button>
                    <Button icon={<TableOutlined />}>导出</Button>
                    <Button icon={<ClearOutlined />} danger>批量清理</Button>
                </Space>
            </Item>
        </Row>
    </Card>
}

function PartnerPage(props) {
    const [partners, setPartners] = useState([])
    const [filteredPartners, setFilteredPartners] = useState([])
    const [filterConditions, setFilterConditions] = useState({name: '', phone: '', address: ''})

    const [messageApi, contextHolder] = message.useMessage();
    const [editPartner, setEditPartner] = useState(undefined)
    
    const load = () => {
        setPartners([])
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: '/partner',
            'Content-Type': 'application/json',
        }).then(res => {
            console.log(res.data)
            setPartners(res.data)
        }).catch(_ => { })
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
            messageApi.open({ type: 'error', content: '删除失败', });
        });
    }

    const showDeleteConfirm = (name) => {
        confirm({
            title: `是否删交易对象“${name}”?`,
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
            if (res.data.changes === 1) {
                messageApi.open({ type: 'success', content: '保存成功', });
                load()
                setEditPartner(undefined)
            } else {
                messageApi.open({ type: 'error', content: `保存失败: ${res.data.prompt}`, });
            }
        }).catch(err => {
            messageApi.open({ type: 'error', content: '保存失败', });
        });
    }

    const updateEditPartner = (field, value) => {
        const p = JSON.parse(JSON.stringify(editPartner))
        p[field] = value
        setEditPartner(p)
    }

    const filterPartners = () => {
        setFilteredPartners(partners.filter(o => 
            (filterConditions.name === '' || o.name.includes(filterConditions.name)) &&
            (filterConditions.phone === '' || o.phone.includes(filterConditions.phone)) &&
            (filterConditions.address === '' || o.address.includes(filterConditions.address))
        ))
    }

    useEffect(() => {
        load()
    }, [])

    useEffect(() => {
        filterPartners()
    }, [partners, filterConditions])


    return (<div style={props.style || {}}>
        {contextHolder}

        <Modal open={editPartner !== undefined} destroyOnClose
            title={editPartner !== undefined && editPartner.originalName === undefined ? '新增交易对象' : '编辑交易对象'}
            onCancel={_ => setEditPartner(undefined)}
            onOk={upload} okText='保存' okButtonProps={{disabled: editPartner === undefined || editPartner.name === ''}}>
            <Item label='姓名'>
                <Input onChange={e => updateEditPartner('name', e.target.value)} value={editPartner === undefined ? '' : editPartner.name} />
            </Item>
            <Item label='电话'>
                <Input onChange={e => updateEditPartner('phone', e.target.value)} value={editPartner === undefined ? '' : editPartner.phone} />
            </Item>
            <Item label='地址'>
                <Input onChange={e => updateEditPartner('address', e.target.value)} value={editPartner === undefined ? '' : editPartner.address} />
            </Item>
        </Modal>

        <br />
        <Space direction='vertical' style={{ width: '100%' }} >
            <FuncBar filterConditions={filterConditions} setFilterConditions={setFilterConditions} />
            <Table dataSource={filteredPartners} size='small' bordered rowKey={record => record.name}>
                <Column title='序号' align='center' render={(_, __, idx) => idx+1} />
                <Column title='姓名' dataIndex='name' align='center' />
                <Column title='电话' dataIndex='phone' align='center' />
                <Column title='地址' dataIndex='address' align='center' />
                <Column title='操作' align='center' render={(_, row) => 
                    <Space.Compact size='small'>
                        <Button type='link' onClick={_ => setEditPartner(Object.assign(row, {originalName: row.name}))}>编辑</Button>
                        {row.invoiceNum > 0 ?
                            <Button type='link'>查看</Button> :
                            <Button type='link' danger onClick={_ => showDeleteConfirm(row.name)}>删除</Button>
                        }
                    </Space.Compact>
                } />
            </Table>
        </Space>
    </div>)
}

export default PartnerPage