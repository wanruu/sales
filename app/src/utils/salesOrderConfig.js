import dayjs from 'dayjs'
import uuid from 'react-uuid'
const Decimal = require('decimal')

import { invoiceSettings } from './config'

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
        // items: [...Array(parseInt(invoiceSettings.defaultEditRowNum())).keys()].map(_ => emptySalesOrderItem()),
        items: [emptySalesOrderItem()]
    };
};

export const dcSalesOrder = (order) => {
    return {
        id: order.id,
        partner: order.partner,
        date: dayjs(order.date),
        draftTime: order.draftTime,
        amount: order.amount,
        items: JSON.parse(JSON.stringify(order.items))
    }
};
