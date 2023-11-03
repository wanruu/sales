import dayjs from 'dayjs'

import { dateFormat } from './config'


export const initSalesRefundForPreview = (itemNum=1) => {
    return {
        id: 999999,
        partner: '',
        date: dayjs().format(dateFormat),
        amount: '0',
        payment: '',
        items: [...Array(itemNum).keys()].map(_ => { return {
            material: '', name: '', spec: '', 
            quantity: '0', unit: '', price: '0', 
            amount: '0',
            remark: ''
        }}),
    };
}
