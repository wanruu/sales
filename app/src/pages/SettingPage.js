import { Input, Upload, InputNumber, Space, Select, Checkbox, Card, Form, Radio, Row,
    Switch, Typography, Table, Button, Collapse
} from 'antd'
import React, { useEffect, useState, } from 'react'
import * as XLSX from 'xlsx'
import Axios from 'axios'
import dayjs from 'dayjs'
import uuid from 'react-uuid'


import { baseURL } from '../utils/config'


import PhoneAccessView from '../components/common/PhoneAccessView'
import PrintSettingView from '../components/settingComponents/PrintSettingView'
import InvoiceSettingView from '../components/settingComponents/InvoiceSettingView'
import './SettingPage.css'


const { Title } = Typography


export default function SettingPage() {
    const handleUpload = (options) => {
        const { onSuccess, onError, file, onProgress } = options
        
        const xlsxFormatDate = (numb) => {
            const old = numb - 1
            const t = Math.round((old - Math.floor(old)) * 24 * 60 * 60)
            const time = new Date(1900, 0, old, 0, 0, t)
            const year = time.getFullYear() 
            const month = time.getMonth() + 1 
            const date = time.getDate() 
            return year + '-' + (month < 10 ? '0' + month : month) + '-' + (date < 10 ? '0' + date : date)
        }

        const groupData = (rows) => {
            // clean rows keys
            const newRows = rows.map((obj) => {
                const newObj = {} // 创建一个新的对象来存储处理后的键值对
                for (let key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        const newKey = key.replace(/\s/g, '') // 去除空格，创建新的键名
                        newObj[newKey] = obj[key] // 将原始键名对应的值赋给新的键名
                        if (newKey !== key) {
                            delete obj[key] // 删除原始键名
                        }
                    }
                }
                return newObj
            })

            var invoices = []
            for (const row of newRows) {
                if (row['材质'] === undefined || row['物品名称'] === undefined || row['规格'] === undefined) {
                    continue
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
                    })
                } else {
                    invoices[invoices.length-1].items.push(item)
                }
            }
            return invoices
        }

        const readFile = (file) => {
            const fileReader = new FileReader()
            fileReader.onload = (e) => {
                let workbook = XLSX.read(e.target.result, {type: 'binary'})
                Object.keys(workbook.Sheets).forEach(sheet => {
                    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet])
                    // group by invoice
                    const invoices = groupData(data)
                    Axios({
                        method: 'post',
                        baseURL: baseURL(),
                        url: 'invoices/upload/',
                        data: {invoices: invoices},
                        'Content-Type': 'application/json',
                    }).then(res => {
                        onSuccess()
                    }).catch(err => {
                        onError(err)
                    })
                })
            }
            fileReader.readAsBinaryString(file)
        }
        readFile(file)
    }

    return <div className='setting'>
        <h1>设置</h1>
        {/* <PhoneAccessView /> */}
        <Collapse>
            <Collapse.Panel header='清单设置' key='清单设置'>
                <InvoiceSettingView />
            </Collapse.Panel>
            <Collapse.Panel header='打印设置' key='打印设置'>
                <PrintSettingView />
            </Collapse.Panel>
        </Collapse>

        {/* <h2>导入</h2>
        <Upload directory accept='.xlsx' customRequest={handleUpload}>
            <Button>
                选择.xlsx文件
            </Button>
        </Upload> */}
    </div>
}