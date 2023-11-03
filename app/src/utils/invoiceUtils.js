import dayjs from 'dayjs'
import { Decimal } from 'decimal.js';
import uuid from 'react-uuid'


import { unitCoeffDict } from './config'


export const dcInvoice = (invoice) => {
    return {
        id: invoice.id,
        partner: invoice.partner,
        date: dayjs(invoice.date),
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
    const quantity = new Decimal(itemDict.quantity || 0)
    const price = new Decimal(itemDict.price || 0)
    const unit = new Decimal(unitCoeffDict[itemDict.unit])
    const discount = new Decimal(itemDict.discount || 0)

    const originalAmount = quantity.times(price).times(unit)
    const amount = originalAmount.times(discount).dividedBy(100)

    return { originalAmount: originalAmount.toFixed(2, Decimal.ROUND_HALF_UP), amount: amount.toFixed(2, Decimal.ROUND_HALF_UP)}
}

export const calTotalAmount = (items) => {
    return items.reduce((previous, current) => previous.plus(current.amount), Decimal(0)).toFixed(2, Decimal.ROUND_HALF_UP)
}