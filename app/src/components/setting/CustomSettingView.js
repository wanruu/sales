import React, { useState } from 'react'
import { Card } from 'antd'


import { invoiceSettings } from '../../utils/config'
import SettingSwitchItem from './SettingSwitchItem'
import Title from 'antd/es/typography/Title'



export default function CustomSettingView() {
    const [ifShowRemarkCalculator, setIfShowRemarkCalculator] = useState(invoiceSettings.get('ifShowRemarkCalculator'))


    return (<>
        <Title id='function' level={2}>用户定制</Title>
        <Card>
            <Title id='function-custom' level={3}>备注计算功能</Title>
            <SettingSwitchItem keyy='ifShowRemarkCalculator' value={ifShowRemarkCalculator}
                setValue={setIfShowRemarkCalculator} label='开启备注计算功能'
                help='若开关打开，开单页面的备注栏将会显示“=”按钮，点击即可检测并计算备注栏中第一个算式，并将结果填入“数量”栏，最多保留五位小数。' />
        </Card>
    </>)
}