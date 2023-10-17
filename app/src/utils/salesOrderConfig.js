import dayjs from 'dayjs'
import uuid from 'react-uuid'
import { Decimal } from 'decimal.js';

import { invoiceSettings, dateFormat } from './config'

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
        prepayment: order.prepayment,
        items: JSON.parse(JSON.stringify(order.items))
    }
};
