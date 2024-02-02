import React, { useState } from 'react'
import { Space, Form, Radio, Tooltip, Divider, Row } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'


import { invoiceSettings } from '../../utils/config'
import SettingSwitchItem from './SettingSwitchItem'

const { Item } = Form


function TipsView(props) {
    return (
        <Tooltip title={props.help} >
            <QuestionCircleOutlined style={{ marginLeft: '3px', color: 'gray' }} />
        </Tooltip>
    )
}

export default function InvoiceSettingView() {
    const [ifShowDiscount, setIfShowDiscount] = useState(invoiceSettings.get('ifShowDiscount'))
    const [ifShowDelivered, setIfShowDelivered] = useState(invoiceSettings.get('ifShowDelivered'))
    const [ifShowAmountSign, setIfShowAmountSign] = useState(invoiceSettings.get('ifShowAmountSign'))
    const [allowEditAmount, setAllowEditAmount] = useState(invoiceSettings.get('allowEditAmount'))
    const [invoiceAmountDigitNum, setInvoiceAmountDigitNum] = useState(invoiceSettings.get('invoiceAmountDigitNum'))
    const [itemAmountDigitNum, setItemAmountDigitNum] = useState(invoiceSettings.get('itemAmountDigitNum'))
    const [ifShowRemarkCalculator, setIfShowRemarkCalculator] = useState(invoiceSettings.get('ifShowRemarkCalculator'))
    const [ifShowPayment, setIfShowPayment] = useState(invoiceSettings.get('ifShowPayment'))


    return (
        <Space direction='vertical' size={0} style={{ width: '100%' }}>
            <div className='itemTitle'>自动金额功能</div>
            <SettingSwitchItem keyy='allowEditAmount' value={allowEditAmount} setValue={setAllowEditAmount}
                label='允许修改金额' help='若开关打开，则允许在自动计算金额的基础上输入自定义金额。' />
            <SettingSwitchItem keyy='ifShowAmountSign' value={ifShowAmountSign} setValue={setIfShowAmountSign} 
                label='显示金额符号' help='若开关打开，金额将会显示￥符号前缀，例如￥88；否则，只显示数字。不影响打印显示。' />
            <Item label={<>清单金额保留小数的位数<TipsView help='不影响已创建的清单。'/></>}>
                <Radio.Group style={{ float: 'right' }} value={invoiceAmountDigitNum} onChange={e => {
                    setInvoiceAmountDigitNum(e.target.value)
                    invoiceSettings.set('invoiceAmountDigitNum', e.target.value)
                }}>
                    <Radio.Button value='0'>不保留</Radio.Button>
                    <Radio.Button value='2'>2位小数</Radio.Button>
                    <Radio.Button value='3'>3位小数</Radio.Button>
                </Radio.Group>
            </Item>
            <Item label={<>单个产品金额保留小数的位数<TipsView help='不影响已创建的清单。'/></>}>
                <Radio.Group style={{ float: 'right' }} value={itemAmountDigitNum} onChange={e => {
                    setItemAmountDigitNum(e.target.value)
                    invoiceSettings.set('itemAmountDigitNum', e.target.value)
                }}>
                    <Radio.Button value='0'>不保留</Radio.Button>
                    <Radio.Button value='2'>2位小数</Radio.Button>
                    <Radio.Button value='3'>3位小数</Radio.Button>
                </Radio.Group>
            </Item>
            <Divider />

            <div className='itemTitle'>折扣功能</div>
            <SettingSwitchItem keyy='ifShowDiscount' value={ifShowDiscount} setValue={setIfShowDiscount} 
                label='折扣功能' help='该开关不会影响原有数据，只是显示或隐藏折扣及折前金额。' />
            <Divider />

            <div className='itemTitle'>配送功能</div>
            <SettingSwitchItem keyy='ifShowDelivered' value={ifShowDelivered} setValue={setIfShowDelivered} 
                label='配送功能' help={false} />
            <Divider />
            
            <div className='itemTitle'>入账功能</div>
            <SettingSwitchItem keyy='ifShowPayment' value={ifShowPayment} setValue={setIfShowPayment} 
                label='入账功能' help={false} />
            <Divider />
            
            <div className='itemTitle'>定制功能</div>
            <SettingSwitchItem keyy='ifShowRemarkCalculator' value={ifShowRemarkCalculator}
            setValue={setIfShowRemarkCalculator} label='备注计算功能' 
            help='若开关打开，开单页面的备注栏将会显示“=”按钮，点击即可检测并计算备注栏中第一个算式，并将结果填入“数量”栏，最多保留五位小数。' />

        </Space>
    )
}