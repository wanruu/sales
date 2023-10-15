import { Table, Modal, Button, Space, message } from "antd";
import { useEffect, useState } from "react";
import { ExclamationCircleOutlined } from '@ant-design/icons';
import React from 'react';
import Axios from 'axios';
import dayjs from "dayjs";

import Invoice from "../components/Invoice.js";
import { baseURL, dateFormat, emptyItem, calItemAmount,  } from "../config";

const { confirm } = Modal;
const { Column } = Table;


function BinPage() {
    const [invoices, setInvoices] = useState([]);
    const [invoice, setInvoice] = useState(undefined);
    const [messageApi, contextHolder] = message.useMessage();

    // network
    const destoryInvoice = (no) => {
        Axios({
            method: 'delete',
            baseURL: baseURL(),
            url: 'invoice',
            data: { no: no, oper: 'destroy' },
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
    const destoryAllInvoices = () => {
        Axios({
            method: 'delete',
            baseURL: baseURL(),
            url: 'invoice',
            data: { oper: 'destroy' },
            'Content-Type': 'application/json',
        }).then(res => {
            if (res.status == 200) {
                setInvoices([]);
                messageApi.open({ type: 'success', content: '删除成功', });
            } else {
                messageApi.open({ type: 'error', content: '删除失败', });
            }
        }).catch(_ => {
            messageApi.open({ type: 'error', content: '删除失败', });
        });
    };
    const recoverInvoice = (no) => {
        Axios({
            method: 'put',
            baseURL: baseURL(),
            url: '/invoice/recover',
            data: { no: no },
            'Content-Type': 'application/json',
        }).then(res => {
            if (res.status == 200) {
                const newInvoices = invoices.filter(invoice => invoice.no !== no);
                setInvoices(newInvoices);
                messageApi.open({ type: 'success', content: '恢复成功', });
            } else {
                messageApi.open({ type: 'error', content: '恢复失败', });
            }
        }).catch(_ => {
            messageApi.open({ type: 'error', content: '恢复失败', });
        });
    };
    const loadInvoice = (no) => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: 'invoice/deleted',
            params: { no: no },
            'Content-Type': 'application/json',
        }).then(res => {
            if (res.status !== 200 || res.data.length === 0) {
                setInvoice(undefined);
            } else {
                const newInvoice = res.data[0];
                newInvoice.date = dayjs(newInvoice.date);
                newInvoice.items = newInvoice.items.map(item => 
                    Object.assign(item, { amount: calItemAmount(item) })
                );
                setInvoice(newInvoice);
            }
        }).catch(_ => {
            setInvoice(undefined);
        });
    };
    const loadInvoices = () => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: 'invoice/overview',
            params: { deleted: true },
            'Content-Type': 'application/json',
        }).then(res => {
            const formatInvoices = res.data.map((invoice, idx) => {
                const newInvoice = Object.assign(invoice, { key: idx });
                newInvoice.create_date = dayjs(invoice.create_date).format(dateFormat);
                newInvoice.delete_date = dayjs(invoice.delete_date).format(dateFormat);
                return newInvoice;
            });
            setInvoices(formatInvoices);
        }).catch(err => {
            // setLoadAlert(true);
            // setErrInfo({ code: err.code.toString(), message: err.message });
        });
    };

    // button listener
    const onClickDestroy = (no) => {
        return () => confirm({
            title: `是否永久删除清单${no}？`,
            icon: <ExclamationCircleOutlined />,
            content: <p>删除之后无法撤销</p>,
            okType: 'danger',
            onOk() { destoryInvoice(no) },
            onCancel() { }
        });
    };
    const onClickDestroyAll = () => {
        return () => confirm({
            title: `是否永久删除全部清单？`,
            icon: <ExclamationCircleOutlined />,
            content: <p>删除之后无法撤销</p>,
            okType: 'danger',
            onOk() { destoryAllInvoices() },
            onCancel() { }
        });
    };
    const onClickView = (no) => {
        return () => {
            loadInvoice(no);
        }
    };
    const onClickRecover = (no) => {
        return () => confirm({
            title: `是否恢复清单${no}？`,
            icon: <ExclamationCircleOutlined />,
            content: <p>恢复后可在“发货清单”页面查看与编辑</p>,
            onOk() { recoverInvoice(no) },
            onCancel() { }
        });
    };
    const onClickClose = () => {
        setInvoice(undefined);
    };

    // first time
    useEffect(() => {
        loadInvoices();
    }, [])

    return (<>
        {contextHolder}
        <Modal
            open={invoice !== undefined}
            width={900}
            onCancel={onClickClose}
            footer={<Button onClick={onClickClose}>关闭</Button>}
        >
            <h2 style={{ color: 'red', fontWeight: 'bold' }}>恢复以后才可以编辑与打印！</h2>
            <Invoice mode='view' invoice={invoice} editInvoice={invoice} />
        </Modal>
        
        <Space>
            <h2>回收站</h2>
            <div style={{marginLeft: '20px'}}>
                <Button onClick={onClickDestroyAll()} danger>删除全部</Button>
            </div>
        </Space>

        <Table dataSource={invoices} size='small' bordered 
        pagination={{ defaultPageSize: 20, showSizeChanger: true, pageSizeOptions: [20, 50, 100], showQuickJumper: true }}>
            <Column title='单号' dataIndex='no' align='center' sorter={(a, b) => a.no > b.no ? 1 : -1} />
            <Column title='收货单位' dataIndex='customer' align='center' sorter={(a, b) => a.customer > b.customer ? 1 : (a.customer === b.customer ? 0 : -1)} />
            <Column title='总金额' dataIndex='amount' align='center' sorter={(a, b) => a.amount - b.amount} render={amount => `¥ ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
            <Column title='开单日期' dataIndex='create_date' align='center' sorter={(a, b) => a.create_date > b.create_date ? 1 : (a.create_date === b.create_date ? 0 : -1)} />
            <Column title='删除日期' dataIndex='delete_date' align='center' sorter={(a, b) => a.delete_date > b.delete_date ? 1 : (a.delete_date === b.delete_date ? 0 : -1)} />
            <Column title='操作' dataIndex='oper' align='center' render={(_, invoice) => (
                <Space>
                    <Button onClick={onClickView(invoice.no)}>查看</Button>
                    <Button onClick={onClickRecover(invoice.no)} type='primary' ghost>恢复</Button>
                    <Button onClick={onClickDestroy(invoice.no)} danger>删除</Button>
                </Space>
            )} />
        </Table>
    </>);
}


export default BinPage;