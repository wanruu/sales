import React from 'react';
import { Row, Col, Space } from 'antd'
import { FieldNumberOutlined } from '@ant-design/icons';

import './InvoicePreview.css';
import digitUppercase from '../../utils/digitUppercase';
import { invoiceSettings } from '../../utils/config'


function PreviewTable(props) {
    return (
        <div style={{ fontSize: invoiceSettings.fontSize() + 'px'}}>
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
        return <div className='flexVCenter' style={{ fontSize: `${invoiceSettings.titleFontSize()}px` }}>
            {getTitle()}&nbsp;&nbsp;&nbsp;{getSubTitle()}
        </div>
    }
    return <>
        <div className='flexVCenter' style={{ fontSize: `${invoiceSettings.titleFontSize()}px` }}>
            {getTitle()}
        </div>
        <div className='flexVCenter' style={{ fontSize: `${invoiceSettings.titleFontSize()}px` }}>
            {getSubTitle()}
        </div>
    </>
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
            <Col span={12} style={{ fontSize: `${invoiceSettings.footerFontSize()}px` }}>
                {arr[0].replace(/ /g, "\xa0")}
            </Col>
            {arr.length === 2 ? <Col span={12} style={{ fontSize: `${invoiceSettings.footerFontSize()}px` }}>
                {arr[1].replace(/ /g, "\xa0")}
            </Col> : ''}
        </Row>
    )
}

export default function InvoicePreview(props) {
    return <div className='invoiceWrapper' style={{width: invoiceSettings.width() + 'px', height: invoiceSettings.height() + 'px'}}>
        <div className='invoiceContent' style={{ border: '1px solid lightgray', boxSizing: 'border-box' }}>
            <div style={{
                paddingTop: invoiceSettings.vPadding() + 'px',
                paddingBottom: invoiceSettings.vPadding() + 'px',
                paddingLeft: invoiceSettings.hPadding() + 'px',
                paddingRight: invoiceSettings.hPadding() + 'px'
            }}>
                <Space direction='vertical' style={{ width: '100%' }}>
                    <PreviewTitle type={props.type} />
                    <Row>
                        <Col span={8} style={{ fontSize: invoiceSettings.fontSize() + 'px' }}>
                            客户：{props.invoice.partner}
                        </Col>
                        <Col span={8} style={{ fontSize: invoiceSettings.fontSize() + 'px' }} align='center'>
                            日期：{props.invoice.date}
                        </Col>
                        <Col span={8} style={{ fontSize: invoiceSettings.fontSize() + 'px'}} align='right'>
                            <FieldNumberOutlined/> {props.invoice.id}
                        </Col>
                    </Row>
                    <PreviewTable invoice={props.invoice} />
                    <PreviewFooter />
                </Space>
            </div>
        </div>
    </div>
}