import dayjs from 'dayjs'


import { dateFormat } from './config'


export const isSalesOrderItemEmpty = (item) => {
    return item.material === '' && item.name === '' && item.spec === '' && item.quantity === null && 
    item.unit === '' && item.price === null && item.remark === '' && (item.discount === 100 || item.discount === null);
}

export const isSalesOrderItemComplete = (item) => {
    return item.material !== '' && item.name !== '' && item.spec !== '' && item.quantity !== null && 
    item.unit !== '' && item.price !== null && item.discount !== null;
}

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
