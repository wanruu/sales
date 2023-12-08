import React, { useState, useEffect } from 'react'
import Axios from 'axios'
import Decimal from 'decimal.js'
import { Row, Col, Space, Button, Table, Divider, Tag } from 'antd'
import { TableOutlined, CloseOutlined } from '@ant-design/icons'


import { invoiceSettings, baseURL } from '../../utils/config'
import { exportExcel, getExportData } from '../../utils/export'

const INVOICE_TYPE_2_DICT = {
    'salesOrder': { str: '销售单', color: 'blue' },
    'salesRefund': { str: '销售退款', color: 'blue' },
    'purchaseOrder': { str: '采购单', color: 'gold' },
    'purchaseRefund': { str: '采购退款', color: 'gold' }
}

const TYPE_FILTERS = Object.keys(INVOICE_TYPE_2_DICT).map(key => {
    return {
        value: key,
        text: INVOICE_TYPE_2_DICT[key].str
    }
})

/*
    Required: id, dismiss
*/
export default function ProductView(props) {
    const [product, setProduct] = useState(undefined)

    const load = () => {
        setProduct(undefined)
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: `/product/id/${props.id}`,
            'Content-Type': 'application/json',
        }).then(res => {
            setProduct(res.data)
        })
    }

    const getSign = (field, type) => {
        if (type === 'salesRefund' || type === 'purchaseOrder') {
            if (field === 'quantity') { return '+' }
            return '-'
        }
        if (field === 'quantity') { return '-' }
        return '+'
    }
    const getColor = (field, type) => {
        return getSign(field, type) === '+' ? 'red' : 'green'
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

    const getTableColumns = () => {
        const ifShowDiscount = invoiceSettings.get('ifShowDiscount') === 'true'
        return [
            { title: '', align: 'center', fixed: 'left', width: 50, render: (_, __, idx) => idx + 1 },
            { title: '单号', dataIndex: 'invoiceId', align: 'center', width: 140 },
            { title: '交易对象', dataIndex: 'partner', align: 'center', width: 150 },
            { title: '单价', dataIndex: 'price', align: 'center', width: 90, render: p => p.toLocaleString() },
            { title: '数量', dataIndex: 'quantity', align: 'center', width: 80, render: (q, record) => 
                <span color={getColor('quantity', record.type)}>{ getSign('quantity', record.type) }{ q.toLocaleString() }</span>
            },
            ifShowDiscount ? { title: '金额', dataIndex: 'originalAmount', align: 'center', width: 90, render: (a, record) => 
                <span color={getColor('amount', record.type)}>{ getSign('amount', record.type) }{ a.toLocaleString() }</span> 
            } : null,
            ifShowDiscount ? { title: '折扣', dataIndex: 'discount', align: 'center', width: 50, render: d => `${d}%` } : null,
            { title: ifShowDiscount ? '折后价' : '金额', dataIndex: 'amount', align: 'center', width: 90, render: (a, record) => 
                <span color={getColor('amount', record.type)}>{ getSign('amount', record.type) }{ a.toLocaleString() }</span>
            },
            { title: '重量', dataIndex: 'weight', align: 'center', width: 80, render: w => w ? w.toLocaleString() : null },
            { title: '备注', dataIndex: 'remark', align: 'center', width: 150 },
            { title: '类型', dataIndex: 'type', align: 'center', width: 90, fixed: 'right', 
                filters: TYPE_FILTERS, onFilter: (val, record) => val === record.type, 
                render: type => <Tag color={ INVOICE_TYPE_2_DICT[type].color }>{ INVOICE_TYPE_2_DICT[type].str }</Tag>,
            }
        ].filter(i => i != null)
    }

    const exportFile = () => {
        // TODO
        const ifShowDiscount = invoiceSettings.get('ifShowDiscount') === 'true'
        const ifShowMaterial = invoiceSettings.get('ifShowMaterial') === 'true'
        const columns = [
            { title: '单号', dataIndex: 'invoiceId', summary: '总计' },
            { title: '交易对象', dataIndex: 'partner' },
            { title: '单价', dataIndex: 'price', summary: 'avg' },
            { title: '数量', dataIndex: 'quantity', render: (q, record) => 
                <span color={getColor('quantity', record.type)}>{ getSign('quantity', record.type) }{ q.toLocaleString() }</span>
            },
            ifShowDiscount ? { title: '金额', dataIndex: 'originalAmount', onExport: (amount, record) => 
                Decimal(`${getSign('amount', record.type)}${amount}`).toNumber()
            } : null,
            ifShowDiscount ? { title: '折扣', dataIndex: 'discount', onExport: d => `${d}%` } : null,
            { title: ifShowDiscount ? '折后价' : '金额', dataIndex: 'amount', onExport: (amount, record) => 
                Decimal(`${getSign('amount', record.type)}${amount}`).toNumber()
            },
            { title: '重量', dataIndex: 'weight', render: w => w ? w.toLocaleString() : null },
            { title: '备注', dataIndex: 'remark' },
            { title: '类型', dataIndex: 'type', onExport: type => INVOICE_TYPE_2_DICT[type].str }
        ].filter(i => i != null)
        const filename = ifShowMaterial ? `产品详情(${product.material},${product.name},${product.spec})` : `产品详情(${product.name},${product.spec})`
        exportExcel(filename, getExportData(columns, product.items))
    }

    const getSummary = (items) => {
        const summaryInfo = calSummary(items)
        if (invoiceSettings.get('ifShowDiscount') === 'true') {
            return <Table.Summary fixed>
                <Table.Summary.Row>
                    <Table.Summary.Cell index={0} align='center'>总计</Table.Summary.Cell>
                    <Table.Summary.Cell index={1} colSpan={2} />
                    <Table.Summary.Cell index={3} align='center'>均价 { summaryInfo.price.toNumber().toLocaleString() }</Table.Summary.Cell>
                    <Table.Summary.Cell index={4} align='center'>{ summaryInfo.quantity.toNumber().toLocaleString() }</Table.Summary.Cell>
                    <Table.Summary.Cell index={5} align='center'>{ summaryInfo.originalAmount.toNumber().toLocaleString() }</Table.Summary.Cell>
                    <Table.Summary.Cell index={6} />
                    <Table.Summary.Cell index={7} align='center'>{ summaryInfo.amount.toNumber().toLocaleString() }</Table.Summary.Cell>
                    <Table.Summary.Cell index={8} align='center'>均重 { summaryInfo.weight.toNumber().toLocaleString() }</Table.Summary.Cell>
                    <Table.Summary.Cell index={9} />
                    <Table.Summary.Cell index={10} />
                </Table.Summary.Row>
            </Table.Summary>
        }
        return <Table.Summary fixed>
            <Table.Summary.Row>
                <Table.Summary.Cell index={0} align='center'>总计</Table.Summary.Cell>
                <Table.Summary.Cell index={1} colSpan={2} />
                <Table.Summary.Cell index={3} align='center'>均价 { summaryInfo.price.toNumber().toLocaleString() }</Table.Summary.Cell>
                <Table.Summary.Cell index={4} align='center'>{ summaryInfo.quantity.toNumber().toLocaleString() }</Table.Summary.Cell>
                <Table.Summary.Cell index={5} align='center'>{ summaryInfo.amount.toNumber().toLocaleString() }</Table.Summary.Cell>
                <Table.Summary.Cell index={6} align='center'>均重 { summaryInfo.weight.toNumber().toLocaleString() }</Table.Summary.Cell>
                <Table.Summary.Cell index={7} />
                <Table.Summary.Cell index={8} />
            </Table.Summary.Row>
        </Table.Summary>
    }

    return product === undefined ? null : <>
        <Space direction='vertical' style={{ width: '100%', marginTop: '10px', marginBottom: '15px' }}>
            <Row>
                { invoiceSettings.get('ifShowMaterial') === 'true' ? <Col span={8}>材质：{ product.material }</Col> : null }
                <Col span={8}>名称：{ product.name }</Col>
                <Col span={8}>规格：{ product.spec }</Col>
            </Row>
            <Row>
                <Col span={8}>数量：{ product.quantity }</Col>
                <Col span={8}>单位：{ product.unit }</Col>
                <Col span={8}>预估重量：{ Decimal(product.quantity).times(calSummary(product.items).weight).toNumber().toLocaleString() }</Col>
            </Row>
        </Space>

        <Table dataSource={product.items} columns={getTableColumns()} pagination={false} 
            scroll={{ x: 'max-content', y: 400 }} size='small' rowKey={r => r.invoiceId} bordered
            summary={getSummary} />

        <Divider />
        
        <Row align='end'>
            <Space>
                <Button icon={<TableOutlined />} onClick={exportFile}>导出</Button>
                <Button icon={<CloseOutlined />} onClick={props.dismiss}>关闭</Button>
            </Space>
        </Row>
    </>
}