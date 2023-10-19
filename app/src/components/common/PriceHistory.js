import React, { useEffect, useState } from 'react';
import ReactEcharts from 'echarts-for-react';
import dayjs from "dayjs";


// import './invoice.css';
// import { dateFormat } from '../config.js';


function PriceHistory(props) {
    // const [option, setOption] = useState([]);

    // useEffect(() => {
    //     setOption({
    //         title: { text: props.data.length === 0 ? '暂无数据' : '', x: "center", y: "center" },
    //         xAxis: {
    //             type: 'category',
    //             data: props.data.map(invoice => dayjs(invoice.date).format(dateFormat)),
    //         },
    //         yAxis: {
    //             type: 'value'
    //         },
    //         tooltip: {
    //             trigger: 'axis',
    //             formatter: function (params) {
    //                 const data = params[0].data;
    //                 return `单价：￥${data.value}<br/>` + 
    //                 `数量：${data.quantity.toLocaleString(undefined, { maximumFractionDigits: 2 })}<br/>` + 
    //                 `单号：${data.no}<br/>` + 
    //                 `日期：${data.date}<br/>` +
    //                 `备注：${data.remark == undefined || data.remark == '' ? "无" : data.remark}`;
    //             }
    //         },
    //         series: [
    //             {
    //                 data: props.data.map(invoice => ({
    //                     value: invoice.unitPrice,
    //                     no: invoice.no,
    //                     date: dayjs(new Date(invoice.date)).format(dateFormat),
    //                     quantity: invoice.quantity,
    //                     remark: invoice.remark,
    //                 })),
    //                 type: 'line'
    //             }
    //         ]
    //     });
    // }, [props.data])

    return (
        <>
            {/* {option.length === 0 ? '' : <ReactEcharts option={option} style={{ height: '50vh' }} />} */}
        </>
    );
}

export default PriceHistory;