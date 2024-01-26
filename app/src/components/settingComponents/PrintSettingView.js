import { Input, InputNumber, Space, Select, Checkbox, Card, Form, Radio, Row } from 'antd'
import React, { useState } from 'react'
import dayjs from 'dayjs'
import uuid from 'react-uuid'


import { DATE_FORMAT, DEFAULT_PRINT_SETTINGS, printSettings } from '../../utils/config'
import InvoicePrintView from '../common/InvoicePrintView'
import SettingSwitchItem from './SettingSwitchItem'


const { Item } = Form


export default function PrintSettingView() {
    // Overall
    const [width, setWidth] = useState(localStorage.getItem('width'))
    const [height, setHeight] = useState(localStorage.getItem('height'))
    const [hPadding, setHPadding] = useState(localStorage.getItem('hPadding'))
    const [vPadding, setVPadding] = useState(localStorage.getItem('vPadding'))
    // Title
    const [title, setTitle] = useState(localStorage.getItem('title'))
    const [titleFontSize, setTitleFontSize] = useState(localStorage.getItem('titleFontSize'))
    const [salesOrderSubtitle, setSalesOrderSubtitle] = useState(localStorage.getItem('salesOrderSubtitle'))
    const [salesRefundSubtitle, setSalesRefundSubtitle] = useState(localStorage.getItem('salesRefundSubtitle'))
    const [purchaseOrderSubtitle, setPurchaseOrderSubtitle] = useState(localStorage.getItem('purchaseOrderSubtitle'))
    const [purchaseRefundSubtitle, setPurchaseRefundSubtitle] = useState(localStorage.getItem('purchaseRefundSubtitle'))
    const [subtitleStyle, setSubtitleStyle] = useState(printSettings.get('subtitleStyle'))
    const [subtitleFontSize, setSubtitleFontSize] = useState(localStorage.getItem('subtitleFontSize'))
    // Header
    const [headerFontSize, setHeaderFontSize] = useState(localStorage.getItem('headerFontSize'))
    const [ifShowPhone, setIfShowPhone] = useState(printSettings.get('ifShowPhone'))  // str: true / false
    const [ifShowAddress, setIfShowAddress] = useState(printSettings.get('ifShowAddress'))  // str: true / false
    // Table
    const [tableFontSize, setTableFontSize] = useState(printSettings.get('tableFontSize'))
    const [ifShowPrintAmountSign, setIfShowPrintAmountSign] = useState(printSettings.get('ifShowPrintAmountSign'))
    // Footer
    const [footer, setFooter] = useState(localStorage.getItem('footer'))
    const [footerFontSize, setFooterFontSize] = useState(localStorage.getItem('footerFontSize'))

    const subtitleStyleOptions = [
        { label: '标题同行', value: 'inline' },
        { label: '另起一行', value: 'multi' }
    ]

    const inputNum2Str = (val) => {
        if (val < 0) return ''
        return val === 0 ? '0' : val || ''
    }
    return <Card size='small'>
        <Space direction='vertical' size={0} style={{ width: '100%' }}>
            <div className='itemTitle'>清单整体</div>
            <Form layout='inline'>
                <Item label='宽度'>
                    <InputNumber keyboard={false} placeholder={DEFAULT_PRINT_SETTINGS.width}
                        value={width} onChange={val => { setWidth(inputNum2Str(val)); printSettings.set('width', inputNum2Str(val)) }} />
                </Item>
                <Item label='高度'>
                    <InputNumber keyboard={false} placeholder={DEFAULT_PRINT_SETTINGS.height}
                        value={height} onChange={val => { setHeight(inputNum2Str(val)); printSettings.set('height', inputNum2Str(val)) }} />
                </Item>
                <Item label='水平边距'>
                    <InputNumber keyboard={false} placeholder={DEFAULT_PRINT_SETTINGS.hPadding}
                        value={hPadding} onChange={val => { setHPadding(inputNum2Str(val)); printSettings.set('hPadding', inputNum2Str(val)) }} />
                </Item>
                <Item label='垂直边距'>
                    <InputNumber keyboard={false} placeholder={DEFAULT_PRINT_SETTINGS.vPadding}
                        value={vPadding} onChange={val => { setVPadding(inputNum2Str(val)); printSettings.set('vPadding', inputNum2Str(val)) }} />
                </Item>
            </Form>

            <div className='itemTitle'>标题</div>
            <Form layout='inline'>
                <Item label='标题'>
                    <Input placeholder={DEFAULT_PRINT_SETTINGS.title} value={title}
                        onChange={e => { printSettings.set('title', e.target.value); setTitle(e.target.value) }} style={{ width: '300px' }} />
                </Item>
                <Item label='标题字号'>
                    <InputNumber keyboard={false} placeholder={DEFAULT_PRINT_SETTINGS.titleFontSize} 
                        value={titleFontSize} onChange={val => { 
                            printSettings.set('titleFontSize', inputNum2Str(val)); setTitleFontSize(inputNum2Str(val)) }}/>
                </Item>
            </Form>

            <div className='itemTitle'>副标题</div>
            <Form layout='inline'>
                <Item label='副标题'>
                    <Input placeholder={DEFAULT_PRINT_SETTINGS.salesOrderSubtitle} value={salesOrderSubtitle} style={{ width: '130px' }}
                        onChange={e => { printSettings.set('salesOrderSubtitle', e.target.value); setSalesOrderSubtitle(e.target.value) }} />
                </Item>
                <Item label=''>
                    <Input placeholder={DEFAULT_PRINT_SETTINGS.salesRefundSubtitle} value={salesRefundSubtitle} style={{ width: '130px' }}
                        onChange={e => { printSettings.set('salesRefundSubtitle', e.target.value); setSalesRefundSubtitle(e.target.value) }} />
                </Item>
                <Item label=''>
                    <Input placeholder={DEFAULT_PRINT_SETTINGS.purchaseOrderSubtitle} value={purchaseOrderSubtitle} style={{ width: '130px' }}
                        onChange={e => { printSettings.set('purchaseOrderSubtitle', e.target.value); setPurchaseOrderSubtitle(e.target.value) }} />
                </Item>
                <Item label=''>
                    <Input placeholder={DEFAULT_PRINT_SETTINGS.purchaseRefundSubtitle} value={purchaseRefundSubtitle} style={{ width: '130px' }}
                        onChange={e => { printSettings.set('purchaseRefundSubtitle', e.target.value); setPurchaseRefundSubtitle(e.target.value) }} />
                </Item>
            </Form>
            <Form layout='inline'>
                <Item label='副标题样式'>
                    <Select options={subtitleStyleOptions} value={subtitleStyle} onChange={val => { printSettings.set('subtitleStyle', val); setSubtitleStyle(val) }} />
                </Item>
                <Item label='副标题字号' extra={subtitleStyle === 'inline' ? '当样式为“另起一行“时才可指定字号。' : ''}>
                    { subtitleStyle === 'inline' ?
                        <InputNumber disabled={true} value={titleFontSize || DEFAULT_PRINT_SETTINGS.titleFontSize} /> :
                        <InputNumber keyboard={false} placeholder={DEFAULT_PRINT_SETTINGS.subtitleFontSize} value={subtitleFontSize} 
                            onChange={val => { printSettings.set('subtitleFontSize', inputNum2Str(val)); setSubtitleFontSize(inputNum2Str(val)) }} />   
                    }
                </Item>
            </Form>

            <div className='itemTitle'>清单基本信息</div>
            <Item label='客户/供应商'>
                <Checkbox checked={ifShowPhone==='true'} onChange={e => { 
                    setIfShowPhone(`${e.target.checked}`); 
                    printSettings.set('ifShowPhone', e.target.checked) 
                }}>显示电话 (如有)</Checkbox>
                <Checkbox checked={ifShowAddress==='true'} onChange={e => {
                    setIfShowAddress(`${e.target.checked}`)
                    printSettings.set('ifShowAddress', e.target.checked) 
                }}>显示地址 (如有)</Checkbox>
            </Item>
        
        
            <Item label='字号'>
                <InputNumber keyboard={false} placeholder={DEFAULT_PRINT_SETTINGS.headerFontSize} disabled={subtitleStyle === 'inline'}
                    value={headerFontSize} onChange={val => { printSettings.set('headerFontSize', inputNum2Str(val)); setHeaderFontSize(inputNum2Str(val)) }} />
            </Item>
            

            <div className='itemTitle'>表格</div>
            <Item label='字号'>
                <InputNumber keyboard={false} placeholder={DEFAULT_PRINT_SETTINGS.tableFontSize} 
                    value={tableFontSize} onChange={val => { printSettings.set('tableFontSize', inputNum2Str(val)); setTableFontSize(inputNum2Str(val)) }}/>
            </Item>
            <SettingSwitchItem keyy='ifShowPrintAmountSign' value={ifShowPrintAmountSign} setValue={setIfShowPrintAmountSign} 
                label='显示金额符号' help='若开关打开，金额将会显示￥符号前缀，例如￥88；否则，只显示数字。' />

            <div className='itemTitle'>脚注</div>
            <Item label='脚注' extra='以回车键分行，每行脚注将依次列在单据脚注位置，单据脚注为两列。'>
                <Input.TextArea style={{ maxWidth: '600px' }} placeholder={DEFAULT_PRINT_SETTINGS.footer} autoSize
                    value={footer} onChange={e => { setFooter(e.target.value); printSettings.set('footer', e.target.value) }} />
            </Item>
            <Item label='字号'>
                <InputNumber keyboard={false} placeholder={DEFAULT_PRINT_SETTINGS.footerFontSize}
                    value={footerFontSize} onChange={val => { printSettings.set('footerFontSize', inputNum2Str(val)); setFooterFontSize(inputNum2Str(val)) }} />
            </Item>


            <div className='itemTitle'>预览</div>
            <PrintPreview/>
        </Space>
    </Card>
}


function PrintPreview() {
    const [previewType, setPreviewType] = useState(undefined)
    const [previewItemNum, setPreviewItemNum] = useState(8)
    const previews = {
        salesOrder: { title: '销售清单', prefix: 'XS' },
        purchaseOrder: { title: '采购清单', prefix: 'CG' },
        salesRefund: { title: '销售退货', prefix: 'XT' },
        purchaseRefund: { title: '采购退货', prefix: 'CT' }
    }
    const initInvoiceForPreview = (prefix, itemNum) => {
        return {
            id: `${prefix}${dayjs().format('YYYYMMDD')}0001`,
            partner: '交易对象',  phone: '12345678901', 
            address: '地址地址地址地址地址地址地址地址地址地址地址地址地址地址地址',
            date: dayjs().format(DATE_FORMAT),
            amount: '0',
            items: [...Array(itemNum).keys()].map((_, idx) => { return {
                productId: uuid(), // for table key
                material: `材质${idx+1}`, name: `名称${idx+1}`, spec: `规格${idx+1}`,
                quantity: idx+1, unit: '只', 
                price: 0, amount: 0, remark: `备注${idx+1}`
            }})
        }
    }
    return <Form layout='vertical'>
        <Item label=''>
            <Row style={{ marginBottom: '10px' }} align='middle'>
                <Radio.Group value={previewType} onChange={e => setPreviewType(e.target.value)} >
                    <Radio value={undefined}>不显示</Radio>
                    { Object.keys(previews).map(type => <Radio key={type} value={type}>{previews[type].title}</Radio>) }
                </Radio.Group>
                <InputNumber style={{ width: '130px' }} addonBefore='产品数' value={previewItemNum} onChange={num => setPreviewItemNum(Math.round(num)) } />
            </Row>
            
            { previewType ?
            <div style={{ overflowX: 'auto', overflowY: 'clip' }}>
                <InvoicePrintView type={previewType} invoice={initInvoiceForPreview(previews[previewType].prefix, previewItemNum)} />
            </div> : null }
        </Item>
    </Form>
}