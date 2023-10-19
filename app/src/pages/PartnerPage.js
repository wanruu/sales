import React, { useState, useEffect } from 'react'
import { Table, Button } from 'antd'
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
        <Table dataSource={partners} size='small' bordered>
            <Column align='center' render={(_, __, idx) => idx+1} />
            <Column title='姓名' dataIndex='name' align='center' />
            <Column title='电话' dataIndex='phone' align='center' />
            <Column title='地址' dataIndex='address' align='center' />
            <Column title='操作' align='center' render={(_, row) => 
                <Button size='small' type='link'>编辑</Button>
            } />
        </Table>
    )
}

export default PartnerPage