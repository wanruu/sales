import dayjs from 'dayjs'
import uuid from 'react-uuid'
import { Decimal } from 'decimal.js';

import { invoiceSettings, dateFormat, unitCoeffDict } from './config'

export const emptySalesOrderItem = () => {
    return { 
        id: uuid(),
        material: '', name: '', spec: '', 
        quantity: null, unit: '', price: null, originalAmount: Decimal(0), 
        discount: 100, amount: Decimal(0),
        remark: '', 
    };
};

export const isSalesOrderItemEmpty = (item) => {
    return item.material === '' && item.name === '' && item.spec === '' && item.quantity === null && 
    item.unit === '' && item.price === null && item.remark === '' && (item.discount === 100 || item.discount === null);
}

export const isSalesOrderItemComplete = (item) => {
    return item.material !== '' && item.name !== '' && item.spec !== '' && item.quantity !== null && 
    item.unit !== '' && item.price !== null && item.discount !== null;
}

export const emptySalesOrder = () => {
    return {
        id: undefined,
        partner: '',
        date: dayjs(),
        draftTime: undefined,
        amount: Decimal(0),
        prepayment: '',
        payment: '',
        // items: [...Array(parseInt(invoiceSettings.defaultEditRowNum())).keys()].map(_ => emptySalesOrderItem()),
        items: [emptySalesOrderItem()]
    };
};

export const initSalesOrderForPreview = (itemNum=1) => {
    return {
        id: 999999,
        partner: '',
        date: dayjs().format(dateFormat),
        amount: '0',
        prepayment: '',
        items: [...Array(itemNum).keys()].map(_ => { return {
            material: '', name: '', spec: '', 
            quantity: '0', unit: '', price: '0', 
            amount: '0',
            remark: ''
        }}),
    };
}

export const dcSalesOrder = (order) => {
    return {
        id: order.id,
        partner: order.partner,
        date: dayjs(order.date),
        draftTime: order.draftTime,
        amount: order.amount,
        payment: order.payment,
        prepayment: order.prepayment,
        items: JSON.parse(JSON.stringify(order.items))
    }
};


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
    return items.reduce((previous, current) => previous.plus(current.amount), new Decimal(0))
}