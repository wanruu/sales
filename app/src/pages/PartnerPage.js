import React, { useState, useEffect } from 'react'
import { Table, Button, Space } from 'antd'
import Axios from 'axios'

const { Column } = Table

import { baseURL } from '../utils/config'

function PartnerPage() {
    const [partners, setPartners] = useState([])
    
    const load = () => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: '/partner',
            params: { },
            'Content-Type': 'application/json',
        }).then(res => {
            if (res.status === 200) {
                setPartners(res.data)
            } else {
                // TODO
            }
        }).catch(_ => {
            // TODO
        });
    }

    useEffect(() => {
        load()
    }, [])

    return (
        <Table dataSource={partners} size='small' bordered rowKey={record => record.name}>
            <Column align='center' render={(_, __, idx) => idx+1} />
            <Column title='姓名' dataIndex='name' align='center' />
            <Column title='电话' dataIndex='phone' align='center' />
            <Column title='地址' dataIndex='address' align='center' />
            <Column title='操作' align='center' render={(_, row) => 
                <Space.Compact size='small'>
                    <Button type='link'>编辑</Button>
                    <Button type='link' danger>删除</Button>
                </Space.Compact>
            } />
        </Table>
    )
}

export default PartnerPage