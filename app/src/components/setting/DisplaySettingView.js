import React, { useState } from 'react'
import { Space } from 'antd'


import { invoiceSettings } from '../../utils/config'
import SettingSwitchItem from './SettingSwitchItem'


export default function DisplaySettingView() {
    const [ifShowAmountSign, setIfShowAmountSign] = useState(invoiceSettings.get('ifShowAmountSign'))

    return (
        <Space direction='vertical' size={0} style={{ width: '100%' }}>
            <SettingSwitchItem keyy='ifShowAmountSign' value={ifShowAmountSign} setValue={setIfShowAmountSign} 
                label='显示金额符号' help='若开关打开，金额将会显示￥符号前缀，例如￥88；否则，只显示数字。不影响打印显示。' />
        </Space>
    )
}