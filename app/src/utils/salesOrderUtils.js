import { invoiceSettings } from './config'

export const isSalesOrderItemEmpty = (item) => {
    const ifShowMaterial = invoiceSettings.get('ifShowMaterial') === 'true'
    if (ifShowMaterial) 
        return item.material === '' && item.name === '' && item.spec === '' && 
            item.quantity === null && item.unit === '' && item.price === null && item.remark === '' && 
            (item.discount === 100 || item.discount === null)
    return item.name === '' && item.spec === '' && 
        item.quantity === null && item.unit === '' && item.price === null && item.remark === '' && 
        (item.discount === 100 || item.discount === null)
}

export const isSalesOrderItemComplete = (item) => {
    const ifShowMaterial = invoiceSettings.get('ifShowMaterial') === 'true'
    if (ifShowMaterial) 
        return item.material !== '' && item.name !== '' && item.spec !== '' && item.quantity !== null && 
            item.unit !== '' && item.price !== null && item.discount !== null
    return item.name !== '' && item.spec !== '' && item.quantity !== null && 
        item.unit !== '' && item.price !== null && item.discount !== null
}

export const isProductRepeat = (items) => {
    const ifShowMaterial = invoiceSettings.get('ifShowMaterial') === 'true'
    const isSameProduct = (item1, item2) => {
        if (ifShowMaterial) return item1.name === item2.name && item1.spec === item2.spec && item1.material === item2.material
        return item1.name === item2.name && item1.spec === item2.spec
    }
    for (const item1 of items) {
        for (const item2 of items) {
            if (item1.id !== item2.id && isSameProduct(item1, item2)) {
                return true
            }
        }
    }
    return false
}