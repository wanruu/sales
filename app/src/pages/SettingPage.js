import { Typography, Collapse, Space, Anchor, Row, Col } from 'antd'
import React from 'react'
import * as XLSX from 'xlsx'

import uuid from 'react-uuid'



import PhoneAccessView from '../components/common/PhoneAccessView'
import PrintSettingView from '../components/setting/PrintSettingView'
import FunctionSettingView from '../components/setting/FunctionSettingView'
import ProductSettingView from '../components/setting/ProductSettingView'
import DisplaySettingView from '../components/setting/DisplaySettingView'
import './settingPage.css'
import CustomSettingView from '../components/setting/CustomSettingView'



export default function SettingPage() {
    // const handleUpload = (options) => {
    //     const { onSuccess, onError, file, onProgress } = options

    //     const xlsxFormatDate = (numb) => {
    //         const old = numb - 1
    //         const t = Math.round((old - Math.floor(old)) * 24 * 60 * 60)
    //         const time = new Date(1900, 0, old, 0, 0, t)
    //         const year = time.getFullYear() 
    //         const month = time.getMonth() + 1 
    //         const date = time.getDate() 
    //         return year + '-' + (month < 10 ? '0' + month : month) + '-' + (date < 10 ? '0' + date : date)
    //     }

    //     const groupData = (rows) => {
    //         // clean rows keys
    //         const newRows = rows.map((obj) => {
    //             const newObj = {} // 创建一个新的对象来存储处理后的键值对
    //             for (let key in obj) {
    //                 if (obj.hasOwnProperty(key)) {
    //                     const newKey = key.replace(/\s/g, '') // 去除空格，创建新的键名
    //                     newObj[newKey] = obj[key] // 将原始键名对应的值赋给新的键名
    //                     if (newKey !== key) {
    //                         delete obj[key] // 删除原始键名
    //                     }
    //                 }
    //             }
    //             return newObj
    //         })

    //         var invoices = []
    //         for (const row of newRows) {
    //             if (row['材质'] === undefined || row['物品名称'] === undefined || row['规格'] === undefined) {
    //                 continue
    //             }
    //             const item = {
    //                 material: row['材质'],
    //                 name: row['物品名称'],
    //                 spec: row['规格'],
    //                 unitPrice: row['单价'] === undefined ? 0 : row['单价'],
    //                 quantity: row['数量'] === undefined ? 0 : row['数量'],
    //                 remark: row['备注'] === undefined ? '' : row['备注'],

    //             }
    //             if (row['送货单号'] !== undefined) {
    //                 invoices.push({ 
    //                     no: row['送货单号'],
    //                     date: xlsxFormatDate(row['日期']),
    //                     customer: row['收货单位'],
    //                     isPaid: row['款项'] === '已收款',
    //                     isInvoiced: row['发票'] === '已开票',
    //                     items: [item]
    //                 })
    //             } else {
    //                 invoices[invoices.length-1].items.push(item)
    //             }
    //         }
    //         return invoices
    //     }

    //     const readFile = (file) => {
    //         const fileReader = new FileReader()
    //         fileReader.onload = (e) => {
    //             let workbook = XLSX.read(e.target.result, {type: 'binary'})
    //             Object.keys(workbook.Sheets).forEach(sheet => {
    //                 const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet])
    //                 // group by invoice
    //                 const invoices = groupData(data)
    //                 Axios({
    //                     method: 'post',
    //                     baseURL: baseURL(),
    //                     url: 'invoices/upload/',
    //                     data: {invoices: invoices},
    //                     'Content-Type': 'application/json',
    //                 }).then(res => {
    //                     onSuccess()
    //                 }).catch(err => {
    //                     onError(err)
    //                 })
    //             })
    //         }
    //         fileReader.readAsBinaryString(file)
    //     }
    //     readFile(file)
    // }

    const collapseItems = [
        { header: '产品设置', content: <ProductSettingView /> },
        { header: '功能设置', content: <FunctionSettingView /> },
        { header: '显示设置', content: <DisplaySettingView /> },
        { header: '打印设置', content: <PrintSettingView /> }
    ]

    const anchorItems = [
        {
            key: 'product', href: '#product', title: '产品设置', content: <ProductSettingView />,
            children: [
                { key: 'product-material', href: '#product-material', title: '材质' },
                { key: 'product-unit', href: '#product-unit', title: '单位' },
            ]
        },
        {
            key: 'function', href: '#function', title: '功能设置', content: <FunctionSettingView />,
            children: [
                { key: 'function-amount', href: '#function-amount', title: '金额计算功能' },
                { key: 'function-discount', href: '#function-discount', title: '折扣功能' },
                { key: 'function-deliver', href: '#function-deliver', title: '配送功能' },
                { key: 'function-account', href: '#function-account', title: '入账功能' }
            ]
        },
        {
            key: 'custom', href: '#custom', title: '用户定制', content: <CustomSettingView />,
            children: [
                { key: 'custom-remark-quantity', href: '#custom-remark-quantity', title: '备注计算功能' },
            ]
        },
        {
            key: 'print', href: '#print', title: '打印设置', content: <PrintSettingView />, 
            children: [
                { key: 'print-overall', href: '#print-overall', title: '清单整体' },
                { key: 'print-title', href: '#print-title', title: '标题' },
                { key: 'print-subtitle', href: '#print-subtitle', title: '副标题' },
                { key: 'print-info', href: '#print-info', title: '头部' },
                { key: 'print-table', href: '#print-table', title: '表格' },
                { key: 'print-footer', href: '#print-footer', title: '脚注' },
                { key: 'print-preview', href: '#print-preview', title: '打印预览' }
            ]
        },
        {
            key: 'display', href: '#display', title: '显示设置', content: <DisplaySettingView />,
            children: [
                { key: 'display-amount', href: '#display-amount', title: '金额' }
            ]
        },
    ]

    return (
        <div className='setting'>
            <Row>
                <Col span={20} style={{ paddingRight: '15px' }}>
                    {
                        anchorItems.map(i => <div key={i.key}>{i.content}</div>)
                    }
                </Col>
                <Col span={4}>
                    <Anchor items={anchorItems} />
                </Col>
            </Row>

            {/* <PhoneAccessView /> */}
            {/* <Space direction='vertical' style={{ width: '100%' }}>
                <Collapse>
                    { 
                        collapseItems.map(item => (
                            <Collapse.Panel header={item.header} key={item.header}>
                                { item.content }
                            </Collapse.Panel>
                        ))
                    }
                </Collapse>
            </Space> */}

            {/* <h2>导入</h2>
            <Upload directory accept='.xlsx' customRequest={handleUpload}>
                <Button>
                    选择.xlsx文件
                </Button>
            </Upload> */}
        </div>
    )
}