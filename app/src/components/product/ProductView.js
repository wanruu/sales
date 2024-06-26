import React, { useState, useEffect } from 'react'
import Axios from 'axios'
import Decimal from 'decimal.js'
import { Row, Col, Space, Button, Table, Divider, Tag, Card, Form, Input, Select, DatePicker, } from 'antd'
import { TableOutlined, CloseOutlined } from '@ant-design/icons'

const { Item } = Form
const { RangePicker } = DatePicker


import { invoiceSettings, baseURL, DATE_FORMAT } from '../../utils/config'
import { exportExcel, getExportData } from '../../utils/export'


const INVOICE_TYPE_2_DICT = {
    'salesOrder': { str: '销售单', color: 'blue' },
    'purchaseOrder': { str: '采购单', color: 'gold' },
    'salesRefund': { str: '销售退款', color: 'blue' },
    'purchaseRefund': { str: '采购退款', color: 'gold' }
}


/*
    Required: product
*/
function ProductBasicInfoView(props) {
    return <Space direction='vertical' style={{ width: '100%', marginTop: '10px', marginBottom: '10px' }}>
        <Row>
            { invoiceSettings.get('ifShowMaterial') === 'true' ? <Col span={8}>材质：{ props.product.material }</Col> : null }
            <Col span={8}>名称：{ props.product.name }</Col>
            <Col span={8}>规格：{ props.product.spec }</Col>
        </Row>
        <Row>
            <Col span={8}>库存数量：{ props.product.quantity } { props.product.unit }</Col>
            <Col span={8}>均重：{ props.product.unitWeight.toLocaleString() } / { props.product.unit } </Col>
            <Col span={8}>预估库存重量：{ Decimal(props.product.quantity).times(props.product.unitWeight || 0).toNumber().toLocaleString() }</Col>
        </Row>
    </Space>
}


/*
    Required: items, setFilteredItems
*/
function FilterBarView(props) {
    const [form] = Form.useForm()

    const itemStyle = { marginBottom: '8px' }
    const invoiceTypeFilters = Object.keys(INVOICE_TYPE_2_DICT).map(key => ({ value: key, label: INVOICE_TYPE_2_DICT[key].str }))

    const tagRender = (props) => {
        const { label, value, closable, onClose } = props
        const onPreventMouseDown = (event) => {
            event.preventDefault()
            event.stopPropagation()
        }
        return <Tag color={INVOICE_TYPE_2_DICT[value]?.color}
            onMouseDown={onPreventMouseDown}
            closable={closable} onClose={onClose}
            style={{ marginRight: 3 }} 
        >{ label }</Tag>
    }
    const filterItems = (items) => {
        const conds = form.getFieldsValue()
        props.setFilteredItems(items.filter(i => 
            (!conds.partner || i.partner.includes(conds.partner)) &&
            (!conds.types || conds.types.length === 0 || conds.types.includes(i.type)) &&
            (!conds.dateRange || !conds.dateRange[0] || conds.dateRange[0].format(DATE_FORMAT) <= i.date) &&
            (!conds.dateRange || !conds.dateRange[1] || conds.dateRange[1].format(DATE_FORMAT) >= i.date)
        ))
    }
    return <Card size='small' style={{ marginTop: '10px', marginBottom: '10px' }}>
        <Form form={form} layout='inline' onFinish={_ => filterItems(props.items)} >
            <Item label='交易对象' name='partner' style={itemStyle}>
                <Input placeholder='客户/供应商' />
            </Item>
            <Item label='日期范围' name='dateRange' style={itemStyle}>
                <RangePicker allowEmpty={[true, true]} />
            </Item>
            <Item label='清单类型' name='types' style={{ width: '420px' }}>
                <Select placeholder='选择显示的清单类型' mode='multiple' tagRender={tagRender} options={invoiceTypeFilters} allowClear />
            </Item>
            <Button htmlType='submit'>筛选</Button>
        </Form>
    </Card>
}


/*
    Required: items
*/
function InvoiceItemTableView(props) {
    const getTableColumns = () => {
        const ifShowDiscount = invoiceSettings.get('ifShowDiscount') === 'true'
        const ifShowAmountSign = invoiceSettings.get('ifShowAmountSign') === 'true'
        const amountSign = invoiceSettings.get('amountSign')
        return [
            { title: '序号', align: 'center', fixed: 'left', width: 50, render: (_, __, idx) => idx + 1 },
            { title: '单号', dataIndex: 'invoiceId', align: 'center', width: 140,
                sorter: (a, b) => a.invoiceId > b.invoiceId ? 1 : (a.invoiceId < b.invoiceId ? -1 : 0) 
            },
            { title: '交易对象', dataIndex: 'partner', align: 'center', width: 150 },
            { title: '日期', dataIndex: 'date', align: 'center', width: 100, 
                sorter: (a, b) => a.date > b.date ? 1 : (a.date < b.date ? -1 : 0) 
            },
            { title: '单价', dataIndex: 'price', align: 'center', width: 90, 
                render: p => (ifShowAmountSign ? amountSign : '') + p.toLocaleString(),
                sorter: (a, b) => a.price - b.price
            },
            { title: '数量', dataIndex: 'quantity', align: 'center', width: 80, render: q =>  q.toLocaleString(),
                sorter: (a, b) => a.quantity - b.quantity 
            },
            ifShowDiscount ? 
            { 
                title: '金额', dataIndex: 'originalAmount', align: 'center', width: 90, 
                render: a => (ifShowAmountSign ? amountSign : '') + a.toLocaleString(),
                sorter: (a, b) => a.originalAmount - b.originalAmount
            } : null,
            ifShowDiscount ? { title: '折扣', dataIndex: 'discount', align: 'center', width: 50, render: d => `${d}%` } : null,
            { 
                title: ifShowDiscount ? '折后价' : '金额', dataIndex: 'amount', align: 'center', width: 90, 
                render: a => (ifShowAmountSign ? amountSign : '') + a.toLocaleString(),
                sorter: (a, b) => a.amount - b.amount
            },
            { title: '重量', dataIndex: 'weight', align: 'center', width: 80, render: w => w ? w.toLocaleString() : null },
            { title: '备注', dataIndex: 'remark', align: 'center', width: 150 },
            { title: '清单类型', dataIndex: 'type', align: 'center', width: 90, fixed: 'right', 
                render: type => <Tag color={ INVOICE_TYPE_2_DICT[type].color }>{ INVOICE_TYPE_2_DICT[type].str }</Tag>,
            }
        ].filter(i => i != null)
    }
    return <Table size='small' dataSource={props.items} columns={getTableColumns()} pagination={false} 
        style={{ height: 400 }} scroll={{ x: 'max-content', y: 400 }} rowKey={r => r.invoiceId} bordered
    />
}



/*
    Required: id, dismiss
*/
export default function ProductView(props) {
    const [product, setProduct] = useState(undefined)
    const [filteredItems, setFilteredItems] = useState([])

    const load = () => {
        setProduct(undefined)
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: `/product/id/${props.id}`,
            'Content-Type': 'application/json',
        }).then(res => {
            const p = res.data
            p.unitWeight = calUnitWeight(p.items)
            setProduct(res.data)
            setFilteredItems(res.data.items)
        })
    }

    const calUnitWeight = (items) => {
        var quantity = Decimal(0)
        var weight = Decimal(0)
        
        for (const item of items) {
            if (item.weight != null) {
                weight = weight.plus(item.weight)
                quantity = quantity.plus(item.quantity)
            }
        }
        return (quantity.equals(0) ? Decimal(0) : weight.dividedBy(quantity)).toNumber()
    }

    const calSummary = (items) => {
        const initialSummary = { 
            price: Decimal(0), quantity: Decimal(0), originalAmount: Decimal(0), amount: Decimal(0),
            weight: Decimal(0), weightQuantity: Decimal(0)
        }
        if (items.length === 0) return initialSummary
        const res = items.reduce((summary, item) => {
            summary.price = summary.price.plus(item.price)
            if (item.type === 'salesRefund' || item.type === 'purchaseOrder') {
                summary.quantity = summary.quantity.plus(item.quantity)
                summary.originalAmount = summary.originalAmount.plus(item.originalAmount)
                summary.amount = summary.amount.plus(item.amount)
            } else {
                summary.quantity = summary.quantity.minus(item.quantity)
                summary.originalAmount = summary.originalAmount.minus(item.originalAmount)
                summary.amount = summary.amount.minus(item.amount)
            }
            if (item.weight != null) {
                summary.weight = summary.weight.plus(item.weight)
                summary.weightQuantity = summary.weightQuantity.plus(item.quantity)
            }
            return summary
        }, initialSummary)
        res.price = res.price.dividedBy(items.length)
        res.weight = res.weightQuantity.equals(0) ? Decimal(0) : res.weight.dividedBy(res.weightQuantity)
        return res
    }

    useEffect(load, [props.id])

    const exportFile = () => {
        // TODO
        // const ifShowDiscount = invoiceSettings.get('ifShowDiscount') === 'true'
        // const ifShowMaterial = invoiceSettings.get('ifShowMaterial') === 'true'
        // const columns = [
        //     { title: '单号', dataIndex: 'invoiceId', summary: '总计' },
        //     { title: '交易对象', dataIndex: 'partner' },
        //     { title: '单价', dataIndex: 'price', summary: 'avg' },
        //     { title: '数量', dataIndex: 'quantity', render: (q, record) => 
        //         <span color={getColor('quantity', record.type)}>{ getSign('quantity', record.type) }{ q.toLocaleString() }</span>
        //     },
        //     ifShowDiscount ? { title: '金额', dataIndex: 'originalAmount', onExport: (amount, record) => 
        //         Decimal(`${getSign('amount', record.type)}${amount}`).toNumber()
        //     } : null,
        //     ifShowDiscount ? { title: '折扣', dataIndex: 'discount', onExport: d => `${d}%` } : null,
        //     { title: ifShowDiscount ? '折后价' : '金额', dataIndex: 'amount', onExport: (amount, record) => 
        //         Decimal(`${getSign('amount', record.type)}${amount}`).toNumber()
        //     },
        //     { title: '重量', dataIndex: 'weight', render: w => w ? w.toLocaleString() : null },
        //     { title: '备注', dataIndex: 'remark' },
        //     { title: '类型', dataIndex: 'type', onExport: type => INVOICE_TYPE_2_DICT[type].str }
        // ].filter(i => i != null)
        // const filename = ifShowMaterial ? `产品详情(${product.material},${product.name},${product.spec})` : `产品详情(${product.name},${product.spec})`
        // exportExcel(filename, getExportData(columns, product.items))
    }

    return product === undefined ? null : <>
        <ProductBasicInfoView product={product} />
        
        <FilterBarView items={product.items} setFilteredItems={setFilteredItems} />

        <InvoiceItemTableView items={filteredItems} />

        <Divider />
        
        <Row align='end'>
            <Space>
                <Button icon={<TableOutlined />} onClick={exportFile}>导出</Button>
                <Button icon={<CloseOutlined />} onClick={props.dismiss}>关闭</Button>
            </Space>
        </Row>
    </>
}