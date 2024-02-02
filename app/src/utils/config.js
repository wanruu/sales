
export const baseURL = () => {
    return `http://${window.electronAPI.queryServerIp()}:${window.electronAPI.queryServerPort()}`
}

export const DATE_FORMAT = 'YYYY-MM-DD'


export const DEFAULT_PRINT_SETTINGS = {
    width: 772, height: 493, hPadding: 28, vPadding: 24,
    title: 'xx公司', titleFontSize: 23,
    salesOrderSubtitle: '销售单', salesRefundSubtitle: '销售退货单', 
    purchaseOrderSubtitle: '采购单', purchaseRefundSubtitle: '采购退货单',
    subtitleFontSize: 20, subtitleStyle: 'inline',
    headerFontSize: 14, ifShowPhone: 'false', ifShowAddress: 'false',
    footer: '脚注1\n脚注2\n脚注3', footerFontSize: 12,
    tableFontSize: 14, ifShowPrintAmountSign: 'true', printAmountSign: '￥',
}

export const UNIT_OPTIONS = [
    { key: '只', label: '只', value: '只', default: true, showing: true },
    { key: '千只', label: '千只', value: '千只', default: false, showing: true },
    { key: '千件', label: '千件', value: '千件', default: false, showing: false },
    { key: '包', label: '包', value: '包', default: false, showing: false },
    { key: '斤', label: '斤', value: '斤', default: false, showing: false },
    { key: '套', label: '套', value: '套', default: false, showing: false }
]


export const DEFAULT_PAGINATION = {
    defaultPageSize: 50, 
    pageSizeOptions: [50, 100], 
    showQuickJumper: true, 
    showSizeChanger: true
}


export const DEFAULT_INVOICE_SETTINGS = {
    ifShowDiscount: 'true', ifShowMaterial: 'true',
    ifShowDelivered: 'true',
    ifShowAmountSign: 'true', amountSign: '￥', allowEditAmount: 'false',
    itemAmountDigitNum: '3', invoiceAmountDigitNum: '2',
    unitOptions: JSON.stringify(UNIT_OPTIONS),
    ifShowRemarkCalculator: 'true'
}


export const INVOICE_DELIVER_OPTIONS = [
    '未配送', '部分配送', '全部配送'
].map(val => ({ value: val, label: val }))

export const DELIVER_COLORS = {
    '全部配送': 'green',
    '已配送': 'green',
    '未配送': 'red',
    '部分配送': 'gold'
}


export const invoiceSettings = {
    get: (key) =>  localStorage.getItem(key) || DEFAULT_INVOICE_SETTINGS[key],
    set: (key, value) => localStorage.setItem(key, value)
}


export const printSettings = {
    get: (key) =>  localStorage.getItem(key) || DEFAULT_PRINT_SETTINGS[key],
    set: (key, value) => localStorage.setItem(key, value)
}

