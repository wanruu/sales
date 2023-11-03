import React, { useEffect, useState, useRef } from "react";
import Axios from 'axios'
import { Space, Button } from "antd";
import { useReactToPrint } from "react-to-print";
import { PrinterOutlined } from '@ant-design/icons';


import InvoicePreview from "../common/InvoicePreview"
import { baseURL } from "../../utils/config";
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
        load()
    }, [])

    // for print
    const componentRef = useRef(null);
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
    });

    return <Space direction="vertical" size="middle">
        <Button onClick={handlePrint} icon={<PrinterOutlined/>} type='primary'>打印</Button>
        <div ref={componentRef}>
            <InvoicePreview invoice={salesRefund} type='salesRefund' />
        </div>
    </Space>
}


export default SalesRefundPreview