import React, { useEffect, useState, useRef, lazy } from "react";
import Axios from 'axios'
import { Space, Button } from "antd";
import { useReactToPrint } from "react-to-print";
import { PrinterOutlined, FieldNumberOutlined } from '@ant-design/icons';


import PreviewTable from "../common/PreviewTable";
import { initSalesOrderForPreview } from "../../utils/salesOrderConfig";
import '../common/InvoicePreview.css'
import { invoiceSettings, baseURL } from "../../utils/config";


function SalesOrderPreview(props) {
    const [salesOrder, setSalesOrders] = useState(initSalesOrderForPreview(1))

    const load = () => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: `salesOrder/id/${props.id}`,
            'Content-Type': 'application/json',
        }).then(res => {
            setSalesOrders(res.data);
        }).catch(err => { });
    }

    useEffect(() => {
        if (props.salesOrder !== undefined) {
            setSalesOrders(props.salesOrder)
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
                                    客户：{salesOrder.partner}
                                </div>
                                <div style={{ width: '35%', textAlign: 'left', fontSize: invoiceSettings.fontSize() + 'px' }}>
                                    日期：{salesOrder.date}
                                </div>
                                <div style={{ width: '28%', textAlign: 'right', fontSize: invoiceSettings.fontSize() + 'px'}}>
                                    <FieldNumberOutlined/> {`${salesOrder.id}`.padStart(6, '0')}
                                </div>
                            </div>
                            <div style={{ fontSize: invoiceSettings.fontSize() + 'px'}}>
                                <PreviewTable invoice={salesOrder} />
                            </div>
                        </Space>
                    </div>
                </div>
            </div>
        </div>
    </Space>)
}


export default SalesOrderPreview