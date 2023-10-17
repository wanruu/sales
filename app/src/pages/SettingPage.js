import { Button, Input, Upload, InputNumber, Space } from "antd";
import { useState, } from "react";
import React from 'react';
import * as XLSX from 'xlsx';
import Axios from 'axios';

// import Invoice from "../components/Invoice.js";
import { baseURL, invoiceSettings } from "../utils/config";
import { initSalesOrderForPreview } from "../utils/salesOrderConfig";
import SalesOrderPreview from "../components/salesOrderComponents/SalesOrderPreview";


const { TextArea } = Input;


function SettingPage() {
    const [width, setWidth] = useState(invoiceSettings.width())
    const [height, setHeight] = useState(invoiceSettings.height())
    const [fontSize, setFontSize] = useState(invoiceSettings.fontSize())

    const [title, setTitle] = useState(invoiceSettings.title())
    const [titleFontSize, setTitleFontSize] = useState(invoiceSettings.titleFontSize())

    const [footnote, setFootnote] = useState(invoiceSettings.footnote())
    const [footnoteFontSize, setFootnoteFontSize] = useState(invoiceSettings.footnoteFontSize())

    const [hPadding, setHPadding] = useState(invoiceSettings.hPadding())
    const [vPadding, setVPadding] = useState(invoiceSettings.vPadding())

    const [showPreview, setShowPreview] = useState(false);

    const [defaultEditRowNum, setDefaultEditRowNum] = useState(invoiceSettings.defaultEditRowNum())
    // const [syncServer, setSyncServer] = useState(localStorage.getItem('syncServer') || '');
    // const [syncAccount, setSyncAccount] = useState(localStorage.getItem('syncAccount') || '');
    // const [syncPassword, setSyncPassword] = useState(localStorage.getItem('syncPassword') || '');

    // 尺寸
    const onHeightChange = (value) => {
        setHeight(value);
        localStorage.setItem('height', value);
    }
    const onWidthChange = (value) => {
        setWidth(value);
        localStorage.setItem('width', value);
    }
    const onFontSizeChange = (value) => {
        setFontSize(value);
        localStorage.setItem('fontSize', value);
    }

    // 标题
    const onTitleChange = (event) => {
        setTitle(event.target.value);
        localStorage.setItem('title', event.target.value);
    }
    const onTitleFontSizeChange = (value) => {
        setTitleFontSize(value);
        localStorage.setItem('titleFontSize', value);
    }

    // 脚注
    const onFootnoteChange = (event) => {
        setFootnote(event.target.value);
        localStorage.setItem('footnote', event.target.value);
    }
    const onFootnoteFontSizeChange = (value) => {
        setFootnoteFontSize(value);
        localStorage.setItem('footnoteFontSize', value);
    }

    // margin
    const onHPaddingChange = (value) => {
        setHPadding(value);
        localStorage.setItem('hPadding', value);
    }

    const onVPaddingChange = (value) => {
        setVPadding(value);
        localStorage.setItem('vPadding', value);
    }

    const onDefaultEditRowNumChange = (value) => {
        setDefaultEditRowNum(value);
        localStorage.setItem('defaultEditRowNum', value);
    }

    function onSyncServerChange(event) {
        setSyncServer(event.target.value);
        localStorage.setItem('syncServer', event.target.value);
    }
    function onSyncAccountChange(event) {
        setSyncAccount(event.target.value);
        localStorage.setItem('syncAccount', event.target.value);
    }
    function onSyncPasswordChange(event) {
        setSyncPassword(event.target.value);
        localStorage.setItem('syncPassword', event.target.value);
    }


    const handleUpload = (options) => {
        const { onSuccess, onError, file, onProgress } = options;
        
        const xlsxFormatDate = (numb) => {
            const old = numb - 1;
            const t = Math.round((old - Math.floor(old)) * 24 * 60 * 60);
            const time = new Date(1900, 0, old, 0, 0, t)
            const year = time.getFullYear() ;
            const month = time.getMonth() + 1 ;
            const date = time.getDate() ;
            return year + '-' + (month < 10 ? '0' + month : month) + '-' + (date < 10 ? '0' + date : date)
        }

        const groupData = (rows) => {
            // clean rows keys
            const newRows = rows.map((obj) => {
                const newObj = {}; // 创建一个新的对象来存储处理后的键值对
                for (let key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        const newKey = key.replace(/\s/g, ''); // 去除空格，创建新的键名
                        newObj[newKey] = obj[key]; // 将原始键名对应的值赋给新的键名
                        if (newKey !== key) {
                            delete obj[key]; // 删除原始键名
                        }
                    }
                }
                return newObj;
            })

            var invoices = [];
            for (const row of newRows) {
                if (row['材质'] === undefined || row['物品名称'] === undefined || row['规格'] === undefined) {
                    continue;
                }
                const item = {
                    material: row['材质'],
                    name: row['物品名称'],
                    spec: row['规格'],
                    unitPrice: row['单价'] === undefined ? 0 : row['单价'],
                    quantity: row['数量'] === undefined ? 0 : row['数量'],
                    remark: row['备注'] === undefined ? '' : row['备注'],
                    
                }
                if (row['送货单号'] !== undefined) {
                    invoices.push({ 
                        no: row['送货单号'].toString().padStart(6, '0'),
                        date: xlsxFormatDate(row['日期']),
                        customer: row['收货单位'],
                        isPaid: row['款项'] === '已收款',
                        isInvoiced: row['发票'] === '已开票',
                        items: [item]
                    });
                } else {
                    invoices[invoices.length-1].items.push(item);
                }
            }
            return invoices;
        }

        const readFile = (file) => {
            const fileReader = new FileReader();
            fileReader.onload = (e) => {
                let workbook = XLSX.read(e.target.result, {type: 'binary'});
                Object.keys(workbook.Sheets).forEach(sheet => {
                    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);
                    // group by invoice
                    const invoices = groupData(data);
                    Axios({
                        method: 'post',
                        baseURL: baseURL(),
                        url: 'invoices/upload/',
                        data: {invoices: invoices},
                        'Content-Type': 'application/json',
                    }).then(res => {
                        onSuccess();
                    }).catch(err => {
                        onError(err);
                    });
                });
            }
            fileReader.readAsBinaryString(file);
        }
        readFile(file);
    }


    return (
        <div>
            <h2>清单外观</h2>
            
            <h3>尺寸 & 字号</h3>
            <Space wrap>
                <InputNumber style={{width: '130px'}} addonBefore="宽度" value={width} onChange={onWidthChange}/>x
                <InputNumber style={{width: '130px'}} addonBefore="高度" value={height} onChange={onHeightChange} />
                <InputNumber style={{width: '100px'}} addonAfter="px" value={fontSize} onChange={onFontSizeChange} />
            </Space>
            
            <h3>标题</h3>
            <Space>
                <Input placeholder='标题' value={title} onChange={onTitleChange} style={{width: '400px'}}/>
                <InputNumber addonAfter='px' value={titleFontSize} onChange={onTitleFontSizeChange} style={{maxWidth: '100px'}}/>
            </Space>

            <h3>脚注</h3>
            <Space direction="vertical">
                <TextArea placeholder='脚注' autoSize value={footnote} onChange={onFootnoteChange} style={{width: '600px'}}/>
                <InputNumber addonAfter='px' value={footnoteFontSize} onChange={onFootnoteFontSizeChange} style={{maxWidth: '100px'}}/>
            </Space>

            <h3>边距</h3>
            <Space wrap>
                <InputNumber addonBefore="水平" value={hPadding} onChange={onHPaddingChange} />
                <InputNumber addonBefore="垂直" value={vPadding} onChange={onVPaddingChange} />
            </Space>

            {/* <h3>开单设置</h3>
            <InputNumber addonBefore='默认行数' value={defaultEditRowNum} onChange={onDefaultEditRowNumChange} style={{maxWidth: '200px'}}/> */}

            
            <br/>
            <Button
                type='link'
                style={{ padding: 0 }}
                onClick={() => setShowPreview(!showPreview)}
            >
                {showPreview ? '隐藏预览' : '显示预览'} <span style={{ color: 'gray' }}>&nbsp;(以打印页面为准)</span>
            </Button>
            {showPreview ? <SalesOrderPreview salesOrder={initSalesOrderForPreview(10)} /> : ''}
            
            
            {/* <h3>同步选项</h3>
            <p>服务器地址</p>
            <Input placeholder='服务器地址' value={syncServer} onChange={onSyncServerChange} style={{maxWidth: '400px'}}/>
            <p>账户</p>
            <Input placeholder='账户' value={syncAccount} onChange={onSyncAccountChange} style={{maxWidth: '400px'}} />
            <p>密码</p>
            <Input.Password placeholder='密码' value={syncPassword} onChange={onSyncPasswordChange} style={{maxWidth: '400px'}} />
            <Button>同步</Button> */}

            {/* <h2>导入</h2>
            <Upload directory accept=".xlsx" customRequest={handleUpload}>
                <Button>
                    选择.xlsx文件
                </Button>
            </Upload> */}
        </div>
    );
}

export default SettingPage;