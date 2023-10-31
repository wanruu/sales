import React, { useState, useEffect, useRef } from 'react';

import './InvoicePreview.css';
import digitUppercase from '../../utils/digitUppercase';


function PreviewTable(props) {
    return (
        <table style={{ width: "100%", height: '100%', }} className='previewTable' >
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
                        <tr key={itemIdx}>
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
                    <td style={{ paddingTop: '2px', paddingBottom: '2px' }}>合计</td>
                    <td style={{ textAlign: 'left', paddingTop: '2px', paddingBottom: '2px' }} colSpan={6}>
                        {digitUppercase(props.invoice.amount)}
                    </td>
                    <td style={{ textAlign: 'left', paddingTop: '2px', paddingBottom: '2px' }} colSpan={2}>
                        {'￥' + props.invoice.amount}
                    </td>
                </tr>
            </tbody>
        </table>
    )
}

export default PreviewTable