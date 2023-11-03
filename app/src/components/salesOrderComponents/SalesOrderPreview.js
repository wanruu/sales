import React, { useEffect, useState, useRef } from "react";
import Axios from 'axios'
import { Space, Button } from "antd";
import { useReactToPrint } from "react-to-print";
import { PrinterOutlined } from '@ant-design/icons';


import InvoicePreview from "../common/InvoicePreview";
import { initSalesOrderForPreview } from "../../utils/salesOrderUtils";
import { baseURL } from "../../utils/config";


function SalesOrderPreview(props) {
    const [salesOrder, setSalesOrder] = useState(initSalesOrderForPreview(0))

    const load = () => {
        setSalesOrder(initSalesOrderForPreview(0))
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: `salesOrder/id/${props.id}`,
            'Content-Type': 'application/json',
        }).then(res => {
            setSalesOrder(res.data);
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


    return <Space direction="vertical" size="middle" >
        <Button onClick={handlePrint} icon={<PrinterOutlined/>} type='primary'>打印</Button>
        <div ref={componentRef}>
            <InvoicePreview invoice={salesOrder} type='salesOrder' />
        </div>
    </Space>
}


export default SalesOrderPreview