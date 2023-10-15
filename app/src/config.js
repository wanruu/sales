import dayjs from "dayjs";


export const baseURL = () => {
    return "http://localhost:8888/"
}
export const dateFormat = 'YYYY年MM月DD日';

export const calItemAmount = (item) => {
    // if (item.quantity * item.unitPrice === 0) return -1;
    return parseFloat((item.quantity * item.unitPrice).toFixed(2));
};

export const dcInvoice = (invoice) => {
    return {
        no: invoice.no,
        customer: invoice.customer,
        date: dayjs(invoice.date),
        items: JSON.parse(JSON.stringify(invoice.items))
    }
};

export const emptyItem = () => {
    return { material: '', name: '', spec: '', quantity: 0, unitPrice: 0, amount: 0, remark: '', };
};

export const isItemEmpty = (item) => {
    return item.material === '' && item.name === '' && item.spec === '' && item.quantity === 0 && 
        item.unitPrice === 0 && item.remark === '';
}

export const emptyInvoice = () => {
    return {
        no: undefined,
        customer: '',
        date: dayjs(),
        items: [...Array(parseInt(invoiceSettings.defaultEditRowNum())).keys()].map(_ => emptyItem()),
    };
};


export const invoiceSettings = {
    width: () => localStorage.getItem('width') || 772,
    height: () => localStorage.getItem('height') || 493,
    title: () => localStorage.getItem('title') || '浙江埃尼斯阀门有限公司上海分公司  送货单',
    titleFontSize: () => localStorage.getItem('titleFontSize') || 23,
    footnote: () => localStorage.getItem('footnote') || '地址：新闸路431号                                    收货单位(盖章)\n' +
        '电话：021-53752277  53750057              及收货人：',
    footnoteFontSize: () => localStorage.getItem('footnoteFontSize') || 12,
    fontSize: () => localStorage.getItem('fontSize') || 12,
    hPadding: () => localStorage.getItem('hPadding') || 28,
    vPadding: () => localStorage.getItem('vPadding') || 25,
    defaultEditRowNum: () => localStorage.getItem('defaultEditRowNum') || 10,
}