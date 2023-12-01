import React, { useEffect, useState } from 'react'
import Axios from 'axios'
import { Button, Col, Space, QRCode, Skeleton, Result, Row } from 'antd'
import { ExclamationCircleFilled } from '@ant-design/icons'

import { baseURL } from '../../utils/config'


export default function PhoneAccessView() {
    // const load = () => {
    //     setIp(null)
    //     Axios({
    //         method: 'get',
    //         baseURL: baseURL(),
    //         url: `ip`,
    //         'Content-Type': 'application/json',
    //     }).then(res => {
    //         setIp(res.data.ip)
    //     }).catch(_ => { })
    // }

    const size = 200

    return <Space direction='vertical'>
        { window.electronAPI.queryServerIp() == 'localhost' ?
            <div style={{ width: size, height: size, borderRadius: '10px', border: 'solid 1px lightgray', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Space>
                    <ExclamationCircleFilled style={{ color: 'red' }} />
                    <font style={{ color: 'gray' }}>加载失败</font>
                </Space>
            </div> :
            <QRCode value={`${baseURL()}/index.html`} size={size} /> 
        }
        <Row align='center'>
        { window.electronAPI.queryServerIp() == 'localhost' ?
            '请确认电脑已连接到网络' :
            '同一WiFi下扫码访问'
        }
        </Row>
    </Space>
}