import React, { useEffect, useMemo, useState } from 'react'
import Axios from 'axios'
import { AutoComplete, Button, Divider, InputNumber, Modal, Radio, Row, Select, 
    Space, Table, Checkbox 
} from 'antd'
import { LineChartOutlined, CloseOutlined } from '@ant-design/icons'
import ReactEcharts from 'echarts-for-react'


import { baseURL, invoiceSettings } from '../../utils/config'


export function PartnerInput(props) {
    const [options, setOptions] = useState([])

    const load = (keyword) => {
        setOptions([])
        if (keyword === '') { return }
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: `prompt/partner/name/${keyword}`,
            'Content-Type': 'application/json',
        }).then(res => {
            setOptions(res.data.map(i => { return { label: i, value: i } }))
        }).catch(err => { })
    }

    return <AutoComplete size={props.size || 'small'} value={props.value} 
        status={props.status} options={options}
        style={props.style || {}} 
        onChange={props.onChange}
        onSearch={load}
    />
}


export function ProductInput(props) {
    const [options, setOptions] = useState([])

    const load = (keyword) => {
        setOptions([])
        if (keyword === '') { return }
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: `prompt/product/${props.field}/${keyword}`,
            'Content-Type': 'application/json',
        }).then(res => {
            setOptions(res.data.map(i => { return { label: i, value: i } }))
        }).catch(err => {
            console.error(err)
        })
    }

    return <AutoComplete size={props.size || 'small'} value={props.value} 
        status={props.status || ''} options={options}
        style={props.style || {}} 
        onChange={props.onChange}
        onSearch={load}
        disabled={props.disabled || false}
    />
}


export function UnitInput(props) {
    const [unit, setUnit] = useState(undefined)

    const load = () => {
        setUnit(undefined)
        if (props.material === undefined || props.name === undefined || props.spec === undefined) { 
            return
        }
        const ifShowMaterial = invoiceSettings.get('ifShowMaterial') === 'true'
        if (ifShowMaterial) {
            if (props.material === '' || props.name === '' || props.spec === '') { 
                return
            }
        } else {
            if (props.name === '' || props.spec === '') { 
                return
            }
        }
        
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: `product/unit`,
            params: { material: props.material, name: props.name, spec: props.spec },
            'Content-Type': 'application/json',
        }).then(res => {
            const _unit = res.data.unit
            setUnit(_unit)
            if (_unit !== undefined) {
                props.onChange(_unit)
            }
        }).catch(err => {
            console.error(err)
        })
    }

    const status = useMemo(() => {
        if (props.status !== undefined) {
            return props.status
        }
        return unit !== undefined && unit != props.value ? 'warning' : ''
    }, [props.status, props.value])

    useEffect(load, [props.material, props.name, props.spec])

    return unit === undefined ? <Select size={props.size || 'small'} 
        options={JSON.parse(invoiceSettings.get('unitOptions')).filter(unit => unit.showing)} 
        disabled={props.disabled || false}
        align={props.align || 'center'} style={props.style || {}} value={props.value} 
        onChange={props.onChange} status={status}
    /> : unit
}


function PriceHistory(props) {
    const [prices, setPrices] = useState([])
    const [displayType, setDisplayType] = useState('table')
    const [tableFilters, setTableFilters] = useState(['salesOrder', 'purchaseOrder'])

    // table
    const tableColumns = useMemo(() =>  {
        const ifShowDiscount = invoiceSettings.get('ifShowDiscount') === 'true'
        return [
            { title: '序号', align: 'center', render: (_, __, idx) => idx + 1, width: 45, fixed: 'left' },
            { title: '单号', dataIndex: 'id', align: 'center', width: 150, sorter: (a, b) => a.id > b.id ? 1 : -1, showSorterTooltip: false },
            { title: '交易对象', dataIndex: 'partner', align: 'center', width: 130 },
            { title: '单价', dataIndex: 'price', align: 'center', width: 80, 
                render: price => <Button size='small' type='text' style={{ width: '100%' }} onClick={_ => props.setPrice(price) }>{price}</Button>,
                sorter: (a, b) => a.price - b.price, showSorterTooltip: false
            },
            { title: '数量', dataIndex: 'quantity', align: 'center', width: 80, 
                sorter: (a, b) => a.quantity - b.quantity, showSorterTooltip: false 
            },
            { title: ifShowDiscount ? '折后价' : '金额', dataIndex: 'amount', align: 'center', width: 90, 
                sorter: (a, b) => a.amount - b.amount, showSorterTooltip: false 
            },
            { title: '日期', dataIndex: 'date', align: 'center', width: 100, 
                sorter: (a, b) => a.date > b.date ? 1 : ( a.date < b.date ? -1 : 0), showSorterTooltip: false
            },
            { title: '备注', dataIndex: 'remark', align: 'center', width: 120 }
        ]
    }, [localStorage])

    // chart
    const getChartOption = (data) => {
        const newData = data.map(item => {
            item.value = item.price
            return item
        }).reverse()
        return {
            title: { text: newData.length === 0 ? '暂无数据' : '', x: 'center', y: 'center' },
            xAxis: { type: 'category', data: newData.map(item => item.date) },
            yAxis: { type: 'value' },
            legend: { show: true, data: ['销售单', '采购单'] },
            tooltip: {
                trigger: 'axis',
                formatter: function (params) {
                    const data = params[0].data
                    const remark = data.remark ? `备注：${data.remark}` : ''
                    const partnerTitle = data.type === 'salesOrder' ? '客户' : '供应商'
                    const ifShowDiscount = invoiceSettings.get('ifShowDiscount') === 'true'
                    return `<div style="border-bottom:dashed lightgray;padding-bottom:5px;">
                        单价：${data.price}<br/>
                        数量：${data.quantity.toLocaleString()} ${data.unit}<br/>
                        ${ifShowDiscount ? '折后价' : '金额'}：${data.amount.toLocaleString()}<br/>
                        ${remark}
                    </div>
                    <div style="padding-top:5px;">
                        单号：${data.id}<br/>
                        ${partnerTitle}：${data.partner}<br/>
                        日期：${data.date}
                    </div>`
                }
            },
            series: [
                { data: newData.filter(i => i.type === 'salesOrder'), type: 'line', name: '销售单' },
                { data: newData.filter(i => i.type === 'purchaseOrder'), type: 'line', name: '采购单' },
            ]
        }
    }

    const load = () => {
        setPrices([])
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: `product/price`,
            params: {
                material: props.material,
                name: props.name,
                spec: props.spec
            },
            'Content-Type': 'application/json',
        }).then(res => {
            setPrices(res.data)
            // const item = res.data.find(item => item.type === 'salesOrder')
            // if (item) props.onChange(item.price)
        }).catch(err => {
            console.error(err)
        })
    }

    // effect
    useEffect(load, [props.material, props.name, props.spec])

    return <div>
        {/* Product Information */}
        <Row style={{ justifyContent: 'space-between', padding: '10px 0' }}>
            <span>材质：{ props.material }</span>
            <span>名称：{ props.name }</span>
            <span>规格：{ props.spec }</span>
        </Row>
        {/* Display Options */}
        <Row style={{ justifyContent: 'space-between', padding: '5px 0 15px 0' }} align='middle'>
            <Radio.Group value={displayType} onChange={e => setDisplayType(e.target.value)} >
                <Radio.Button value='table'>表格</Radio.Button>
                <Radio.Button value='chart'>折线图</Radio.Button>
            </Radio.Group>
            { displayType === 'chart' ? null : <Checkbox.Group value={tableFilters} onChange={setTableFilters}>
                <Checkbox value='salesOrder'>销售单</Checkbox>
                <Checkbox value='purchaseOrder'>采购单</Checkbox>
            </Checkbox.Group> }
            <span style={{ color: 'gray', fontStyle: 'italic' }}>{ displayType === 'chart' ? '点击图例可显示或隐藏折线' : '点击单价可自动填入' }</span>
        </Row>
        {/* Main Content */}
        { displayType === 'chart' ? 
            <ReactEcharts option={getChartOption(prices)} style={{ height: 400 }} /> :
            <Table dataSource={prices.filter(p => tableFilters.includes(p.type))} size='small' rowKey={record => record.id} columns={tableColumns}
                scroll={{ x: 'max-content', y: 400 }} style={{ height: 400 }} pagination={false} bordered /> 
        }
        <Divider />
    </div>
}

export function PriceInput(props) {
    const [showHistory, setShowHistory] = useState(false)

    const getButtonDisabled = () => {
        if (invoiceSettings.get('ifShowMaterial') === 'true') {
            if (!props.material || !props.name || !props.spec) {
                return true
            }
        } else if (!props.name || !props.spec) {
            return true
        }
        return false
    }

    return <Space.Compact size={props.size || 'small'}>
        <Modal open={showHistory} onCancel={_ => setShowHistory(false)} title='历史价格' width={900} destroyOnClose 
            footer={<Button type='primary' ghost onClick={_ => setShowHistory(false)} icon={<CloseOutlined/>}>关闭</Button>}>
            <PriceHistory partner={props.partner} material={props.material} name={props.name} spec={props.spec} 
                setPrice={val => { props.onChange(val); setShowHistory(false) }} />
        </Modal>
        <InputNumber controls={props.controls === undefined ? true : props.controls}
            style={props.style || {}}
            value={props.value} onChange={props.onChange} min={props.min || Number.MIN_SAFE_INTEGER}
            stringMode={props.stringMode === undefined ? false : props.stringMode}
            keyboard={props.keyboard === undefined ? true : props.keyboard} />
        <Button icon={<LineChartOutlined />} disabled={getButtonDisabled()}
            onClick={_ => setShowHistory(true)} />
    </Space.Compact>
}