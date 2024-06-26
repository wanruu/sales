import React, { useEffect, useMemo, useState } from 'react'
import Axios from 'axios'
import { Table, Modal, Button, Space, message, Tag, Affix, theme } from 'antd'
import { Decimal } from 'decimal.js'
import {
    ExclamationCircleFilled, DeleteOutlined, ExportOutlined,
    DownOutlined, UpOutlined, PlusOutlined
} from '@ant-design/icons'
import { useSelector, useDispatch } from 'react-redux'

const { confirm } = Modal


import { baseURL, DEFAULT_PAGINATION, DELIVER_COLORS, INVOICE_TITLE_OPTIONS, invoiceSettings } from '../utils/config'
import { MyWorkBook, MyWorkSheet } from '../utils/export'
import InvoiceSearchBox from '../components/invoice/SearchBox'
import MyFloatButton from '../components/common/MyFloatButton'
import InvoiceFullView from '../components/invoice/InvoiceFullView'
import NewInvoiceView from '../components/invoice/NewInvoiceView'
import { emptyInvoice } from '../utils/invoiceUtils'


/*
    Required: type
*/
export default function InvoicePage(props) {
    const [invoices, setInvoices] = useState([])
    const [filteredInvoices, setFilteredInvoices] = useState([])
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(undefined)
    const [newInvoice, setNewInvoice] = useState(undefined)

    const [messageApi, contextHolder] = message.useMessage()
    const { token: { colorBgContainer }, } = theme.useToken()
    
    const showSearchBox = useSelector(state => state.page[props.type]?.showSearchBox)
    const dispatch = useDispatch()
    const [affixed, setAffixed] = useState(false)

    const isOrder = ['salesOrder', 'purchaseOrder'].includes(props.type)
    const isSales = ['salesOrder', 'salesRefund'].includes(props.type)
    const partnerTitle = isSales ? '客户' : '供应商'
    const relatedInvoiceTitle = isOrder ? '关联退货单' : (isSales ? '关联销售单' : '关联采购单')
    const relatedInvoiceDataIndex = isOrder ? 'refundId' : 'orderId'

    const load = () => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: props.type,
            'Content-Type': 'application/json',
        }).then(res => {
            const newInvoices = res.data.map(invoice => {
                invoice.paid = Decimal(invoice.payment).plus(invoice.prepayment).toNumber()
                invoice.unpaid = Decimal(invoice.amount).minus(invoice.paid).toNumber()
                return invoice
            })
            setInvoices(newInvoices)
        }).catch(_ => { })
    }

    const tableColumns = useMemo(() => {
        const ifShowDelivered = invoiceSettings.get('ifShowDelivered') == 'true'
        const amountSign = invoiceSettings.get('ifShowAmountSign') === 'true' ? invoiceSettings.get('amountSign') : ''
        const ifShowPayment = invoiceSettings.get('ifShowPayment') === 'true'
        const ifShowRefund = invoiceSettings.get('ifShowRefund') === 'true'
        return [
            { title: '序号', align: 'center', render: (_, __, idx) => idx + 1, fixed: 'left' },
            { title: '单号', dataIndex: 'id', align: 'center', render: id => <a onClick={_ => setSelectedInvoiceId(id)}>{id}</a> },
            { title: partnerTitle, dataIndex: 'partner', align: 'center' },
            { title: '日期', dataIndex: 'date', align: 'center' },
            { title: '金额', dataIndex: 'amount', align: 'center', render: amount => amountSign + amount.toLocaleString() },
            ifShowPayment ? {
                title: '已付', dataIndex: 'paid', align: 'center', render: paid => amountSign + paid.toLocaleString()
            } : null,
            ifShowPayment ? {
                title: '未付', dataIndex: 'unpaid', align: 'center', render: unpaid =>
                    <span style={{ color: unpaid === 0 ? 'black' : 'red' }}>{amountSign + unpaid.toLocaleString()}</span>
            } : null,
            ifShowDelivered ? {
                title: '配送情况', dataIndex: 'delivered', align: 'center', render: d => <Tag color={DELIVER_COLORS[d]}>{d}</Tag>
            } : null,
            ifShowRefund ? { 
                title: relatedInvoiceTitle, dataIndex: relatedInvoiceDataIndex, align: 'center', render: id => 
                    id ? <a onClick={_ => setSelectedInvoiceId(id)}>{id}</a> : null 
            } : null,
            {
                title: '操作', align: 'center', fixed: 'right', render: (_, record) => (
                    <Button onClick={_ => showDeleteConfirm([record.id])} danger icon={<DeleteOutlined />} />
                )
            }
        ].filter(i => i != null)
    }, [localStorage])

    const showDeleteConfirm = (invoiceIds) => {
        const invoiceName = {
            'salesOrder': '销售清单',
            'purchaseOrder': '采购清单',
            'salesRefund': '销售退货单',
            'purchaseRefund': '采购退货单'
        }[props.type]
        const title = invoiceIds.length === 1 ? `是否删除${invoiceName} ${invoiceIds[0]} ?` : `是否删除 ${invoiceIds.length} 张${invoiceName}?`
        confirm({
            title: title, icon: <ExclamationCircleFilled />,
            content: '确认删除后不可撤销，同时仓库中产品的库存会相应恢复。',
            okText: '删除', okType: 'danger', cancelText: '取消',
            onOk() {
                Axios({
                    method: 'delete',
                    baseURL: baseURL(),
                    url: props.type,
                    data: { ids: invoiceIds },
                    'Content-Type': 'application/json',
                }).then(_ => {
                    load()
                    messageApi.open({ type: 'success', content: '删除成功' })
                }).catch(_ => {
                    messageApi.open({ type: 'error', content: '删除失败' })
                })
            }
        })
    }

    // button handler
    const handleExport = () => {
        const ifShowDelivered = invoiceSettings.get('ifShowDelivered') == 'true'
        const ifShowPayment = invoiceSettings.get('ifShowPayment') === 'true'
        const headers = [
            { title: '单号', dataIndex: 'id' },
            { title: '客户', dataIndex: 'partner' },
            { title: '日期', dataIndex: 'date' },
            { title: '金额', dataIndex: 'amount' },
            ifShowPayment ? { title: '订金', dataIndex: 'prepayment' } : null,
            ifShowPayment ? { title: '尾款', dataIndex: 'payment' } : null,
            ifShowPayment ? { title: '已付', dataIndex: 'paid' } : null,
            ifShowPayment ? { title: '未付', dataIndex: 'unpaid' } : null,
            ifShowDelivered ? { title: '配送情况', dataIndex: 'delivered' } : null,
            { title: '关联退货单', dataIndex: 'refundId' }
        ].filter(h => h != null)
        const title = INVOICE_TITLE_OPTIONS.filter(o => o.key === props.type)?.[0]?.label || ''
        let wb = new MyWorkBook(title ? title + '单' : '错误')
        let ws = new MyWorkSheet('总览')
        ws.writeJson(filteredInvoices, headers)
        wb.writeSheet(ws)
        wb.save()
    }

    const handleCreate = () => {
        setNewInvoice(emptyInvoice(isOrder ? 1 : 0))
    }

    const handleSearchToggle = () => {
        dispatch({ type: 'page/toggleShowSearchBox', menuKey: props.type })
    }

    useEffect(load, [props.type])


    // scroll position listener & recover
    const scrollY = useSelector(state => state.page[props.type]?.scrollY)

    useEffect(() => {
        const handleScroll = () => {
            dispatch({ type: 'page/updateScrollY', menuKey: props.type, scrollY: window.scrollY })
        }
        window.addEventListener('scroll', handleScroll)
        return () => {
            window.removeEventListener('scroll', handleScroll)
        }
    }, [props.type])

    useEffect(() => window.scrollTo(0, scrollY), [invoices])
    // ------------------------------------


    return <Space direction='vertical' style={{ width: '100%' }}>
        {contextHolder}

        <Modal title={null} open={selectedInvoiceId} width='90%' destroyOnClose
            onCancel={_ => setSelectedInvoiceId(undefined)} footer={null}>
            <InvoiceFullView id={selectedInvoiceId} refresh={load} messageApi={messageApi} allowEditPartner={true} />
        </Modal>

        <Modal title={null} open={newInvoice} width='90%' destroyOnClose
            onCancel={_ => setNewInvoice(undefined)} footer={null}>
            <NewInvoiceView invoice={newInvoice} dismiss={_ => setNewInvoice(undefined)}
                messageApi={messageApi} type={props.type} refresh={load} />
        </Modal>

        <Affix offsetTop={0} onChange={setAffixed}>
            <Space className={`toolBar-${affixed}`} direction='vertical' style={{ background: colorBgContainer }} size={0}>
                <Space wrap>
                    <Button icon={<PlusOutlined />} onClick={handleCreate}>新增</Button>
                    <Button icon={<ExportOutlined />} onClick={handleExport}>导出</Button>
                    <Button onClick={handleSearchToggle} icon={showSearchBox ? <UpOutlined /> : <DownOutlined />}>
                        {showSearchBox ? '收起搜索' : '展开搜索'}
                    </Button>
                </Space>
                <InvoiceSearchBox data={invoices} setFilteredData={setFilteredInvoices} type={props.type} />
            </Space>
        </Affix>

        <div className='pageMainContent'>
            <Table dataSource={filteredInvoices} bordered rowKey={record => record.id}
                columns={tableColumns} pagination={DEFAULT_PAGINATION} scroll={{ x: 'max-content' }} />
        </div>
        <MyFloatButton type={props.type} refresh={load} messageApi={messageApi} />
    </Space>
}
