import React, { useEffect, useState, useRef, lazy } from "react";
import Axios from 'axios'
import { Space, Button } from "antd";
import { useReactToPrint } from "react-to-print";
import { PrinterOutlined, FieldNumberOutlined } from '@ant-design/icons';


import PreviewTable from "../common/PreviewTable";
import '../common/InvoicePreview.css'
import { invoiceSettings, baseURL } from "../../utils/config";
import { initSalesRefundForPreview } from "../../utils/salesRefundUtils";


function SalesRefundPreview(props) {
    const [salesRefund, setSalesRefund] = useState(initSalesRefundForPreview(0))

    const load = () => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: `salesRefund/id/${props.id}`,
            'Content-Type': 'application/json',
        }).then(res => {
            setSalesRefund(res.data);
        }).catch(err => { });
    }

    useEffect(() => {
        if (props.salesRefund !== undefined) {
            setSalesRefund(props.salesRefund)
        } else if (props.id !== undefined) {
            load()
        }
    }, [])

    // for print
    const componentRef = useRef(null);
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
    });


    return (
    <Space direction="vertical" size="middle" style={{ display: 'flex', }}>
        <Button onClick={handlePrint} icon={<PrinterOutlined/>}>打印</Button>
        <div ref={componentRef}>
            <div className='invoiceWrapper' style={{width: invoiceSettings.width() + 'px', height: invoiceSettings.height() + 'px'}}>
                <div className='invoiceContent' style={{ border: '1px solid lightgray', boxSizing: 'border-box' }}>
                    <div style={{
                        paddingTop: invoiceSettings.vPadding() + 'px',
                        paddingBottom: invoiceSettings.vPadding() + 'px',
                        paddingLeft: invoiceSettings.hPadding() + 'px',
                        paddingRight: invoiceSettings.hPadding() + 'px'
                    }}>
                        <Space direction='vertical' style={{ width: '100%' }}>
                            {/* title */}
                            <div className='flexVCenter' style={{ fontSize: invoiceSettings.titleFontSize() + 'px', }}>
                                {invoiceSettings.title().replace(/ /g, "\xa0")}
                            </div>
                            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: 'center' }}>
                                <div style={{ width: '36%', textAlign: 'left', fontSize: invoiceSettings.fontSize() + 'px' }}>
                                    客户：{salesRefund.partner}
                                </div>
                                <div style={{ width: '35%', textAlign: 'left', fontSize: invoiceSettings.fontSize() + 'px' }}>
                                    日期：{salesRefund.date}
                                </div>
                                <div style={{ width: '28%', textAlign: 'right', fontSize: invoiceSettings.fontSize() + 'px'}}>
                                    <FieldNumberOutlined/> {`${salesRefund.id}`.padStart(6, '0')}
                                </div>
                            </div>
                            <div style={{ fontSize: invoiceSettings.fontSize() + 'px'}}>
                                <PreviewTable invoice={salesRefund} />
                            </div>
                        </Space>
                    </div>
                </div>
            </div>
        </div>
    </Space>)
}


export default SalesRefundPreview