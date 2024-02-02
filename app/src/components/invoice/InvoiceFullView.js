import React, { useEffect, useState } from 'react'
import Axios from 'axios'
import Decimal from 'decimal.js'


import { baseURL } from '../../utils/config'
import InvoicePrintView from './InvoicePrintView'
import InvoiceView from './InvoiceView'
import InvoiceEditView from './InvoiceEditView'


const PREFIX_DICT = {
    'XS': { type: 'salesOrder', title: '销售清单' },
    'CG': { type: 'purchaseOrder', title: '采购清单' },
    'XT': { type: 'salesRefund', title: '销售退货单' },
    'CT': { type: 'purchaseRefund', title: '采购退货单' }
}


/*
    Required: id, refresh, messageApi
    Optional: allowEditPartner (false by default)
*/
export default function InvoiceFullView(props) {
    const type = PREFIX_DICT[props.id.slice(0, 2)].type
    const title = PREFIX_DICT[props.id.slice(0, 2)].title

    const [invoice, setInvoice] = useState(undefined)
    const [mode, setMode] = useState('view')

    const load = () => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: `${type}/id/${props.id}`,
            'Content-Type': 'application/json',
        }).then(res => {
            const newInvoice = res.data
            newInvoice.paid = Decimal(newInvoice.prepayment).plus(newInvoice.payment).toNumber()
            newInvoice.unpaid = Decimal(newInvoice.amount).minus(newInvoice.paid).toNumber()
            newInvoice.items = newInvoice.items.map(item => {
                item.delivered = item.delivered === 1
                return item
            })
            setInvoice(newInvoice)
        }).catch(_ => { })
    }

    const refresh = () => {
        load()
        props.refresh()
    }

    const modeDict = {
        'edit': <InvoiceEditView type={type} invoice={invoice} 
        dismiss={_ => setMode('view')} refresh={refresh} messageApi={props.messageApi} />,
        'view': invoice ?
            <InvoiceView type={type} invoice={invoice} allowEditPartner={props.allowEditPartner} refresh={refresh}
            setMode={setMode} />    
        : null,
        'print': <InvoicePrintView invoice={invoice} type={type} dismiss={_ => setMode('view')} />
    }

    useEffect(load, [])

    return (
        <>
            <div style={{ fontSize: '12pt', fontWeight: 'bold', margin: '5px 0px' }}>
                { title } ({ props.id })
            </div>
            { modeDict[mode] }
        </>
    )
}