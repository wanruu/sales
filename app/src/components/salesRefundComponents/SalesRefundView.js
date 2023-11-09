import React, { useState, useEffect, useRef } from 'react'
import Axios from 'axios'
import Decimal from 'decimal.js'
import { Table, Button, DatePicker, Col, Row, InputNumber, Input, Divider, Space, Modal } from 'antd'
import { FieldNumberOutlined, EditOutlined, PrinterOutlined, SaveOutlined, DeleteOutlined, 
    CloseOutlined, TableOutlined, RollbackOutlined
} from '@ant-design/icons'
import { useReactToPrint } from 'react-to-print'


import { calItemAmount, calTotalAmount, dcInvoice } from '../../utils/invoiceUtils'
import { baseURL, dateFormat } from '../../utils/config'
import { DeliveredInput } from '../common/PromptInput'
import { getExportData, exportExcel } from '../../utils/export'
import SalesRefundItemSelectView from './SalesRefundItemSelectView'
import InvoicePreview from '../common/InvoicePreview'


/*
    Required: id, refresh, messageApi
*/
export default function SalesRefundView(props) {
    const [refund, setRefund] = useState(undefined)
    const [mode, setMode] = useState('view')

    const load = () => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: `salesRefund/id/${props.id}`,
            'Content-Type': 'application/json',
        }).then(res => {
            const newRefund = res.data
            newRefund.items = newRefund.items.map(item => {
                item.delivered = item.delivered === 1
                item.orderId = newRefund.orderId
                return item
            })
            newRefund.unpaid = Decimal(newRefund.amount).minus(newRefund.payment).toString()
            setRefund(newRefund)
        }).catch(_ => { })
    }

    useEffect(load, [])

    return <>
        <div style={{ display: mode === 'edit' ? 'block' : 'none' }}>
            <EditView refund={refund} setMode={setMode} messageApi={props.messageApi} refresh={_ => { load(); props.refresh() }} /> 
        </div>
        <div style={{ display: mode === 'view' ? 'block' : 'none'}}>
            <View refund={refund} setMode={setMode} />
        </div>
        <div style={{ display: mode === 'print' ? 'block' : 'none'}}>
            <PrintView refund={refund} setMode={setMode} />
        </div>
    </>
}

/*
    Required: refund, setMode, refresh, messageApi
*/
function EditView(props) {
    const [refund, setRefund] = useState(undefined)
    const [isSelectionModalOpen, setSelectionModalOpen] = useState(false)
    
    const initRefund = () => {
        setRefund(props.refund ? dcInvoice(props.refund) : undefined)
    }
    const updateRow = (idx, field, value) => {
        const newRefund = dcInvoice(refund)
        newRefund.items[idx][field] = value
        if ('quantity' === field) {
            const { originalAmount, amount } = calItemAmount(newRefund.items[idx])
            newRefund.items[idx].originalAmount = originalAmount
            newRefund.items[idx].amount = amount
            newRefund.amount = calTotalAmount(newRefund.items)
        }
        setRefund(newRefund)
    }
    const updateRefund= (field, value) => {
        const newRefund = dcInvoice(refund)
        newRefund[field] = value
        setRefund(newRefund)
    }
    const itemColumns = [
        { title: '', align: 'center', width: 30, render: (_, __, idx) => idx + 1 },
        { title: '材质', dataIndex: 'material', align: 'center', width: 50 },
        { title: '名称', dataIndex: 'name', align: 'center', width: 150 },
        { title: '规格', dataIndex: 'spec', align: 'center', width: 70 },
        { title: '数量', dataIndex: 'quantity', align: 'center', width: 70, render: (_, record, idx) => 
            <InputNumber min={0} stringMode keyboard={false} size='small' controls={false} style={{width: '100%'}} 
                value={record.quantity} onChange={value => updateRow(idx, 'quantity', value)} />
        },
        { title: '单位', dataIndex: 'unit', align: 'center', width: 50 },
        { title: '单价', dataIndex: 'price', align: 'center', width: 70 },
        { title: '金额', dataIndex: 'originalAmount', align: 'center', width: 80 },
        { title: '折扣', dataIndex: 'discount', align: 'center', width: 50, render: d => `${d}%`},
        { title: '折后价', dataIndex: 'amount', align: 'center', width: 80 },
        { title: '备注', dataIndex: 'remark', align: 'center', width: 100, render: (_, record, idx) => 
            <Input size='small' style={{ width: '100%' }} value={record.remark} onChange={e => updateRow(idx, 'remark', e.target.value)} />
        },
        { title: '配送', dataIndex: 'delivered', align: 'center', width: 60, fixed: 'right', render: (_, record, idx) => 
            <DeliveredInput size='small' align='center' style={{ width: '100%' }} value={record.delivered} 
                onChange={value => updateRow(idx, 'delivered', value)} />
        },
        { title: '', align: 'center', width: 30, fixed: 'right', render: (_, __, idx) => 
            <Button type='link' size='small' danger onClick={_ => {
                const newRefund = dcInvoice(refund)
                newRefund.items.splice(idx, 1)
                newRefund.amount = calTotalAmount(newRefund.items)
                if (newRefund.items.length === 0) newRefund.partner = ''
                setRefund(newRefund)
            }}><DeleteOutlined /></Button>
        }
    ]
    const upload = () => {
        const newRefund = dcInvoice(refund)
        newRefund.date = newRefund.date.format(dateFormat)
        newRefund.items = newRefund.items.map(item => {
            item.quantity = item.quantity || '0'
            return item
        })
        newRefund.orderId = newRefund.items[0].orderId
        Axios({
            method: 'put',
            baseURL: baseURL(),
            url: `salesRefund/id/${refund.id}`,
            data: newRefund,
            'Content-Type': 'application/json',
        }).then(_ => {
            props.messageApi.open({ type: 'success', content: '保存成功' })
            props.refresh()
            props.setMode('view')
        }).catch(_ => {
            props.messageApi.open({ type: 'error', content: '保存失败' })
        })
    }

    useEffect(initRefund, [props.refund])

    return !refund ? null : <>
        <Space direction='vertical' style={{ width: '100%', marginTop: '10px', marginBottom: '15px' }}>
            <Row align='middle'>
                <Col span={8}>客户：
                    {refund.partner ? refund.partner : <span style={{color: 'gray'}}>(选择产品后自动显示)</span>}
                </Col>
                <Col span={8} align='center'>日期：
                    <DatePicker size='small' value={refund.date} onChange={value => updateRefund('date', value)}/>
                </Col>
                <Col span={8} align='right'><FieldNumberOutlined style={{ marginRight: '4px' }} />{refund.id}</Col>
            </Row>
            <Row align='middle'>
                <Col span={8}>总金额：{refund.amount}</Col>
                <Col span={8} align='center'>付款：
                    <InputNumber size='small' keyboard={false} stringMode controls={false} 
                        placeholder={`应付 ${Decimal(refund.amount).minus(refund.prepayment || 0)}`}
                        value={refund.payment} onChange={value => updateRefund('payment', value)} />
                    <Button size='small' style={{marginLeft: '5px'}} icon={<EditOutlined />}
                        onClick={_ => updateRefund('payment', Decimal(refund.amount).minus(refund.prepayment || 0).toString())} />
                </Col>
                <Col span={8} align='right'>
                    <Button type='primary' onClick={_ => setSelectionModalOpen(true)}>选择销售单及产品</Button>
                </Col>
            </Row>
        </Space>
        <Table className='editTable' dataSource={refund.items} size='small' bordered pagination={false}
            rowKey={r => r.invoiceItemId} style={{height: 400}} scroll={{x: 'max-content', y: 400 }} columns={itemColumns} />
    
        <Divider />
        <Col align='end'>
            <Space>
                <Button icon={<SaveOutlined/>} type='primary' onClick={upload}>保存</Button>
                <Button icon={<CloseOutlined/>} onClick={_ => { initRefund(); props.setMode('view') }}>取消</Button>
            </Space>
        </Col>

        <Modal title='选择销售单及产品' open={isSelectionModalOpen} width={1000} center onCancel={_ => setSelectionModalOpen(false)} footer={null} destroyOnClose>
            <SalesRefundItemSelectView editRefund={refund} setEditRefund={setRefund} dismiss={_ => setSelectionModalOpen(false)} />
        </Modal>
    </>
}

/*
    Required: refund, setMode
*/
function View(props) {
    const itemColumns = [
        { title: '', align: 'center', width: 30, render: (_, __, idx) => idx + 1 },
        { title: '材质', dataIndex: 'material', align: 'center', width: 50, export: true, summary: '总计' },
        { title: '名称', dataIndex: 'name', align: 'center', width: 150, export: true },
        { title: '规格', dataIndex: 'spec', align: 'center', width: 70, export: true },
        { title: '数量', dataIndex: 'quantity', align: 'center', width: 70, export: true },
        { title: '单位', dataIndex: 'unit', align: 'center', width: 50, export: true },
        { title: '单价', dataIndex: 'price', align: 'center', width: 70, export: true },
        { title: '金额', dataIndex: 'originalAmount', align: 'center', width: 80, export: true, summary: 'sum' },
        { title: '折扣', dataIndex: 'discount', align: 'center', width: 50, export: true, onExport: d => `${d}%`, render: discount => `${discount}%` },
        { title: '折后价', dataIndex: 'amount', align: 'center', width: 80, export: true, summary: 'sum' },
        { title: '备注', dataIndex: 'remark', align: 'center', width: 100, export: true },
        { title: '配送', dataIndex: 'delivered', align: 'center', width: 60, fixed: 'right', export: true, onExport: d => d ? '已配送' : '未配送', 
            render: delivered => <span style={{ color: delivered ? 'black' : 'red' }}>{delivered ? '已配送' : '未配送'}</span>
        }
    ]
    const exportFile = () => {
        exportExcel(`销售退货单${props.refund.id}`, getExportData(itemColumns, props.refund.items))
    }
    return !props.refund ? null : <>
        <Space direction='vertical' style={{ width: '100%', marginTop: '10px', marginBottom: '15px' }}>
            <Row style={{ justifyContent: 'space-between' }}>
                <div>客户：{props.refund.partner}</div>
                <div>日期：{props.refund.date}</div>
                <div>单号：{props.refund.id}</div>
                <div>关联销售单：{props.refund.orderId || '无'}</div>
            </Row>
            <Row style={{ justifyContent: 'space-between' }}>
                <div>总金额：{props.refund.amount}</div>
                <div align='right'>已付：{props.refund.payment}</div>
                <div align='right'>未付：
                    <span style={{ color: props.refund.unpaid === '0' ? 'black' : 'red' }}>{props.refund.unpaid}</span>
                </div>
            </Row>
        </Space>

        <Table dataSource={props.refund.items} columns={itemColumns} size='small' bordered style={{ height: 400 }} 
            rowKey={record => record.id} scroll={{x: 'max-content', y: 400 }} pagination={false} />

        <Divider />
        <Col align='end'>
            <Space>
                <Button icon={<EditOutlined/>} type='primary' onClick={_ => props.setMode('edit')}>编辑</Button>
                <Button icon={<TableOutlined/>} onClick={exportFile}>导出</Button>
                <Button icon={<PrinterOutlined/>} onClick={_ => props.setMode('print')}>打印预览</Button>
            </Space>
        </Col>
    </>
}


function PrintView(props) {
    // for print
    const componentRef = useRef(null)
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
    })

    return <Space direction='vertical' size='middle' style={{ width: '100%', marginTop: '10px', marginBottom: '10px' }}>
        <Col align='middle' style={{ overflowX: 'auto', overflowY: 'clip' }}>
            <div ref={componentRef} > 
                {!props.refund ? null : <InvoicePreview invoice={props.refund} type='salesRefund' />}
            </div>
        </Col>
        <Col align='end'>
            <Space>
                <Button icon={<RollbackOutlined />} onClick={_ => props.setMode('view')}>返回</Button>
                <Button icon={<PrinterOutlined/>} onClick={handlePrint} type='primary'>打印</Button>
            </Space>
        </Col>
    </Space>
}