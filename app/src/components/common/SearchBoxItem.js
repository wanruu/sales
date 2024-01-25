import React from 'react'
import { Tag, Form, Select, DatePicker } from 'antd'


import { DATE_FORMAT, DELIVER_COLORS, INVOICE_DELIVER_OPTIONS } from '../../utils/config'
import './SearchBoxItem.css'

const { Item } = Form
const { RangePicker } = DatePicker


export function DeliverItem() {
    const form = Form.useFormInstance()

    const tagRender = (props) => {
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
    
    return (
        <Item label='配送情况' name='delivered'>
            <Select placeholder='筛选配送情况' style={{ width: '270px' }}
                mode='multiple' tagRender={tagRender} 
                options={INVOICE_DELIVER_OPTIONS} allowClear 
                onChange={value => form.setFieldValue('delivered', value)}
            />
        </Item>
    )
}


export function DateRangeItem() {
    const form = Form.useFormInstance()

    return (
        <Item label='日期' name='date'>
            <RangePicker format={DATE_FORMAT} allowEmpty={[true, true]}
                onChange={value => form.setFieldValue('date', value)} />
        </Item>
    )
}
