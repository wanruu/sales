import React, { useState } from 'react'
import { Form, Tooltip, Divider, Card, Segmented } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'


import { invoiceSettings } from '../../utils/config'
import SettingSwitchItem from './SettingSwitchItem'
import Title from 'antd/es/typography/Title'

const { Item } = Form


function TipsView(props) {
    return (
        <Tooltip title={props.help} >
            <QuestionCircleOutlined style={{ marginLeft: '3px', color: 'gray' }} />
        </Tooltip>
    )
}

const DIGIT_NUM_OPTIONS = [
    { label: '取整', value: '0' },
    { label: '2位小数', value: '2' },
    { label: '3位小数', value: '3' }
]

export default function FunctionSettingView() {
    const [ifShowRefund, setIfShowRefund] = useState(invoiceSettings.get('ifShowRefund'))
    const [ifShowDiscount, setIfShowDiscount] = useState(invoiceSettings.get('ifShowDiscount'))
    const [ifShowDelivered, setIfShowDelivered] = useState(invoiceSettings.get('ifShowDelivered'))
    const [allowEditAmount, setAllowEditAmount] = useState(invoiceSettings.get('allowEditAmount'))
    const [invoiceAmountDigitNum, setInvoiceAmountDigitNum] = useState(invoiceSettings.get('invoiceAmountDigitNum'))
    const [itemAmountDigitNum, setItemAmountDigitNum] = useState(invoiceSettings.get('itemAmountDigitNum'))
    const [ifShowPayment, setIfShowPayment] = useState(invoiceSettings.get('ifShowPayment'))


    return (<>
        <Title id='function' level={2}>功能设置</Title>
        <Card>
            <Title id='function-amount' level={3}>金额计算功能</Title>
            <SettingSwitchItem keyy='allowEditAmount' value={allowEditAmount} setValue={setAllowEditAmount}
                label='允许修改金额' help='若开关打开，则允许在自动计算金额的基础上输入自定义金额。' />
            <Item label={<>清单金额保留小数的位数<TipsView help='不影响已创建的清单。' /></>}>
                <Segmented options={DIGIT_NUM_OPTIONS} value={invoiceAmountDigitNum}
                    onChange={value => {
                        setInvoiceAmountDigitNum(value)
                        invoiceSettings.set('invoiceAmountDigitNum', value)
                    }} />
            </Item>
            <Item label={<>单个产品金额保留小数的位数<TipsView help='不影响已创建的清单。' /></>}>
                <Segmented options={DIGIT_NUM_OPTIONS} value={itemAmountDigitNum}
                    onChange={value => {
                        setItemAmountDigitNum(value)
                        invoiceSettings.set('itemAmountDigitNum', value)
                    }} />
            </Item>
            <Divider />

            <Title id='function-refund' level={3}>退款功能</Title>
            <SettingSwitchItem keyy='ifShowRefund' value={ifShowRefund} setValue={setIfShowRefund}
                label='开启退款功能' help='该开关不会影响原有数据，只是显示或隐藏退货页面。' />
            <Divider />

            <Title id='function-discount' level={3}>折扣功能</Title>
            <SettingSwitchItem keyy='ifShowDiscount' value={ifShowDiscount} setValue={setIfShowDiscount}
                label='开启折扣功能' help='该开关不会影响原有数据，只是显示或隐藏折扣及折前金额。' />
            <Divider />

            <Title id='function-deliver' level={3}>配送功能</Title>
            <SettingSwitchItem keyy='ifShowDelivered' value={ifShowDelivered} setValue={setIfShowDelivered}
                label='开启配送功能' help={false} />
            <Divider />

            <Title id='function-payment' level={3}>付款功能</Title>
            <SettingSwitchItem keyy='ifShowPayment' value={ifShowPayment} setValue={setIfShowPayment}
                label='开启付款功能' help={false} />
        </Card>
    </>)
}