import React, { useState, useEffect } from 'react'
import { Table, Button, Space, message, Modal, Form, Input, Card, Row } from 'antd'
import Axios from 'axios'
import { ExclamationCircleFilled, PlusOutlined, TableOutlined, ClearOutlined } from '@ant-design/icons';

const { Column } = Table
const { confirm } = Modal;
const { Item } = Form

import { baseURL } from '../utils/config'
import PartnerEditView from '../components/partnerComponents/PartnerEditView';


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
                    <Button icon={<PlusOutlined />} type='primary' onClick={props.create}>新增</Button>
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
    const [newPartner, setNewPartner] = useState(false)
    
    const load = () => {
        setPartners([])
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: '/partner',
            'Content-Type': 'application/json',
        }).then(res => {
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

        <Modal title='编辑交易对象' open={editPartner !== undefined} destroyOnClose onCancel={_ => setEditPartner(undefined)} footer={null}>
            <PartnerEditView partner={editPartner} editPartner={editPartner} dismiss={_ => setEditPartner(undefined)} refresh={load}/>
        </Modal>

        <Modal title='新增交易对象' open={newPartner} destroyOnClose onCancel={_ => setNewPartner(false)} footer={null}>
            <PartnerEditView editPartner={{name:'',address:'',phone:''}} dismiss={_ => setNewPartner(false)} refresh={load}/>
        </Modal>

        <br />
        <Space direction='vertical' style={{ width: '100%' }} >
            <FuncBar filterConditions={filterConditions} setFilterConditions={setFilterConditions} create={_ => setNewPartner(true)} />

            <Table dataSource={filteredPartners} size='small' bordered rowKey={record => record.name}>
                <Column title='序号' align='center' render={(_, __, idx) => idx+1} />
                <Column title='姓名' dataIndex='name' align='center' />
                <Column title='电话' dataIndex='phone' align='center' />
                <Column title='地址' dataIndex='address' align='center' />
                <Column title='操作' align='center' render={(_, row) => 
                    <Space.Compact size='small'>
                        <Button type='link' onClick={_ => setEditPartner(row)}>编辑</Button>
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