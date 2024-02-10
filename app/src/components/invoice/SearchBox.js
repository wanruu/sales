import React, { useEffect, useState } from 'react'
import { Tag, Form, Select, DatePicker, Space, Input, Button, InputNumber, Card, Tooltip, Row } from 'antd'
import { ExclamationCircleOutlined, SwapOutlined } from '@ant-design/icons'
import { pinyin } from 'pinyin-pro'
import { useSelector, useDispatch } from 'react-redux'

import { DATE_FORMAT, DELIVER_COLORS, INVOICE_DELIVER_OPTIONS, invoiceSettings } from '../../utils/config'


const { Item } = Form
const { RangePicker } = DatePicker



/*
    Required: data, setFilteredData, type
    Optional: keywords (TODO: 快捷搜索功能)
*/
function SimpleSearchBar(props) {
    // const [keywords, setKeywords] = useState(props.keywords || '')
    const keywords = useSelector(state => state.page[props.type].keywords || '')
    const dispatch = useDispatch()

    const filterData = () => {
        const keywordArray = keywords.replace(/\s+/g, ' ').split(' ').filter(k => k !== '')
        const filteredData = (props.data || []).filter(record => {
            const textToVerify = [
                record.id, record.refundId, record.orderId, record.partner, record.date,
                record.delivered, record.amount.toString(), record.amount.toLocaleString(),
                pinyin(record.partner, { pattern: 'first', toneType: 'none', type: 'array' }).join(''),
                pinyin(record.partner, { toneType: 'none', type: 'array' }).join('')
            ]
            for (const keyword of keywordArray) {
                const results = textToVerify.map(text => (text || '').includes(keyword))
                if (results.filter(r => r).length === 0) {
                    return false
                }
            }
            return true
        })
        props.setFilteredData(filteredData)
    }

    const handleInputKeyDown = (event) => {
        if (event.key === 'Enter') {
            filterData()
        }
    }

    useEffect(filterData, [props.type])

    return (
        <Space.Compact style={{ width: '100%' }}>
            <Input placeholder='输入关键词' allowClear
            value={keywords}
            onKeyDown={handleInputKeyDown} 
            onChange={e => dispatch({ type: 'page/updateKeywords', menuKey: props.type, payload: e.target.value })} 
            />
            <Button onClick={filterData} type='primary'>搜索</Button>
        </Space.Compact>
    )
}


/*
    Required: data, setFilteredData, type
    Optional: 
*/
function ComplexSearchBox(props) {
    const [form] = Form.useForm()

    const resetData = () => {
        form.resetFields()
        props.setFilteredData(props.data || [])
    }
    const filterData = () => {
        const conds = form.getFieldsValue()
        const targetPartner = (conds.partner || '').replace(' ', '')
        const filteredData = (props.data || []).filter(record => {
            const partner = record.partner.replace(' ', '')
            return (
                record.id.includes(conds.id || '') || 
                record.refundId?.includes(conds.id || '') || 
                record.orderId?.includes(conds.id || '')
            ) && 
            (
                partner.includes(targetPartner) ||
                pinyin(partner, { pattern: 'first', toneType: 'none', type: 'array' }).join('').includes(targetPartner) ||
                pinyin(partner, { toneType: 'none', type: 'array' }).join('').includes(targetPartner)
            ) &&
            (
                !conds.date || !conds.date[0] || record.date >= conds.date[0].format(DATE_FORMAT)
            ) &&
            (
                !conds.date || !conds.date[1] || record.date <= conds.date[1].format(DATE_FORMAT)
            ) &&
            (
                !conds.minAmount || record.amount >= conds.minAmount
            ) &&
            (
                !conds.maxAmount || record.amount <= conds.maxAmount
            ) &&
            (
                !conds.delivered || conds.delivered.length === 0 || conds.delivered.includes(record.delivered)
            )
        })
        props.setFilteredData(filteredData)
    }

    const deliveredTagRender = (props) => {
        const { label, value, closable, onClose } = props
        const onPreventMouseDown = (event) => {
            event.preventDefault()
            event.stopPropagation()
        }
        return <Tag color={DELIVER_COLORS[value]}
            onMouseDown={onPreventMouseDown}
            closable={closable} onClose={onClose}
            style={{ marginRight: 3 }}
        >{ label }</Tag>
    }

    const partnerTitle = ['salesOrder', 'salesRefund'].includes(props.type) ? '客户' : '供应商'
    const itemStyle = { style: { margin: '8px 0px' }}

    useEffect(resetData, [props.type])

    return (
        <Form form={form} onFinish={filterData} labelCol={{ span: 4 }} wrapperCol={{ span: 20 }}>
            <Item label='单号' name='id' {...itemStyle}>
                <Input placeholder='单号、关联单号' allowClear />
            </Item>
            <Item label={partnerTitle} name='partner' {...itemStyle}>
                <Input placeholder={partnerTitle + '名称'} allowClear />
            </Item>
            <Item label='日期' name='date' {...itemStyle}>
                <RangePicker format={DATE_FORMAT} allowEmpty={[true, true]}  />
            </Item>
            <Item label='金额' {...itemStyle}>
                <Item name='minAmount' noStyle>
                    <InputNumber placeholder='最低' keyboard={false} />
                </Item>
                <span style={{ marginLeft: '5px', marginRight: '5px' }}>~</span>
                <Item name='maxAmount' noStyle>
                    <InputNumber placeholder='最高' keyboard={false} />
                </Item>
            </Item>
            {
                invoiceSettings.get('ifShowDelivered') === 'true' ?
                <Item label='配送情况' name='delivered' {...itemStyle}>
                    <Select placeholder='选择配送情况' 
                        mode='multiple' tagRender={deliveredTagRender} 
                        options={INVOICE_DELIVER_OPTIONS} allowClear
                    />
                </Item> : null
            }
            
            <Item label=' ' colon={false} style={{ marginTop: 0, marginBottom: 0 }} >
                <Space direction='horizontal'>
                    <Button onClick={resetData}>清空</Button>
                    <Button htmlType='submit' type='primary'>搜索</Button>
                </Space>
            </Item>
        </Form>
    )
}


/*
    Required: data, setFilteredData, type
    Optional: mode, keywords (TODO: 快捷搜索功能)
*/
export default function InvoiceSearchBox(props) {
    const [mode, setMode] = useState(props.mode || 'simple')

    const modeDict = {
        'simple': { 
            title: <>智能搜索<Tooltip title='支持单号、交易对象、日期、金额、配送情况，以空格分开。'>
                <ExclamationCircleOutlined style={{ color: 'gray', marginLeft: '3px' }} />
            </Tooltip></>, 
            content: <SimpleSearchBar {...props} /> 
        },
        'complex': { title: '高级搜索', content: <ComplexSearchBox {...props} /> }
    }

    const changeMode = () => {
        props.setFilteredData(props.data || [])
        if (mode === 'simple') {
            setMode('complex')
        } else {
            setMode('simple')
        }
    }

    return (
        <Card>
            <Space direction='vertical' style={{ width: '100%' }}>
                <Row style={{ justifyContent: 'space-between'}}>
                    <b style={{ fontSize: '12pt' }}>
                        { modeDict[mode]?.title }
                    </b>
                    <Button size='small' type='text' style={{ color: 'gray', fontSize: '10pt' }} onClick={changeMode}>
                        <Space size={1} direction='horizontal'>
                            <SwapOutlined />
                            <span>切换模式</span>
                        </Space>
                    </Button>
                </Row>
                { modeDict[mode]?.content }
            </Space>
        </Card>
    )
}