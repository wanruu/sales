import React from 'react'
import { Row, Col, Space } from 'antd'
import { FieldNumberOutlined } from '@ant-design/icons'

import './Invoice.css'
import { printSettings, invoiceSettings } from '../../utils/config'
import { digitUppercase } from '../../utils/invoiceUtils'

/* type */
function PreviewTable(props) {
    const ifShowMaterial = invoiceSettings.get('ifShowMaterial') === 'true'
    const amountSign = printSettings.get('ifShowPrintAmountSign') === 'true' ? printSettings.get('printAmountSign') : ''

    const getTableColumns = () => {
        return [
            ifShowMaterial ? { title: '材质', dataIndex: 'material', width: '5%' } : null,
            { title: '名称', dataIndex: 'name', width: '10%' },
            { title: '规格', dataIndex: 'spec', width: '10%' },
            { title: '数量', dataIndex: 'quantity', width: '8%', render: q => q.toLocaleString() },
            { title: '单位', dataIndex: 'unit', width: '6%' },
            { title: '单价', dataIndex: 'price', width: '8%', render: p => 
                amountSign + p.toLocaleString()
            },
            { title: '金额', dataIndex: 'amount', width: '11%', render: a => 
                amountSign + a.toLocaleString() 
            },
            { title: '备注', dataIndex: 'remark', width: '15%' }
        ].filter(i => i != null)
    }
    return (
        <div style={{ fontSize: printSettings.get('tableFontSize') + 'px' }}>
            <table className='previewTable' style={{ width: '100%', height: '100%' }} >
                <thead>
                    <tr>
                        <th style={{ width: '04.0%', }}>序号</th>
                        { getTableColumns().map(col => <th key={ col.dataIndex } style={{ width: col.width }}>{ col.title }</th>)}
                    </tr>
                </thead>
                <tbody>
                    { props.invoice.items.filter(item => item.quantity != null).map((item, itemIdx) =>
                        <tr key={item.productId}>
                            <td>{itemIdx+1}</td>
                            { getTableColumns().map(col => 
                                <th key={ col.dataIndex }>
                                    { col.render ? col.render(item[col.dataIndex]) : item[col.dataIndex] }
                                </th>
                            )}
                        </tr>
                    )}
                    <tr>
                        <td>合计</td>
                        <td style={{ textAlign: 'left' }} colSpan={6}>
                            <span style={{ marginLeft: '3px' }}>{digitUppercase(props.invoice.amount)}</span>
                        </td>
                        <td style={{ textAlign: 'left' }} colSpan={2}>
                            <span style={{ marginLeft: '3px' }}>
                                {amountSign}
                                {props.invoice.amount.toLocaleString()}
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}


/* type */
function PreviewTitle(props) {
    // Content
    const title = printSettings.get('title').replace(/ /g, '\xa0')
    const subtitle = {
        salesOrder: printSettings.get('salesOrderSubtitle'),
        salesRefund: printSettings.get('salesRefundSubtitle'),
        purchaseOrder: printSettings.get('purchaseOrderSubtitle'),
        purchaseRefund: printSettings.get('purchaseRefundSubtitle')
    }[props.type].replace(/ /g, '\xa0') || '错误'
    // Style
    const titleFontSize = { fontSize: printSettings.get('titleFontSize') + 'px' }
    const subtitleFontSize = { fontSize: printSettings.get('subtitleFontSize') + 'px' }
    // Display mode
    const ifInline = printSettings.get('subtitleStyle') === 'inline'
    // Return
    return <Space direction='vertical' style={{ width: '100%' }} align='center' size={0}>
        { ifInline ? 
            <span style={{ ...titleFontSize }}>{ title }&nbsp;&nbsp;&nbsp;{ subtitle }</span> :
            <span style={{ ...titleFontSize }}>{ title }</span>
        }
        { ifInline ? null : <span style={{ ...subtitleFontSize }}>{ subtitle }</span> }
    </Space>
}


function PreviewFooter() {
    // Reshape footer lines to [x,2]
    const lines = printSettings.get('footer').split('\n').map(line => line.replace(/ /g, '\xa0'))
    const content = lines.reduce((res, line) => {
        if (res.length === 0 || res.at(-1).length === 2) res.push([line])
        else res.at(-1).push(line)
        return res
    }, [])

    // Style
    const fontSize = { fontSize: printSettings.get('footerFontSize') + 'px' }

    // Return
    return content.map((arr, idx) => 
        <Row key={idx}>
            <Col align='left' span={12} style={{ ...fontSize }}>
                { arr[0] }
            </Col>
            { arr.length !== 2 ? null : 
                <Col align='left' span={12} style={{ ...fontSize }}>
                    { arr[1] }
                </Col>
            }
        </Row>
    )
}


/* invoice, type */
function PreviewHeader(props) {
    // Style
    const fontSize = { fontSize: printSettings.get('headerFontSize') + 'px' }

    // Display condition
    const ifShowAddress = printSettings.get('ifShowAddress') === 'true' && props.invoice.address
    const ifShowPhone = printSettings.get('ifShowPhone') === 'true' && props.invoice.phone

    // Return
    return <Space style={{ width: '100%' }} direction='vertical' size='10px'>
        <Row>
            <Col span={8} style={{ ...fontSize }} align='left'>
                { ['salesOrder', 'salesRefund'].includes(props.type) ? '客户' : '供应商' }：
                { props.invoice.partner }
            </Col>
            <Col span={8} style={{ ...fontSize }} align='center'>
                日期：{props.invoice.date}
            </Col>
            <Col span={8} style={{ ...fontSize }} align='right'>
                <FieldNumberOutlined style={{ marginRight: '4px' }}/>
                { props.invoice.id }    
            </Col>
        </Row>
        { !ifShowPhone ? null : <span style={{ ...fontSize }}>电话：{props.invoice.phone}</span> }
        { !ifShowAddress ? null :
            <span style={{ ...fontSize }}>
                { ['salesOrder', 'purchaseRefund'].includes(props.type) ? '收货地址' : '发货地址' }：
                { props.invoice.address }
            </span>
        }
    </Space>
}


export default function InvoicePrintView(props) {
    return <div className='invoiceWrapper' style={{ width: printSettings.get('width') + 'px', height: printSettings.get('height')+'px' }}>
        <div className='invoiceContent' style={{
            paddingTop: printSettings.get('vPadding')+'px', paddingBottom: printSettings.get('vPadding')+'px',
            paddingLeft: printSettings.get('hPadding')+'px', paddingRight: printSettings.get('hPadding')+'px',
        }}>
            <Space direction='vertical' style={{ width: '100%' }} size={5}>
                <PreviewTitle type={props.type} />
                <PreviewHeader invoice={props.invoice} type={props.type} />
                <PreviewTable invoice={props.invoice} />
                <PreviewFooter />
            </Space>
        </div>
    </div>
}