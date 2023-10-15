import { DatePicker, Space, AutoComplete } from 'antd';
import React from 'react';
import { useEffect, useState, useRef } from 'react';
import Axios from 'axios';

import './invoice.css';
import { dateFormat, baseURL, invoiceSettings } from '../config.js';
import { ViewTable, EditTable } from './MyTable.js';


// props: invoice, editInvoice, 
// onCustomerChange, onDateChange, onItemsChange
function Invoice(props) {
    const [customerOptions, setCustomerOptions] = useState([]);

    const searchCustomers = (keyword, n) => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: 'prompt/customer',
            params: { keyword: keyword, maxLen: n },
            'Content-Type': 'application/json',
        }).then(res => {
            setCustomerOptions(res.data.map(customer => ({ value: customer })));
        }).catch(_ => {
            setCustomerOptions([]);
        });
    };


    return (
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
                        <div className='flexVCenter' style={{ fontSize: invoiceSettings.titleFontSize() + 'px' }}>
                            {invoiceSettings.title().replace(/ /g, "\xa0")}
                        </div>

                        <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: 'center', fontSize: 492.97 / 55 + 'px' }}>
                            <div style={{ width: '36%', textAlign: 'left', fontSize: invoiceSettings.fontSize() + 'px' }}>
                                收货单位：
                                {props.mode === 'edit' ?
                                    <AutoComplete
                                        style={{ width: '60%', height: '100%' }}
                                        options={customerOptions}
                                        onChange={data => props.onCustomerChange(data)}
                                        size='small'
                                        allowClear
                                        onSearch={(text) => searchCustomers(text, 10)}
                                        value={props.editInvoice.customer}
                                    />
                                    :
                                    props.invoice.customer}
                            </div>
                            <div style={{ width: '35%', textAlign: 'left', fontSize: invoiceSettings.fontSize() + 'px' }}>
                                日期：{props.mode === "view" ?
                                    props.invoice.date.format(dateFormat) :
                                    <DatePicker onChange={data => props.onDateChange(data)} value={props.editInvoice.date} format={dateFormat} size="small" />
                                }
                            </div>
                            <div style={{ width: '28%', textAlign: 'right', fontSize: invoiceSettings.fontSize() + 'px' }}>NO. {props.invoice.no === undefined ? '（保存后生成）' : props.invoice.no}</div>
                        </div>
                        <div style={{ fontSize: invoiceSettings.fontSize() + 'px'}}>
                            {
                                props.mode === 'edit' ?
                                    <EditTable items={props.editInvoice.items} customer={props.editInvoice.customer} onItemsChange={props.onItemsChange}/> : 
                                    <ViewTable items={props.invoice.items} /> 
                            }
                        </div>
                        <div className='flexHCenter' style={{ fontSize: invoiceSettings.footnoteFontSize() + 'px' }}>
                            <div>
                                {invoiceSettings.footnote().replace(/ /g, "\xa0").split('\n').map((line, idx) =>
                                        <span key={idx}>{line}<br /></span>
                                )}
                            </div>
                        </div>
                    </Space>
                </div>
            </div>
        </div>
    );
}



export default Invoice;