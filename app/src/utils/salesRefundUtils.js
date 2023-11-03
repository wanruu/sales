import dayjs from 'dayjs'

import { dateFormat } from './config'


export const initSalesRefundForPreview = (itemNum=1) => {
    return {
        id: `XT${dayjs().format('YYYYMMDD')}0001`,
        partner: '',
        date: dayjs().format(dateFormat),
        amount: '0',
        phone: ' ',
        address: ' ',
        items: [...Array(itemNum).keys()].map(_ => { return {
            material: '', name: '', spec: '', unit: '', 
            quantity: '', price: '', amount: '', remark: ''
        }}),
    };
}
