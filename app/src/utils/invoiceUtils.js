import dayjs from 'dayjs'
import Decimal from 'decimal.js'
import uuid from 'react-uuid'


import { invoiceSettings } from './config'


export const dcInvoice = (invoice) => {
    return {
        id: invoice.id,
        partner: invoice.partner,
        date: invoice.date == null ? null : dayjs(invoice.date),
        draftTime: invoice.draftTime,
        amount: invoice.amount,
        payment: invoice.payment,
        prepayment: invoice.prepayment,
        items: JSON.parse(JSON.stringify(invoice.items))
    }
}

export const emptyInvoiceItem = () => {
    return {
        id: uuid(),
        material: '', name: '', spec: '', unit: '',
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
        items:  [...Array(itemsNum).keys()].map(_ => emptyInvoiceItem()),
    }
}

export const calItemAmount = (itemDict) => {
    const quantity = Decimal(itemDict.quantity || 0)
    const price = Decimal(itemDict.price || 0)
    const discount = Decimal(itemDict.discount || 0)

    const originalAmount = quantity.times(price)
    const amount = originalAmount.times(discount).dividedBy(100)

    return { originalAmount: originalAmount.toString(), amount: amount.toString()}
}

export const calTotalAmount = (items) => {
    return items.reduce((previous, current) => previous.plus(current.amount), Decimal(0)).toFixed(2, Decimal.ROUND_HALF_UP)
}


export const isOrderItemEmpty = (item) => {
    const ifShowMaterial = invoiceSettings.get('ifShowMaterial') === 'true'
    if (ifShowMaterial) 
        return item.material === '' && item.name === '' && item.spec === '' && 
            item.quantity === null && item.unit === '' && item.price === null && item.remark === '' && 
            (item.discount === 100 || item.discount === null)
    return item.name === '' && item.spec === '' && 
        item.quantity === null && item.unit === '' && item.price === null && item.remark === '' && 
        (item.discount === 100 || item.discount === null)
}

export const isOrderItemComplete = (item) => {
    const ifShowMaterial = invoiceSettings.get('ifShowMaterial') === 'true'
    if (ifShowMaterial) 
        return item.material !== '' && item.name !== '' && item.spec !== '' && item.quantity !== null && 
            item.unit !== '' && item.price !== null && item.discount !== null
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
