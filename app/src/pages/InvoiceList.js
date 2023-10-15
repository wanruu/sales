import { Table, Modal, Button, Space, message, Input, AutoComplete, DatePicker, Switch, Col, } from "antd";
import { useEffect, useState, useRef } from "react";
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useReactToPrint } from "react-to-print";
import React from 'react';
import Axios from 'axios';
import dayjs from "dayjs";


import Invoice from "../components/Invoice.js";
import { dateFormat, baseURL, calItemAmount, dcInvoice, emptyItem, isItemEmpty, invoiceSettings } from '../config.js';

const { confirm } = Modal;
const { Column } = Table;



function InvoiceList() {
    // data
    const [invoices, setInvoices] = useState([]);
    const [resInvoices, setResInvoices] = useState([]);
    const [invoice, setInvoice] = useState(undefined);
    const [editInvoice, setEditInvoice] = useState(undefined);
    const [mode, setMode] = useState('view');
    const [messageApi, contextHolder] = message.useMessage();
    // search
    const [no, setNo] = useState('');
    const [customer, setCustomer] = useState('');
    const [customerOptions, setCustomerOptions] = useState([]);
    const [date, setDate] = useState(null);

    // alert modal
    // const [loadAlert, setLoadAlert] = useState(false);
    // const [errInfo, setErrInfo] = useState({});

    // network
    const loadInvoices = () => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: 'invoice/overview',
            'Content-Type': 'application/json',
        }).then(res => {
            const formatInvoices = res.data.map((invoice, idx) => {
                const newInvoice = Object.assign(invoice, { key: idx + 1 });
                newInvoice.date = dayjs(invoice.date).format(dateFormat);
                return newInvoice;
            });
            setInvoices(formatInvoices);
        }).catch(err => {
            // setLoadAlert(true);
            // setErrInfo({ code: err.code.toString(), message: err.message });
        });
    };
    const loadInvoice = (no) => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: 'invoice',
            params: { no: no },
            'Content-Type': 'application/json',
        }).then(res => {
            if (res.status !== 200 || res.data.length === 0) {
                setInvoice(undefined);
                setEditInvoice(undefined);
            } else {
                const newInvoice = res.data[0];
                newInvoice.date = dayjs(newInvoice.date);
                newInvoice.items = newInvoice.items.map(item =>
                    Object.assign(item, { amount: calItemAmount(item) })
                );
                setInvoice(newInvoice);
                const newEditInvoice = dcInvoice(newInvoice);
                while (newEditInvoice.items.length < parseInt(invoiceSettings.defaultEditRowNum())) {
                    newEditInvoice.items.push(emptyItem());
                }
                setEditInvoice(newEditInvoice);
            }
        }).catch(_ => {
            setInvoice(undefined);
            setEditInvoice(undefined);
        });
    };
    const deleteInvoice = (no) => {
        Axios({
            method: 'delete',
            baseURL: baseURL(),
            url: 'invoice',
            data: { no: no, oper: 'bin' },
            'Content-Type': 'application/json',
        }).then(res => {
            if (res.status == 200) {
                const newInvoices = invoices.filter(invoice => invoice.no !== no);
                setInvoices(newInvoices);
                messageApi.open({ type: 'success', content: '删除成功', });
            } else {
                messageApi.open({ type: 'error', content: '删除失败', });
            }
        }).catch(_ => {
            messageApi.open({ type: 'error', content: '删除失败', });
        });
    };
    const uploadInvoice = () => {
        // clean data
        const newInvoice = dcInvoice(editInvoice);
        newInvoice.date = newInvoice.date.format('YYYY-MM-DD');
        newInvoice.items = newInvoice.items.filter(item => {
            return item.material !== '' || item.name !== '' || item.spec !== '' || item.quantity !== 0 || item.unitPrice !== 0 || item.remark !== ''
        });
        const nIncomplete = newInvoice.items.filter(item => {
            return item.material === '' || item.name === '' || item.spec === ''
        }).length;

        // check data
        if (newInvoice.customer === '') {
            messageApi.open({ type: 'error', content: '收货单位不得为空', });
        } else if (newInvoice.items.length === 0) {
            messageApi.open({ type: 'error', content: '表格不得为空', });
        } else if (nIncomplete > 0) {
            messageApi.open({ type: 'error', content: '表格填写不完整', });
        } else {
            Axios({
                method: 'post',
                baseURL: baseURL(),
                url: 'invoice',
                data: newInvoice,
                'Content-Type': 'application/json',
            }).then(res => {
                if (res.status === 200) {
                    newInvoice.date = dayjs(newInvoice.date);
                    if (res.data.no !== undefined) {
                        newInvoice.no = res.data.no;
                    }
                    setInvoice(newInvoice);
                    const newEditInvoice = dcInvoice(newInvoice);
                    while (newEditInvoice.items.length < parseInt(invoiceSettings.defaultEditRowNum())) {
                        newEditInvoice.items.push(emptyItem());
                    }
                    setEditInvoice(newEditInvoice);
                    setMode('view');
                    messageApi.open({ type: 'success', content: '保存成功', });
                } else {
                    messageApi.open({ type: 'error', content: '保存失败', });
                }
            }).catch(_ => {
                messageApi.open({ type: 'error', content: '保存失败', });
            });
        }
    };
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

    // button listener
    const onClickDelete = (no) => {
        return () => confirm({
            title: `是否将单号${no}移入回收站？`,
            icon: <ExclamationCircleOutlined />,
            content: <p>可在回收站中恢复或者永久删除，回收站中的数据将不在发货清单中显示，且不计入统计数据</p>,
            okType: 'danger',
            onOk() { deleteInvoice(no) },
            onCancel() { }
        });
    };
    const onClickView = (no) => {
        return () => {
            setMode('view');
            loadInvoice(no);
        }
    };
    const onClickEdit = (no) => {
        return () => {
            setMode('edit');
            loadInvoice(no);
        }
    };
    const onClickClose = () => {
        setInvoice(undefined);
        setEditInvoice(undefined);
        loadInvoices();
    };
    const onClickSaveEdit = () => {
        if (mode === 'edit') {
            uploadInvoice();
        } else {
            setMode('edit');
        }
    }
    const onClickSearch = () => {
        const newInvoices = invoices.filter(invoice =>
            (no === '' || invoice.no.match(new RegExp(no, 'i')) !== null) &&
            (customer === '' || invoice.customer.match(new RegExp(customer, 'i')) !== null) &&
            (date === null || invoice.date === date.format(dateFormat))
        );
        setResInvoices(newInvoices);
    }
    const addProduct = () => {
        const newInvoice = dcInvoice(editInvoice);
        newInvoice.items.push(emptyItem());
        setEditInvoice(newInvoice);
    }
    const removeProduct = () => {
        const newInvoice = dcInvoice(editInvoice);
        var lastIdx = -1;
        newInvoice.items.forEach((item, idx) => {
            if (isItemEmpty(item)) lastIdx = idx;
        });
        if (lastIdx === -1) {
            messageApi.open({ type: 'error', content: '无空产品可移除', });
            return;
        }
        newInvoice.items = newInvoice.items.filter((_, idx) => idx !== lastIdx);
        setEditInvoice(newInvoice);
    }

    // for updating data
    const onDataChange = (type) => {
        if (type === 'customer' || type === 'date') {
            return (data) => {
                const newEditInvoice = dcInvoice(editInvoice);
                if (type === 'customer') {
                    newEditInvoice.customer = data;
                } else {
                    newEditInvoice.date = data;
                }
                setEditInvoice(newEditInvoice);
            }
        } else if (type === 'items') {
            return (index, field, data) => {
                const newEditInvoice = dcInvoice(editInvoice);
                const newItems = JSON.parse(JSON.stringify(newEditInvoice.items));
                newItems[index][field] = data;
                if (field === 'quantity' || field === 'unitPrice') {
                    newItems[index].amount = calItemAmount(newItems[index]);
                }
                newEditInvoice.items = newItems;
                setEditInvoice(newEditInvoice);
            }
        }
    };

    const onIsPaidChange = (no) => {
        return (value) => {
            Axios({
                method: 'put',
                baseURL: baseURL(),
                url: 'invoice/pay',
                data: { no: no, isPaid: value },
                'Content-Type': 'application/json',
            }).then(res => {
                if (res.status == 200) {
                    messageApi.open({ type: 'success', content: '更新成功', });
                    const newInvoices = invoices.map(invoice => {
                        if (invoice.no === no) {
                            invoice.isPaid = value === true ? 1 : 0;
                        }
                        return invoice;
                    });
                    setInvoices(newInvoices);
                } else {
                    messageApi.open({ type: 'error', content: '更新失败', });
                }
            }).catch(_ => {
                messageApi.open({ type: 'error', content: '更新失败', });
            });
        }
    }

    const onIsInvoicedChange = (no) => {
        return (value) => {
            Axios({
                method: 'put',
                baseURL: baseURL(),
                url: 'invoice/invoice',
                data: { no: no, isInvoiced: value },
                'Content-Type': 'application/json',
            }).then(res => {
                if (res.status == 200) {
                    messageApi.open({ type: 'success', content: '更新成功', });
                    const newInvoices = invoices.map(invoice => {
                        if (invoice.no === no) {
                            invoice.isInvoiced = value === true ? 1 : 0;
                        }
                        return invoice;
                    });
                    setInvoices(newInvoices);
                } else {
                    messageApi.open({ type: 'error', content: '更新失败', });
                }
            }).catch(_ => {
                messageApi.open({ type: 'error', content: '更新失败', });
            });
        }
    }


    // for print
    const componentRef = useRef(null);
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
    });

    // load data at beginning
    useEffect(() => {
        loadInvoices();
    }, []);
    useEffect(() => {
        onClickSearch();
    }, [invoices])


    // press enter to add product
    // useEffect(() => {
    //     const handleKeyDown = (event) => {
    //         if (event.key === 'Enter') {
    //             if (mode == 'edit') {
    //                 addProduct();
    //             }
    //         }
    //     };
    //     document.addEventListener('keydown', handleKeyDown);
    //     return () => {
    //         document.removeEventListener('keydown', handleKeyDown);
    //     };
    // }, [editInvoice, mode]);


    return (
        <div>
            {contextHolder}
            <h2>发货清单</h2>

            <Space.Compact block>
                <Input
                    style={{ width: '25%' }}
                    placeholder='单号'
                    value={no}
                    onChange={e => setNo(e.target.value)}
                    allowClear
                />
                <AutoComplete
                    style={{ width: '25%' }}
                    placeholder='收货单位'
                    value={customer}
                    onChange={data => setCustomer(data)}
                    onSearch={(text) => searchCustomers(text, 10)}
                    options={customerOptions}
                    allowClear
                />
                <DatePicker
                    style={{ width: '25%' }}
                    placeholder='开单日期'
                    format={dateFormat}
                    value={date}
                    onChange={data => setDate(data)}
                    allowClear
                />
                <Button type='primary' onClick={onClickSearch}>模糊查询</Button>
            </Space.Compact>

            <br />

            <Modal
                open={invoice !== undefined && editInvoice !== undefined}
                width={900}
                onCancel={onClickClose}
                footer={<Button onClick={onClickClose}>关闭</Button>}
            >
                <Space direction="vertical" size="middle" style={{ display: 'flex', }}>
                    <Space>
                        <Button type='primary' onClick={onClickSaveEdit}>{mode === 'edit' ? '保存' : '编辑'}</Button>
                        {
                            mode === 'edit' ?
                                <>
                                    <Button onClick={addProduct}>新增产品</Button>
                                    <Button onClick={removeProduct}>移除产品</Button>
                                </> :
                                <Button onClick={handlePrint}>打印</Button>}
                    </Space>

                    <div ref={componentRef}>
                        <Invoice mode={mode} invoice={invoice} editInvoice={editInvoice}
                            onCustomerChange={onDataChange('customer')}
                            onDateChange={onDataChange('date')}
                            onItemsChange={onDataChange('items')}
                        />
                    </div>
                </Space>
            </Modal>

            <Table dataSource={resInvoices} size='small' bordered
            pagination={{ defaultPageSize: 20, showSizeChanger: true, pageSizeOptions: [20, 50, 100], showQuickJumper: true }} >
                <Column title='序号' dataIndex='key' align='center' />
                <Column title='单号' dataIndex='no' align='center' sorter={(a, b) => a.no > b.no ? 1 : -1} />
                <Column title='开单日期' dataIndex='date' align='center' sorter={(a, b) => a.date > b.date ? 1 : (a.date === b.date ? 0 : -1)} />
                <Column title='收货单位' dataIndex='customer' align='center' sorter={(a, b) => a.customer > b.customer ? 1 : (a.customer === b.customer ? 0 : -1)} />
                <Column title='金额' dataIndex='amount' align='right' sorter={(a, b) => a.amount > b.amount ? 1 : (a.amount === b.amount ? 0 : -1)} render={amount => (
                    `¥ ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                )} />
                
                <Column title='款项' dataIndex='isPaid' align='center' render={(isPaid, invoice) => (
                    <Switch checked={isPaid===1} onChange={onIsPaidChange(invoice.no)} />
                )} filters={[{text: '已收款', value: 1}, {text: '未收款', value: 0}].filter(item => resInvoices.map(i=>i.isPaid).includes(item.value))}  
                onFilter={(value, invoice) => 
                    invoice.isPaid === value || (value === 0 && invoice.isPaid === null)
                } />
                <Column title='发票' dataIndex='isInvoiced' align='center' render={(isInvoiced, invoice) => (
                    <Switch checked={isInvoiced===1} onChange={onIsInvoicedChange(invoice.no)} />
                )} filters={[{text: '已开票', value: 1}, {text: '未开票', value: 0}].filter(item => resInvoices.map(i=>i.isInvoiced).includes(item.value))}  
                onFilter={(value, invoice) => 
                    invoice.isInvoiced === value || (value === 0 && invoice.isInvoiced === null)
                } />
                <Column title='操作' dataIndex='oper' align='center' render={(_, invoice) => (
                    <Space>
                        <Button onClick={onClickView(invoice.no)}>查看</Button>
                        <Button onClick={onClickEdit(invoice.no)} type='primary' ghost>编辑</Button>
                        <Button onClick={onClickDelete(invoice.no)} danger>删除</Button>
                    </Space>
                )} />
            </Table>
        </div >
    );
}


export default InvoiceList;