import React, { useState, useEffect } from 'react'
import { Table, Button, Space, message, Modal, Form, Input, Card, Row } from 'antd'
import Axios from 'axios'
import { ExclamationCircleFilled, PlusOutlined, TableOutlined, ClearOutlined, SearchOutlined } from '@ant-design/icons'

const { confirm } = Modal
const { Item } = Form

import { baseURL, DEFAULT_PAGINATION } from '../utils/config'
import PartnerEditView from '../components/partnerComponents/PartnerEditView'
import { exportExcel } from '../utils/export'


function PartnerPage() {
    const [partners, setPartners] = useState([])
    const [filteredPartners, setFilteredPartners] = useState([])
    const [form] = Form.useForm()

    const [messageApi, contextHolder] = message.useMessage()
    const [editPartner, setEditPartner] = useState(undefined)
    const [newPartner, setNewPartner] = useState(false)
    const itemStyle = { marginTop: '8px', marginBottom: '8px', marginLeft: '10px', marginRight: '10px' }
    
    // load
    const load = () => {
        setPartners([])
        setFilteredPartners([])
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: '/partner',
            'Content-Type': 'application/json',
        }).then(res => {
            setPartners(res.data)
            filterPartners(res.data)
        }).catch(_ => { })
    }

    // delete partner
    const showDeleteConfirm = (names) => {
        const title = names.length === 1 ? `是否删除交易对象 “${names[0]}” ?` : `是否删除 ${names.length} 个交易对象?`
        confirm({
            title: title, icon: <ExclamationCircleFilled />,
            content: '确认删除后不可撤销',
            okText: '删除', okType: 'danger', cancelText: '取消',
            onOk() { 
                Axios({
                    method: 'delete',
                    baseURL: baseURL(),
                    url: `/partner`,
                    data: { names: names },
                    'Content-Type': 'application/json',
                }).then(_ => {
                    messageApi.open({ type: 'success', content: '删除成功' })
                    load()
                }).catch(_ => {
                    messageApi.open({ type: 'error', content: '删除失败' })
                })
            }
        })
    }

    // search (filter)
    const filterPartners = (partners) => {
        const conds = form.getFieldsValue()
        setFilteredPartners(partners.filter(p => 
            (!conds.name || p.name.includes(conds.name)) &&
            (!conds.folder || p.folder.includes(conds.folder)) &&
            (!conds.phone || p.phone.includes(conds.phone)) &&
            (!conds.address || p.address.includes(conds.address))
        ))
    }

    // export
    const exportPartners = () => {
        const partners = filteredPartners.map(p => {
            return { '姓名': p.name, '电话': p.phone, '地址': p.address }
        })
        exportExcel('交易对象', partners)
    }

    const columns = [
        { title: '序号', align: 'center', render: (_, __, idx) => idx + 1, fixed: 'left' },
        { title: '姓名', align: 'center', dataIndex: 'name' },
        { title: '文件位置', align: 'center', dataIndex: 'folder' },
        { title: '电话', align: 'center', dataIndex: 'phone' },
        { title: '地址', align: 'center', dataIndex: 'address' },
        { title: '操作', align: 'center', fixed: 'right', render: (_, record) => 
            <Space>
                <Button type='primary' ghost onClick={_ => setEditPartner(record)}>编辑</Button>
                {record.invoiceNum > 0 ?
                    <Button>查看</Button> :
                    <Button danger onClick={_ => showDeleteConfirm([record.name])}>删除</Button>
                }
            </Space>
        }
    ]

    useEffect(load, [])

    return <>
        {contextHolder}

        <Modal title='编辑交易对象' open={editPartner !== undefined} destroyOnClose onCancel={_ => setEditPartner(undefined)} footer={null}>
            <PartnerEditView partner={editPartner} dismiss={_ => setEditPartner(undefined)} refresh={load} messageApi={messageApi} />
        </Modal>

        <Modal title='新增交易对象' open={newPartner} destroyOnClose onCancel={_ => setNewPartner(false)} footer={null} >
            <PartnerEditView dismiss={_ => setNewPartner(false)} refresh={load} messageApi={messageApi} />
        </Modal>

        <br />
        <Space direction='vertical' style={{ width: '100%' }}>
            {/* Function Box */}
            <Card size='small'>
                <Form form={form} onFinish={_ => filterPartners(partners)} layout='inline'>
                    <Item label='姓名' name='name' style={itemStyle}><Input allowClear placeholder='姓名' /></Item>
                    <Item label='文件位置' name='folder' style={itemStyle}><Input allowClear placeholder='文件位置' /></Item>
                    <Item label='电话' name='phone' style={itemStyle}><Input allowClear placeholder='电话' /></Item>
                    <Item label='地址' name='address' style={itemStyle}><Input allowClear placeholder='地址' style={{ width: '300px' }} /></Item>
                    <Space wrap style={itemStyle}>
                        <Button icon={<SearchOutlined />} type='primary' htmlType='submit'>搜索</Button>
                        <Button icon={<PlusOutlined />} onClick={_ => setNewPartner(true)}>新增对象</Button>
                        <Button icon={<TableOutlined />} onClick={exportPartners} disabled={filteredPartners.length === 0}>批量导出</Button>
                        <Button icon={<ClearOutlined />} type='dashed' danger disabled={filteredPartners.filter(p => !p.invoiceNum > 0).length === 0}
                            onClick={_ => showDeleteConfirm(filteredPartners.filter(p => !p.invoiceNum > 0).map(p => p.name))}>批量清理</Button>
                    </Space>
                </Form>
            </Card>

            {/* Partner Table */}
            <Table dataSource={filteredPartners} size='middle' bordered rowKey={record => record.name} 
                scroll={{ x: 'max-content' }} pagination={DEFAULT_PAGINATION} columns={columns} />
        </Space>
    </>
}

export default PartnerPage