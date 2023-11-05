import { Button, Input, Upload, InputNumber, Space, Select, Checkbox, Card, Form } from "antd";
import React, { useState, } from "react";
import * as XLSX from 'xlsx';
import Axios from 'axios';


import { baseURL, invoiceSettings } from "../utils/config";
import { initSalesOrderForPreview } from "../utils/salesOrderUtils";
import { initSalesRefundForPreview } from "../utils/salesRefundUtils";
import InvoicePreview from "../components/common/InvoicePreview";

const { TextArea } = Input;
const { Item } = Form

function SettingPage(props) {
    const [width, setWidth] = useState(invoiceSettings.width())
    const [height, setHeight] = useState(invoiceSettings.height())
    const [fontSize, setFontSize] = useState(invoiceSettings.fontSize())

    const [hPadding, setHPadding] = useState(invoiceSettings.hPadding())
    const [vPadding, setVPadding] = useState(invoiceSettings.vPadding())

    const [title, setTitle] = useState(invoiceSettings.title())
    const [titleFontSize, setTitleFontSize] = useState(invoiceSettings.titleFontSize())

    const [salesOrderTitle, setSalesOrderTitle] = useState(invoiceSettings.salesOrderTitle())
    const [salesRefundTitle, setSalesRefundTitle] = useState(invoiceSettings.salesRefundTitle())
    const [purchaseOrderTitle, setPurchaseOrderTitle] = useState(invoiceSettings.purchaseOrderTitle())
    const [purchaseRefundTitle, setPurchaseRefundTitle] = useState(invoiceSettings.purchaseRefundTitle())
    const [titleStyle, setTitleStyle] = useState(invoiceSettings.titleStyle())
    const [subtitleFontSize, setSubtitleFontSize] = useState(invoiceSettings.subtitleFontSize())

    const [showPhone, setShowPhone] = useState(invoiceSettings.showPhone())
    const [showAddress, setShowAddress] = useState(invoiceSettings.showAddress())

    const [footer, setFooter] = useState(invoiceSettings.footer())
    const [footerFontSize, setFooterFontSize] = useState(invoiceSettings.footerFontSize())

    const [previewType, setPreviewType] = useState('salesOrder');


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
                        no: row['送货单号'],
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

    const ItemTitle = (text) => {
        return <font style={{ fontWeight: 'bold', fontSize: '12pt' }}>{text}</font>
    }

    return (
        <div style={props.style || {}}>
            <h2>清单外观</h2>
            <Card>
                <Form layout='vertical' >
                    <Item label={ItemTitle('尺寸及字号')}>
                        <Space direction="vertical">
                            <Space wrap>
                                <InputNumber style={{ width: '150px' }} addonBefore="宽度" value={width} onChange={val => {
                                    setWidth(val); localStorage.setItem('width', val);
                                }} />
                                <InputNumber style={{ width: '150px' }} addonBefore="高度" value={height} onChange={val => {
                                    setHeight(val); localStorage.setItem('height', val);
                                }} />
                            </Space>
                            <Space wrap>
                                <InputNumber style={{ width: '150px' }} addonBefore="水平边距" value={hPadding} onChange={val => {
                                    setHPadding(val); localStorage.setItem('hPadding', val);
                                }} />
                                <InputNumber style={{ width: '150px' }} addonBefore="垂直边距" value={vPadding} onChange={val => {
                                    setVPadding(val); localStorage.setItem('vPadding', val);
                                }} />
                                <InputNumber style={{ width: '130px' }} addonBefore="字号" value={fontSize} onChange={val => {
                                    setFontSize(val); localStorage.setItem('fontSize', val);
                                }} />
                            </Space>
                        </Space>
                    </Item>

                    <Item label={ItemTitle('标题及字号')}>
                        <Space wrap>
                            <Input style={{ width: '310px' }} value={title} onChange={e => {
                                setTitle(e.target.value); localStorage.setItem('title', e.target.value);
                            }} />
                            <InputNumber style={{ width: '130px' }} addonBefore="字号" value={titleFontSize} onChange={val => {
                                setTitleFontSize(val); localStorage.setItem('titleFontSize', val);
                            } }/>
                        </Space>
                    </Item>
                    
                    <Item label={ItemTitle('副标题及样式')}>
                        <Space direction="vertical">
                            <Space wrap>
                                <Input style={{ width: '235px' }} addonBefore='销售清单' value={salesOrderTitle} onChange={e => {
                                    setSalesOrderTitle(e.target.value); localStorage.setItem('salesOrderTitle', e.target.value);
                                }} />
                                <Input style={{ width: '235px' }} addonBefore='采购清单' value={purchaseOrderTitle} onChange={e => {
                                    setPurchaseOrderTitle(e.target.value); localStorage.setItem('purchaseOrderTitle', e.target.value);
                                }} />
                                <Input style={{ width: '235px' }} addonBefore='销售退款' value={salesRefundTitle} onChange={e => {
                                    setSalesRefundTitle(e.target.value); localStorage.setItem('salesRefundTitle', e.target.value);
                                }} />
                                <Input style={{ width: '235px' }} addonBefore='采购退款' value={purchaseRefundTitle} onChange={e => {
                                    setPurchaseRefundTitle(e.target.value); localStorage.setItem('purchaseRefundTitle', e.target.value);
                                }} />
                            </Space>
                            <Space wrap>
                                <Select value={titleStyle} options={[{label: '标题同行', value: 'inline'},{label: '另起一行', value: 'multi'}]} onChange={val => {
                                    setTitleStyle(val); localStorage.setItem('titleStyle', val);
                                }} />
                                <InputNumber style={{ width: '130px' }} addonBefore='字号' value={subtitleFontSize} disabled={titleStyle==='inline'} onChange={val => {
                                    setSubtitleFontSize(val); localStorage.setItem('subtitleFontSize', val);
                                }} />
                            </Space>
                        </Space>
                    </Item>

                    <Item label={ItemTitle('交易对象信息')}>
                        <Space wrap>
                            <Checkbox checked={showPhone} onChange={e => {
                                setShowPhone(e.target.checked); localStorage.setItem('showPhone', e.target.checked); 
                            }} >显示电话 (如有)</Checkbox>
                            <Checkbox checked={showAddress} onChange={e => {
                                setShowAddress(e.target.checked); localStorage.setItem('showAddress', e.target.checked); 
                            }} >显示地址 (如有)</Checkbox>
                        </Space>
                    </Item>
                    
                    <Item label={ItemTitle('脚注及字号')}>
                        <div style={{ color: 'gray', fontStyle: 'italic', fontSize: '9pt', marginBottom: '5px' }}>
                            * 以回车键分行，每行脚注将依次列在单据脚注位置，单据脚注为两列。
                        </div>
                        <Space direction="vertical">
                            <TextArea style={{ width: '600px' }} placeholder='脚注' autoSize value={footer} onChange={e => {
                                setFooter(e.target.value); localStorage.setItem('footer', e.target.value); 
                            }} />
                            <InputNumber style={{ width: '130px' }} addonBefore='字号' value={footerFontSize} onChange={val => {
                                setFooterFontSize(val); localStorage.setItem('footerFontSize', val);
                            }} />
                        </Space>
                    </Item>
                </Form>
            </Card>

            <h3>预览
                <Space.Compact size="small" style={{color:'gray', fontWeight: 'normal', marginLeft: '10px'}}>
                    <Button type='link' disabled={previewType==='salesOrder'} onClick={_ => setPreviewType('salesOrder')}>销售清单</Button>/
                    <Button type='link' disabled={previewType==='purchaseOrder'} onClick={_ => setPreviewType('purchaseOrder')}>采购清单</Button>/
                    <Button type='link' disabled={previewType==='salesRefund'} onClick={_ => setPreviewType('salesRefund')}>销售退款</Button>/
                    <Button type='link' disabled={previewType==='purchaseRefund'} onClick={_ => setPreviewType('purchaseRefund')}>采购退款</Button>
                </Space.Compact>
            </h3>
            
            {previewType === 'salesOrder' ? <InvoicePreview invoice={initSalesOrderForPreview(10)} type='salesOrder' /> : ''}
            {previewType === 'salesRefund' ? <InvoicePreview invoice={initSalesRefundForPreview(10)} type='salesRefund' /> : ''}

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