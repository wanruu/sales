import React from 'react';
import { Row, Col, Space } from 'antd'
import { FieldNumberOutlined } from '@ant-design/icons';

import './InvoicePreview.css';
import digitUppercase from '../../utils/digitUppercase';
import { invoiceSettings } from '../../utils/config'

/* type */
function PreviewTable(props) {
    return (
        <div style={{ fontSize: invoiceSettings.fontSize() }}>
            <table className='previewTable' style={{ width: "100%", height: '100%', }} >
                <thead>
                    <tr>
                        <th style={{ width: '04.0%', }}>编号</th>
                        <th style={{ width: '05.0%', }}>材质</th>
                        <th style={{ width: '10.0%', }}>名称</th>
                        <th style={{ width: '10.0%', }}>规格</th>
                        <th style={{ width: '08.0%', }}>数量</th>
                        <th style={{ width: '06.0%', }}>单位</th>
                        <th style={{ width: '08.0%', }}>单价</th>
                        <th style={{ width: '11.0%', }}>金额</th>
                        <th style={{ width: '15.0%', }}>备注</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        props.invoice.items.map((item, itemIdx) =>
                            <tr key={item.id}>
                                <td>{itemIdx+1}</td>
                                <td>{item.material}</td>
                                <td>{item.name}</td>
                                <td>{item.spec}</td>
                                <td>{item.quantity}</td>
                                <td>{item.unit}</td>
                                <td>{item.price}</td>
                                <td>{item.amount}</td>
                                <td>{item.remark}</td>
                            </tr>
                        )
                    }
                    <tr>
                        <td>合计</td>
                        <td style={{ textAlign: 'left' }} colSpan={6}>
                            <span style={{ marginLeft: '3px' }}>{digitUppercase(props.invoice.amount)}</span>
                        </td>
                        <td style={{ textAlign: 'left' }} colSpan={2}>
                            <span style={{ marginLeft: '3px' }}>¥ {props.invoice.amount}</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

/* type */
function PreviewTitle(props) {
    const getTitle = () => {
        return invoiceSettings.title().replace(/ /g, "\xa0")
    }
    const getSubTitle = () => {
        let subTitle
        if (props.type === 'salesOrder') {
            subTitle = invoiceSettings.salesOrderTitle()
        } else if (props.type === 'salesRefund') {
            subTitle = invoiceSettings.salesRefundTitle()
        } else if (props.type === 'purchaseOrder') {
            subTitle = invoiceSettings.purchaseOrderTitle()
        } else {
            subTitle = invoiceSettings.purchaseRefundTitle()
        }
        return subTitle.replace(/ /g, "\xa0")
    }

    if (invoiceSettings.titleStyle() === 'inline') {
        return <Space direction='vertical' style={{ width: '100%' }} align='center'>
            <span style={{ fontSize: invoiceSettings.titleFontSize() }}>{getTitle()}&nbsp;&nbsp;&nbsp;{getSubTitle()}</span>
        </Space>
    }
    return <Space direction='vertical' style={{ width: '100%' }} align='center' size='10px'>
        <span style={{ fontSize: invoiceSettings.titleFontSize() }}>{getTitle()}</span>
        <span style={{ fontSize: invoiceSettings.subtitleFontSize() }}>{getSubTitle()}</span>
    </Space>
}

function PreviewFooter() {
    const contents = () => {
        const arr = invoiceSettings.footer().split('\n')
        const newArr = []
        arr.forEach((val, idx) => {
            if (idx % 2 === 0) {
                newArr.push([val])
            } else {
                newArr.at(-1).push(val)
            }
        })
        return newArr
    }

    return contents().map((arr, idx) => 
        <Row key={idx}>
            <Col align='left' span={12} style={{ fontSize: invoiceSettings.footerFontSize() }}>
                {arr[0].replace(/ /g, "\xa0")}
            </Col>
            {arr.length === 2 ? <Col align='left' span={12} style={{ fontSize: invoiceSettings.footerFontSize() }}>
                {arr[1].replace(/ /g, "\xa0")}
            </Col> : ''}
        </Row>
    )
}

/* invoice, type */
function PreviewHeader(props) {
    const partnerTitle = () => {
        return props.type === 'salesOrder' || props.type === 'salesRefund' ? '客户' : '供应商'
    }
    const addressTitle = () => {
        return props.type === 'salesOrder' || props.type === 'purchaseRefund' ? '收货地址' : '发货地址'
    }
    const showNone = () => {
        if (!invoiceSettings.showAddress() && !invoiceSettings.showPhone()) {
            return true
        }
        if (invoiceSettings.showAddress() && props.invoice.address) {
            return false
        }
        if (props.invoice.phone && invoiceSettings.showPhone()) {
            return false
        }
        return true
    }
    if (invoiceSettings.showAddress() && invoiceSettings.showPhone() && props.invoice.address && props.invoice.phone) {
        return <Space style={{ width: '100%' }} direction='vertical' size='10px'>
            <Row>
                <Col span={8} style={{ fontSize: invoiceSettings.fontSize() }} align='left'>
                    {partnerTitle()}：{props.invoice.partner}
                </Col>
                <Col span={8} style={{ fontSize: invoiceSettings.fontSize() }} align='center'>
                    日期：{props.invoice.date}
                </Col>
                <Col span={8} style={{ fontSize: invoiceSettings.fontSize() }} align='right'>
                    <FieldNumberOutlined/> {props.invoice.id}
                </Col>
            </Row>
            <Row >
                <Col span={7} style={{ fontSize: invoiceSettings.fontSize() }} align='left'>
                    电话：{props.invoice.phone}
                </Col>
                <Col span={17} style={{ fontSize: invoiceSettings.fontSize() }} align='right'>
                    {addressTitle()}：{props.invoice.address}
                </Col>
            </Row>
        </Space>
    } else if (showNone()) {
        return <Row>
            <Col span={8} style={{ fontSize: invoiceSettings.fontSize() }} align='left'>
                {partnerTitle()}：{props.invoice.partner}
            </Col>
            <Col span={8} style={{ fontSize: invoiceSettings.fontSize() }} align='center'>
                日期：{props.invoice.date}
            </Col>
            <Col span={8} style={{ fontSize: invoiceSettings.fontSize() }} align='right'>
                <FieldNumberOutlined/> {props.invoice.id}
            </Col>
        </Row>
    }
    return <Row align='middle'>
        <Col align='left' span={8} style={{ fontSize: invoiceSettings.fontSize() }}>
            <span>{partnerTitle()}：{props.invoice.partner}</span><br/>
            {props.invoice.address ? 
                <span>{addressTitle()}：{props.invoice.address}</span> : 
                <span>电话：{props.invoice.phone}</span>
            }
        </Col>
        <Col align='center' span={8} style={{ fontSize: invoiceSettings.fontSize() }}>
            日期：{props.invoice.date}
        </Col>
        <Col align='right' span={8} style={{ fontSize: invoiceSettings.fontSize() }}>
            <FieldNumberOutlined/> {props.invoice.id}
        </Col>
    </Row>
}

export default function InvoicePreview(props) {
    return <div className='invoiceWrapper' style={{ width: invoiceSettings.width(), height: invoiceSettings.height() }}>
        <div className='invoiceContent' style={{
            paddingTop: invoiceSettings.vPadding(), paddingBottom: invoiceSettings.vPadding(),
            paddingLeft: invoiceSettings.hPadding(), paddingRight: invoiceSettings.hPadding(),
        }}>
            <Space direction='vertical' style={{ width: '100%' }}>
                <PreviewTitle type={props.type} />
                <PreviewHeader invoice={props.invoice} type={props.type} />
                <PreviewTable invoice={props.invoice} />
                <PreviewFooter />
            </Space>
        </div>
    </div>
}