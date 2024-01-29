import dayjs from 'dayjs'
import Decimal from 'decimal.js'
import uuid from 'react-uuid'
import { Tag, Popover, Space } from 'antd'

import { invoiceSettings, DELIVER_COLORS, DATE_FORMAT } from './config'


export const dcInvoice = (invoice) => {
    if (invoice.date && typeof(invoice.date) !== 'string') {
        invoice.date = invoice.date.format(DATE_FORMAT)
    }
    const newInvoice = JSON.parse(JSON.stringify(invoice))
    newInvoice.date = newInvoice.date == null ? null : dayjs(newInvoice.date)
    return newInvoice
}

export const emptyInvoiceItem = () => {
    const unitOptions = JSON.parse(invoiceSettings.get('unitOptions'))
    const defaultUnit = unitOptions.filter(o => o.default)[0].label
    return {
        id: uuid(),
        material: '', name: '', spec: '', unit: defaultUnit,
        quantity: null, price: null, originalAmount: '0', 
        discount: 100, amount: '0', remark: '', 
        delivered: false, weight: null
    }
}

export const emptyInvoice = (itemsNum) => {
    return {
        id: undefined,
        partner: '',
        date: dayjs(),
        draftTime: undefined,
        amount: '0',
        prepayment: '',
        payment: '',
        items:  [...Array(itemsNum).keys()].map(_ => emptyInvoiceItem())
    }
}

export const calItemAmount = (itemDict) => {
    const quantity = Decimal(itemDict.quantity || 0)
    const price = Decimal(itemDict.price || 0)
    const discount = Decimal(itemDict.discount || 0)

    const originalAmount = quantity.times(price)
    const amount = originalAmount.times(discount).dividedBy(100)
    const itemAmountDigitNum = parseInt(invoiceSettings.get('itemAmountDigitNum'))

    return { 
        originalAmount: originalAmount.toFixed(itemAmountDigitNum, Decimal.ROUND_HALF_UP), 
        amount: amount.toFixed(itemAmountDigitNum, Decimal.ROUND_HALF_UP)
    }
}

export const calTotalAmount = (items) => {
    const invoiceAmountDigitNum = parseInt(invoiceSettings.get('invoiceAmountDigitNum'))
    return items.reduce((previous, current) => 
        previous.plus(current.amount || 0), Decimal(0)
    ).toFixed(invoiceAmountDigitNum, Decimal.ROUND_HALF_UP)
}


export const isOrderItemEmpty = (item) => {
    const ifShowMaterial = invoiceSettings.get('ifShowMaterial') === 'true'
    if (ifShowMaterial) 
        return item.material === '' && item.name === '' && item.spec === '' && 
            item.quantity === null && item.price === null && item.remark === '' && 
            (item.discount === 100 || item.discount === null)
    return item.name === '' && item.spec === '' && 
        item.quantity === null && item.price === null && item.remark === '' && 
        (item.discount === 100 || item.discount === null)
}

export const isOrderItemComplete = (item) => {
    return item.name !== '' && item.spec !== '' && item.quantity !== null && 
        item.unit !== '' && item.price !== null && item.discount !== null
}

export const isProductRepeat = (items) => {
    const ifShowMaterial = invoiceSettings.get('ifShowMaterial') === 'true'
    const isSameProduct = (item1, item2) => {
        if (ifShowMaterial) return item1.name === item2.name && item1.spec === item2.spec && item1.material === item2.material
        return item1.name === item2.name && item1.spec === item2.spec
    }
    for (const item1 of items) {
        for (const item2 of items) {
            if (item1.id !== item2.id && isSameProduct(item1, item2)) {
                return true
            }
        }
    }
    return false
}


export const getInvoiceViewTableColumns = (type) => {
    const ifShowMaterial = invoiceSettings.get('ifShowMaterial') === 'true'
    const ifShowDiscount = invoiceSettings.get('ifShowDiscount') === 'true'
    const ifShowItemDelivered = invoiceSettings.get('ifShowItemDelivered') === 'true'
    const ifShowAmountSign = invoiceSettings.get('ifShowAmountSign') === 'true'
    const amountSign = invoiceSettings.get('amountSign')
    const isRefund = type === 'salesRefund' || type === 'purchaseRefund'
    const ifShowWeight = type === 'purchaseOrder'
    return [
        { title: '', align: 'center', width: 30, fixed: 'left', render: (_, __, idx) => idx + 1 },
        ifShowMaterial ? { title: '材质', dataIndex: 'material', align: 'center', width: 50 } : null,
        { title: '名称', dataIndex: 'name', align: 'center', width: 120 },
        { title: '规格', dataIndex: 'spec', align: 'center', width: 70 },
        { title: '数量', dataIndex: 'quantity', align: 'center', width: 70, render: q => q.toLocaleString() },
        { title: '单位', dataIndex: 'unit', align: 'center', width: 50 },
        { title: '单价', dataIndex: 'price', align: 'center', width: 70, render: p => 
            (ifShowAmountSign ? amountSign : '') + p.toLocaleString()
        },
        ifShowDiscount ? { title: '金额', dataIndex: 'originalAmount', align: 'center', width: 80, render: a => 
            (ifShowAmountSign ? amountSign : '') + a.toLocaleString()
        } : null,
        ifShowDiscount ? { title: '折扣', dataIndex: 'discount', align: 'center', width: 50, render: discount => `${discount}%` } : null,
        { title: ifShowDiscount ? '折后价' : '金额', dataIndex: 'amount', align: 'center', width: 80, render: d => 
            (ifShowAmountSign ? amountSign : '') + d.toLocaleString()
        },
        ifShowWeight ? { title: '重量', dataIndex: 'weight', align: 'center', width: 80, render: w => w ? w.toLocaleString() : w 
        } : null,
        { title: '备注', dataIndex: 'remark', align: 'center', width: 160 },
        ifShowItemDelivered ? { title: '配送', dataIndex: 'delivered', align: 'center', width: 60, fixed: 'right', render: delivered => {
            const text = delivered ? '已配送' : '未配送'
            return <Tag color={DELIVER_COLORS[text]}>{text}</Tag>
        }} : null,
        isRefund ? null : { title: '退货状态', align: 'center', width: 75, fixed: 'right', render: (_, record) => 
            <Popover trigger='click' content={
                <Space direction='vertical'>
                    <span>退货数量：{(record.refundQuantity || 0).toLocaleString()}</span>
                    { ifShowDiscount ? <span>金额：{(record.refundOriginalAmount || 0).toLocaleString()}</span> : null }
                    <span>{ifShowDiscount ? '折后价：': '金额：'}{(record.refundAmount || 0).toLocaleString()}</span>
                </Space>
            }>
                <a>{ Decimal(record.refundQuantity || 0).equals(record.quantity) ? '全部退货' :
                    (Decimal(record.refundQuantity || 0).gt(record.quantity) ? '退货超数' : (
                        Decimal(record.refundQuantity || 0).equals(0) ? null : '部分退货'
                    ))
                }</a>
            </Popover>
        }
    ].filter(i => i != null)
}


export const getInvoiceExportColumns = (type) => {
    const ifShowMaterial = invoiceSettings.get('ifShowMaterial') === 'true'
    const ifShowDiscount = invoiceSettings.get('ifShowDiscount') === 'true'
    const ifShowWeight = type === 'purchaseOrder'
    const isRefund = type === 'salesRefund' || type === 'purchaseRefund'
    return [
        { title: '序号', onExport: (_,__,idx) => idx+1, summary: '总计'},
        ifShowMaterial ? { title: '材质', dataIndex: 'material' } : null,
        { title: '名称', dataIndex: 'name' },
        { title: '规格', dataIndex: 'spec' },
        { title: '数量', dataIndex: 'quantity' },
        { title: '单位', dataIndex: 'unit' },
        { title: '单价', dataIndex: 'price' },
        ifShowDiscount ? { title: '金额', dataIndex: 'originalAmount', summary: 'sum' } : null,
        ifShowDiscount ? { title: '折扣', dataIndex: 'discount', onExport: d => `${d}%` } : null,
        { title: ifShowDiscount ? '折后价' : '金额', dataIndex: 'amount', summary: 'sum' },
        ifShowWeight ? { title: '重量', dataIndex: 'weight' } : null,
        { title: '备注', dataIndex: 'remark' },
        { title: '配送', dataIndex: 'delivered', onExport: d => d ? '已配送' : '未配送' },
        isRefund ? null : { title: '退货状态', width: 75, onExport: (_, record) => 
            Decimal(record.refundQuantity || 0).equals(record.quantity) ? '全部退货' :
            (Decimal(record.refundQuantity || 0).gt(record.quantity) ? '退货超数' : (
            Decimal(record.refundQuantity || 0).equals(0) ? null : '部分退货'
        )) }
    ].filter(i => i != null)
}

export function digitUppercase(n) {
    var fraction = ['角', '分']
    var digit = [
        '零', '壹', '贰', '叁', '肆',
        '伍', '陆', '柒', '捌', '玖'
    ]
    var unit = [
        ['元', '万', '亿'],
        ['', '拾', '佰', '仟']
    ]
    var head = n < 0 ? '欠' : ''
    n = Math.abs(n)
    var s = ''
    for (var x = 0; x < fraction.length; x++) {
        s += (digit[Math.floor(shiftRight(n,1+x)) % 10] + fraction[x]).replace(/零./, '')
    }
    s = s || '整'
    n = Math.floor(n)
    for (var i = 0; i < unit[0].length && n > 0; i++) {
        var p = ''
        for (var j = 0; j < unit[1].length && n > 0; j++) {
            p = digit[n % 10] + unit[1][j] + p
            n = Math.floor(shiftLeft(n, 1))
        }
        s = p.replace(/(零.)*零$/, '').replace(/^$/, '零') + unit[0][i] + s
    }
    return head + s.replace(/(零.)*零元/, '元')
        .replace(/(零.)+/g, '零')
        .replace(/^整$/, '零元整')
}

// 向右移位
function shiftRight(number, digit){
    digit = parseInt(digit, 10)
    var value = number.toString().split('e')
    return +(value[0] + 'e' + (value[1] ? (+value[1] + digit) : digit))
}
// 向左移位
function shiftLeft(number, digit){
    digit = parseInt(digit, 10)
    var value = number.toString().split('e')
    return +(value[0] + 'e' + (value[1] ? (+value[1] - digit) : -digit))
}
