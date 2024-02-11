import React, { useEffect, useState } from 'react'
import Axios from 'axios'
import Decimal from 'decimal.js'


import { baseURL } from '../../utils/config'
import InvoicePrintView from './InvoicePrintView'
import InvoiceView from './InvoiceView'
import InvoiceEditView from './InvoiceEditView'


const TITLE_DICT = {
    'salesOrder': '销售清单',
    'purchaseOrder': '采购清单',
    'salesRefund': '销售退货单',
    'purchaseRefund': '采购退货单'
}


/*
    Required: type, invoice, refresh, messageApi, dismiss
    Optional: //allowEditPartner (false by default)
*/
export default function NewInvoiceView(props) {
    const title = TITLE_DICT[props.type]

    const [invoice, setInvoice] = useState(props.invoice)
    const [mode, setMode] = useState('edit')

    const refresh = (id) => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: `${props.type}/id/${id}`,
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
        props.refresh()
    }

    const modeDict = {
        'edit': <InvoiceEditView type={props.type} invoice={invoice} dismiss={props.dismiss}
            setMode={setMode} refresh={refresh} messageApi={props.messageApi} />,
        'view': <InvoiceView type={props.type} invoice={invoice} allowEditPartner={false} refresh={refresh}
            setMode={setMode} />,
        'print': invoice.id ? <InvoicePrintView invoice={invoice} type={props.type} setMode={setMode} /> : null
    }


    return (
        <>
            <div style={{ fontSize: '12pt', fontWeight: 'bold', margin: '5px 0px' }}>
                {invoice.id ? `${title} (${invoice.id})` : `新建${title}`}
            </div>
            {modeDict[mode]}
        </>
    )
}