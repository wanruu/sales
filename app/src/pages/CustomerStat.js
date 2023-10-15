import { Table, AutoComplete, Space, DatePicker, Button, Modal, Radio, Switch, Tooltip, Row, Col, message } from "antd";
import { useState, useEffect } from "react";
import React from 'react';
import Axios from "axios";
import dayjs from 'dayjs';
import { CheckOutlined, CloseOutlined, } from '@ant-design/icons';

import { baseURL, dateFormat } from '../config.js'
import { exportExcelMultiSheet } from '../utils/export.js'

const { RangePicker } = DatePicker;
const { Column } = Table;


function CustomerStat() {
    const [customer, setCustomer] = useState('');
    const [dateRange, setDateRange] = useState(null);
    const [customerOptions, setCustomerOptions] = useState([]);
    const [data, setData] = useState([]);  // {customer, amount, invoice: [{no, amount, date}]}

    const [selectedDataOption, setSelectedDataOption] = useState("总览");

    // 详情
    const [selectedOverview, setSelectedOverview] = useState(undefined);  // {customer, amount}
    const [selectedInvoices, setSelectedInvoices] = useState([]);  // [{key, no, date, amount, isClear}]
    const [selectedItems, setSelectedItems] = useState([]);  // [{key, no, date, name, spec, quantity, unit, unitPrice, amount, remark}]

    const [messageApi, contextHolder] = message.useMessage();

    // network
    const searchCustomers = (keyword, n) => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: 'prompt/customer',
            params: { keyword: keyword, maxLen: n },
            'Content-Type': 'application/json',
        }).then(res => {
            setCustomerOptions(res.data.map(customer => ({ value: customer })));
        }).catch(_ => {
            setCustomerOptions([]);
        });
    };
    const loadData = () => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: 'stat/account',
            params: {
                customer: customer === '' ? undefined : customer,
                start: dateRange !== null && dateRange[0] !== null ? dateRange[0].format('YYYY-MM-DD') : undefined,
                end: dateRange !== null && dateRange[1] !== null ? dateRange[1].format('YYYY-MM-DD') : undefined,
            },
            'Content-Type': 'application/json',
        }).then(res => {
            if (res.status === 200) {
                setData(res.data.map((item, idx) => Object.assign(item, {key: idx+1})));
            } else {
                setData([]);
            }
        }).catch(_ => {
            setData([]);
        });
    };
    const loadSelectedData = (row) => {
        setSelectedOverview(undefined);
        setSelectedInvoices([]);
        setSelectedItems([]);

        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: 'invoice',
            params: { nos: row.invoices.map(invoice => invoice.no) },
            'Content-Type': 'application/json',
        }).then(res => {
            var items = [];
            res.data.forEach(invoice => {
                invoice.items.forEach(item => {
                    items.push(Object.assign(item, { key: items.length+1, no: invoice.no, date: invoice.date, }));
                });
            });
            setSelectedItems(items);

            const invoices = res.data.map((invoice, idx) => 
                Object.assign(invoice, {
                    key: idx+1, 
                    amount: invoice.items.map(item => item.unitPrice * item.quantity).reduce((x, y) => x + y, 0)
                })
            );
            setSelectedInvoices(invoices);

            const unpaidAmount = invoices.filter(invoice => invoice.isPaid !== 1).map(i => i.amount).reduce((x, y) => x + y, 0);
            const uninvoicedAmount = invoices.filter(invoice => invoice.isInvoiced !== 1).map(i => i.amount).reduce((x, y) => x + y, 0);
            setSelectedOverview({ customer: row.customer, amount: row.amount, unpaidAmount: unpaidAmount, uninvoicedAmount: uninvoicedAmount });
        });
    }; 
    const onPaidChange = (nos) => {
        return (value) => {
            Axios({
                method: 'put',
                baseURL: baseURL(),
                url: 'invoice/pay',
                data: { nos: nos, isPaid: value },
                'Content-Type': 'application/json',
            }).then(res => {
                if (res.status == 200) {
                    const invoices = selectedInvoices.map(invoice => {
                        if (nos.includes(invoice.no)) {
                            invoice.isPaid = value === true ? 1 : 0;
                        }
                        return invoice;
                    });
                    setSelectedInvoices(invoices);

                    // update unpaid amount
                    const unpaidInvoices = invoices.filter(invoice => invoice.isPaid !== 1);
                    const unpaidAmount = unpaidInvoices.map(i => i.amount).reduce((x, y) => x + y, 0);
                    var newSelectedOverview = selectedOverview;
                    selectedOverview.unpaidAmount = unpaidAmount;
                    setSelectedOverview(newSelectedOverview);

                    // update unpaid date
                    loadData();
                    messageApi.open({ type: 'success', content: '更新成功', });
                } else {
                    messageApi.open({ type: 'error', content: '更新失败', });
                }
            }).catch(_ => {
                messageApi.open({ type: 'error', content: '更新失败', });
            });
        }
    };
    const onInvoicedChange = (nos) => {
        return (value) => {
            Axios({
                method: 'put',
                baseURL: baseURL(),
                url: 'invoice/invoice',
                data: { nos: nos, isInvoiced: value },
                'Content-Type': 'application/json',
            }).then(res => {
                if (res.status == 200) {
                    const invoices = selectedInvoices.map(invoice => {
                        if (nos.includes(invoice.no)) {
                            invoice.isInvoiced = value === true ? 1 : 0;
                        }
                        return invoice;
                    });
                    setSelectedInvoices(invoices);

                    // update uninvoiced amount
                    const uninvoicedInvoices = invoices.filter(invoice => invoice.isInvoiced !== 1);
                    const uninvoicedAmount = uninvoicedInvoices.map(i => i.amount).reduce((x, y) => x + y, 0);
                    var newSelectedOverview = selectedOverview;
                    selectedOverview.uninvoicedAmount = uninvoicedAmount;
                    setSelectedOverview(newSelectedOverview);

                    // update uninvoiced date
                    loadData();
                    messageApi.open({ type: 'success', content: '更新成功', });
                } else {
                    messageApi.open({ type: 'error', content: '更新失败', });
                }
            }).catch(_ => { 
                messageApi.open({ type: 'error', content: '更新失败', });
            });
        }
    };


    const saveExcel = () => {
        // construct title
        var title = selectedOverview.customer;
        if (dateRange === null) {
            title += "(所有时间)";
        } else if (dateRange[0] === null) {
            title += "(" + dayjs(dateRange[1]).format(dateFormat) + "及以前)"
        } else if (dateRange[1] === null) {
            title += "(" + dayjs(dateRange[0]).format(dateFormat) + "及以后)"
        } else {
            title += "(" + dayjs(dateRange[0]).format(dateFormat) + "-" + dayjs(dateRange[1]).format(dateFormat) + ")"
        }
        // add summary
        var details = selectedItems.map(item => {
            return {
                '单号': item.no,
                '日期': dayjs(item.date).format(dateFormat),
                '材质': item.material,
                '品名': item.name,
                '规格': item.spec,
                '数量': item.quantity,
                '单价': item.unitPrice,
                '金额': (item.unitPrice * item.quantity),
                '备注': item.remark,
            }
        });
        
        var overview = selectedInvoices.map(item => {
            return {
                '单号': item.no,
                '日期': dayjs(item.date).format(dateFormat),
                '金额': item.amount,
                '收款': item.isPaid === 1 ? '已收款' : '',
                '开票': item.isInvoiced === 1 ? '已开票' : '',
            }
        });

        details.push({'金额': selectedOverview.amount, '单号': '总计'});
        overview.push({'金额': selectedOverview.amount, '单号': '总计'});
        exportExcelMultiSheet(title + ".xlsx", [overview, details], ['总览', '明细']);
    };

    const onOptionChange = ({ target: { value } }) => {
        setSelectedDataOption(value);
    };

    // initial
    useEffect(() => {
        loadData();
    }, []);


    return (
        <div>
            {contextHolder}
            <Modal
                open={selectedOverview !== undefined}
                onCancel={() => {setSelectedOverview(undefined); setSelectedInvoices([]); setSelectedItems([]);}}
                width='90%'
                footer={
                    <div>
                        <Button onClick={() => saveExcel()}>导出xlsx</Button>
                        <Button onClick={() => {setSelectedOverview(undefined); setSelectedInvoices([]); setSelectedItems([]);}}>关闭</Button>
                    </div>
            }>
                {selectedOverview === undefined ? '' :
                    <div>
                        <h2>收货单位：{selectedOverview.customer}</h2>
                        <Row style={{fontWeight: 'bold'}}>
                            <Col span={6} style={{fontSize: '12pt'}}>清单数量：{selectedInvoices.length}</Col>
                            <Col span={6} style={{fontSize: '12pt'}}>总金额：¥ {selectedOverview.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Col>
                            <Col span={6} style={{fontSize: '12pt'}}>未收款：¥ {selectedOverview.unpaidAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Col>
                            <Col span={6} style={{fontSize: '12pt'}}>未开票：¥ {selectedOverview.uninvoicedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Col>
                        </Row>
                        <br/>
                        <Radio.Group options={["总览", "产品明细"]} value={selectedDataOption} onChange={onOptionChange} />
                    </div>
                }
                <br />

                {selectedDataOption == "产品明细" ? 
                    <Table dataSource={selectedItems} size='small' bordered
                    pagination={{ defaultPageSize: 20, showSizeChanger: true, pageSizeOptions: [20, 50, 70], showQuickJumper: true }} >
                        <Column title='序号' dataIndex='key' align='center' />
                        <Column title='单号' dataIndex='no' align='center' sorter={(a, b) => a.no > b.no ? 1 : -1} />
                        <Column title='日期' dataIndex='date' align='center' sorter={(a, b) => a.date > b.date ? 1 : -1} render={date => dayjs(date).format(dateFormat)} />
                        <Column title='材质' dataIndex='material' align='center' />
                        <Column title='品名' dataIndex='name' align='center' />
                        <Column title='规格' dataIndex='spec' align='center' />
                        <Column title='数量' dataIndex='quantity' align='center' render={quantity => quantity.toLocaleString(undefined, {maximumFractionDigits: 2})} />
                        <Column title='单价' dataIndex='unitPrice' align='right' render={unitPrice => '¥ ' + unitPrice.toLocaleString(undefined, {maximumFractionDigits: 2})} />
                        <Column title='金额' dataIndex='amount' align='right' render={(_, row) => '¥ ' + (row.quantity * row.unitPrice).toLocaleString(undefined, {maximumFractionDigits: 2})} />
                        <Column title='备注' dataIndex='remark' align='center' />
                    </Table>
                    :
                    <Table dataSource={selectedInvoices} size='small' bordered
                    pagination={{ defaultPageSize: 20, showSizeChanger: true, pageSizeOptions: [20, 50, 70], showQuickJumper: true }} >
                        <Column title='序号' dataIndex='key' align='center' />
                        <Column title='单号' dataIndex='no' align='center' sorter={(a, b) => a.no > b.no ? 1 : -1} />
                        <Column title='日期' dataIndex='date' align='center' sorter={(a, b) => a.date > b.date ? 1 : -1} render={date => dayjs(date).format(dateFormat)} />
                        <Column title='金额' dataIndex='amount' align='right' render={amount => '¥ ' + amount.toLocaleString(undefined, {maximumFractionDigits: 2})} />
                        <Column dataIndex='isPaid' align='center' title={
                            <Space>
                                款项
                                <Tooltip title='全部标记为已收款'>
                                    <Button icon={<CheckOutlined style={{ color: 'green' }} />} size='small' onClick={() => onPaidChange(selectedInvoices.map(i=>i.no))(true)} />
                                </Tooltip>
                                <Tooltip title='全部标记为未收款'>
                                    <Button icon={<CloseOutlined style={{ color: 'red' }} />} size='small' onClick={() => onPaidChange(selectedInvoices.map(i=>i.no))(false)} />
                                </Tooltip>
                            </Space>
                        } render={(isPaid, invoice) => 
                            <Switch checked={isPaid===1} onChange={onPaidChange([invoice.no])} />
                        } />
                        <Column dataIndex='isInvoiced' align='center' title={
                            <Space>
                                发票
                                <Tooltip title='全部标记为已开票'>
                                    <Button icon={<CheckOutlined style={{ color: 'green' }} />} size='small' onClick={() => onInvoicedChange(selectedInvoices.map(i=>i.no))(true)} />
                                </Tooltip>
                                <Tooltip title='全部标记为未开票'>
                                    <Button icon={<CloseOutlined style={{ color: 'red' }} />} size='small' onClick={() => onInvoicedChange(selectedInvoices.map(i=>i.no))(false)} />
                                </Tooltip>
                            </Space>
                        } render={(isInvoiced, invoice) => 
                            <Switch checked={isInvoiced===1} onChange={onInvoicedChange([invoice.no])} />
                        } />
                    </Table>
                }
            </Modal>

            <h2>客户结算</h2>
            <Space.Compact block>
                <AutoComplete
                    style={{ width: '30%' }}
                    options={customerOptions}
                    placeholder='收货单位'
                    onChange={data => setCustomer(data)}
                    allowClear
                    onSearch={text => searchCustomers(text, 10)}
                    value={customer}
                />
                <RangePicker
                    style={{ width: '50%' }}
                    format={dateFormat}
                    allowEmpty={[true, true]}
                    onChange={data => { setDateRange(data) }}
                />
                <Button type='primary' onClick={_ => loadData()}>搜索</Button>
            </Space.Compact>
            <p style={{ fontSize: '10pt', color: 'gray' }}>
                <em>*若收货单位为空，则搜索所有客户；开始日期与结束日期同理。</em>
            </p>

            <Table dataSource={data} size='small' bordered 
            pagination={{ defaultPageSize: 50, showSizeChanger: true, pageSizeOptions: [50, 100, 200], showQuickJumper: true }} >
                <Column title='序号' dataIndex='key' align='center' />
                <Column title='收货单位' dataIndex='customer' align='center' sorter={(a, b) => a.customer > b.customer ? 1 : -1} />
                <Column title='清单数量' dataIndex='invoices' align='center' sorter={(a, b) => a.invoices.length - b.invoices.length} render={invoices => invoices.length} />
                <Column title='金额' dataIndex='amount' align='right' sorter={(a, b) => a.amount - b.amount} render={amount => '¥ ' + amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} />
                <Column title='待收款' dataIndex='unpaid_date' align='center' render={date => {
                    if (date === undefined) {
                        return <CheckOutlined style={{ color: 'green' }} />;
                    } else {
                        return dayjs(date).format(dateFormat);
                    }
                }} sorter={(a, b) => {
                    if (a.unpaid_date === b.unpaid_date) {
                        return 0;
                    }
                    if (a.unpaid_date === undefined) {
                        return 1;
                    }
                    if (b.unpaid_date === undefined) {
                        return -1;
                    }
                    return a.unpaid_date > b.unpaid_date ? 1 : -1;
                }} />
                <Column title='待开票' dataIndex='uninvoiced_date' align='center' render={date => {
                    if (date === undefined) {
                        return <CheckOutlined style={{ color: 'green' }} />;
                    } else {
                        return dayjs(date).format(dateFormat);
                    };
                }} sorter={(a, b) => {
                    if (a.uninvoiced_date === b.uninvoiced_date) {
                        return 0;
                    }
                    if (a.uninvoiced_date === undefined) {
                        return 1;
                    }
                    if (b.uninvoiced_date === undefined) {
                        return -1;
                    }
                    return a.uninvoiced_date > b.uninvoiced_date ? 1 : -1;
                }} />
                <Column title='操作' dataIndex='oper' align='center' render={(_, row) => <Button type="primary" ghost onClick={() => loadSelectedData(row)}>详情</Button>} />
            </Table>
        </div >
    );
}

export default CustomerStat;