import Decimal from 'decimal.js'

export const baseURL = () => {
    return 'http://localhost:8888/'
}

export const DATE_FORMAT = 'YYYY-MM-DD'


export const invoiceSettings = {
    width: () => localStorage.getItem('width') || 772,
    height: () => localStorage.getItem('height') || 493,
    title: () => localStorage.getItem('title') || '鑫森（鑫欣）紧固件有限公司',
    salesOrderTitle: () => localStorage.getItem('salesOrderTitle') || '销售单',
    salesRefundTitle: () => localStorage.getItem('salesRefundTitle') || '销售退货单',
    purchaseOrderTitle: () => localStorage.getItem('purchaseOrderTitle') || '采购单',
    purchaseRefundTitle: () => localStorage.getItem('purchaseRefundTitle') || '采购退货单',
    titleFontSize: () => localStorage.getItem('titleFontSize') || 23,
    subtitleFontSize: () => localStorage.getItem('subtitleFontSize') || 20,
    titleStyle: () => localStorage.getItem('titleStyle') || 'inline',
    footer: () => localStorage.getItem('footer') || '送货电话：13605772335/15858580989/13306773365\n送货地址：浙江省温州市龙湾区紧固件市场8排34号\n工行：6222 0812 0301 2544 033（陈建挺）\n收货人(签字)：',
    footerFontSize: () => localStorage.getItem('footerFontSize') || 12,
    fontSize: () => localStorage.getItem('fontSize') || 12,
    hPadding: () => localStorage.getItem('hPadding') || 28,
    vPadding: () => localStorage.getItem('vPadding') || 24,
    showPhone: () => (localStorage.getItem('showPhone') || 'false') === 'true',
    showAddress: () => (localStorage.getItem('showAddress') || 'false') === 'true',
}

export const UNIT_OPTIONS = [
    { label: '-', value: '' },
    { label: '千件', value: '千件' },
    { label: '只', value: '只' },
    { label: '包', value: '包' },
    { label: '斤', value: '斤' },
    { label: '套', value: '套' }
]

export const UNIT_COEFF_DICT = {
    '': new Decimal(0),
    '千件': new Decimal(1000),
    '只': new Decimal(1),
    '包': new Decimal(1),
    '斤': new Decimal(1),
    '套': new Decimal(1),
}

export const DEFAULT_PAGINATION = {
    defaultPageSize: 50, 
    pageSizeOptions: [50, 100], 
    showQuickJumper: true, 
    showSizeChanger: true
}
