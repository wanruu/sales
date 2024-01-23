import Decimal from 'decimal.js'

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
    tableFontSize: 14
}

export const printSettings = {
    get: (key) =>  localStorage.getItem(key) || DEFAULT_PRINT_SETTINGS[key],
    set: (key, value) => localStorage.setItem(key, value)
}

export const DEFAULT_INVOICE_SETTINGS = {
    ifShowDiscount: 'true', ifShowMaterial: 'true',
    ifShowDelivered: 'true'
}

export const invoiceSettings = {
    get: (key) =>  localStorage.getItem(key) || DEFAULT_INVOICE_SETTINGS[key],
    set: (key, value) => localStorage.setItem(key, value)
}

// export const UNIT_OPTIONS = [
//     { label: '-', value: '' },
//     { label: '千件', value: '千件' },
//     { label: '只', value: '只' },
//     { label: '包', value: '包' },
//     { label: '斤', value: '斤' },
//     { label: '套', value: '套' }
// ]

export const UNIT_OPTIONS = [
    { label: '-', value: '' },
    { label: '千只', value: '千只' },
    { label: '只', value: '只' }
]

// export const UNIT_COEFF_DICT = {
//     '': new Decimal(0),
//     '千件': new Decimal(1000),
//     '只': new Decimal(1),
//     '包': new Decimal(1),
//     '斤': new Decimal(1),
//     '套': new Decimal(1),
// }

export const UNIT_COEFF_DICT = {
    '': new Decimal(0),
    '千只': new Decimal(1),
    '只': new Decimal(1)
}

export const DEFAULT_PAGINATION = {
    defaultPageSize: 50, 
    pageSizeOptions: [50, 100], 
    showQuickJumper: true, 
    showSizeChanger: true
}
