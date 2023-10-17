import { Button, Tabs, Space, message, Upload, Tooltip  } from "antd";
import { useState, useRef, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import * as XLSX from 'xlsx';
import React from 'react';
import dayjs from "dayjs";
import Axios from 'axios';

import Invoice from '../components/Invoice.js';
import { baseURL, dcInvoice, calItemAmount, emptyItem, emptyInvoice, isItemEmpty, invoiceSettings } from '../config.js';


function NewInvoice(props) {
    const [activeTabKey, setActiveTabKey] = useState('instruction');
    const [messageApi, contextHolder] = message.useMessage();

    // initial showed intems
    const instruction = (<div>
        <h2>注意</h2>
        <p>1. 表格内每行必须填写完整并且符合规范，备注可以为空，否则无法保存。</p>
        <p>2. 只有在填写“收货单位”、“材质”、“品名”和“规格”后，才可以点击“单价”栏的按钮，查看该客户该产品的历史成交价格。
            如果历史价格页面为空，则说明无数据。</p>
    </div>);

    const [tabItems, setTabItems] = useState([{ label: '开单说明', children: '', key: 'instruction', closable: false }]);
    const newTabIndex = useRef(0);
    const [invoicesDict, setInvoicesDict] = useState({});  // {key: data}
    const [editInvoicesDict, setEditInvoicesDict] = useState({});  // {key: data}
    const [modesDict, setModeDict] = useState({});

    // tab
    const onEditTab = (targetTabKey, action) => {
        if (action === 'add') {
            // 1. new key 
            const newIdx = ++newTabIndex.current;
            const newKey = `newInvoice${newIdx}`;
            // 2. set new tab items
            const newTabItems = [...tabItems];
            newTabItems.push({ label: `新发货单 ${newIdx}`, children: '', key: newKey, });
            setTabItems(newTabItems);
            // 3. set new invoice data (old & edited)
            const newInvoicesDict = {};
            const newEditInvoicesDict = {};
            for (const key in invoicesDict) { // copy
                newInvoicesDict[key] = dcInvoice(invoicesDict[key]);
                newEditInvoicesDict[key] = dcInvoice(editInvoicesDict[key]);
            }
            newInvoicesDict[newKey] = emptyInvoice();
            newEditInvoicesDict[newKey] = emptyInvoice();
            setInvoicesDict(newInvoicesDict);
            setEditInvoicesDict(newEditInvoicesDict);
            // 4. set new mode
            const newModesDict = {};
            for (const key in modesDict) {  // copy
                newModesDict[key] = modesDict[key];
            }
            newModesDict[newKey] = 'edit';
            setModeDict(newModesDict);
            // 5. set new active tab key
            setActiveTabKey(newKey);
        } else {
            // 1. find lastIndex of tab before targetTabKey
            let lastIndex = -1;
            tabItems.forEach((item, i) => {
                if (item.key === targetTabKey) {
                    lastIndex = i - 1;
                }
            });
            // 2. calculate new activeTabKey & tabItems
            let newActiveTabKey = activeTabKey;
            const newTabItems = tabItems.filter(item => item.key !== targetTabKey);
            if (newTabItems.length && newActiveTabKey === targetTabKey) {
                if (lastIndex >= 0) {
                    newActiveTabKey = newTabItems[lastIndex].key;
                } else {
                    newActiveTabKey = newTabItems[0].key;
                }
            }
            setTabItems(newTabItems);
            setActiveTabKey(newActiveTabKey);
            // 3. set new invoices dict & modes dict
            const newInvoicesDict = {};
            const newEditInvoicesDict = {};
            const newModesDict = {};
            for (const key in invoicesDict) {  // remove targetTabKey
                if (key != targetTabKey) {
                    newInvoicesDict[key] = dcInvoice(invoicesDict[key]);
                    newEditInvoicesDict[key] = dcInvoice(editInvoicesDict[key]);
                    newModesDict[key] = modesDict[key];
                }
            }
            setInvoicesDict(newInvoicesDict);
            setEditInvoicesDict(newEditInvoicesDict);
            setModeDict(newModesDict);
        }
    };

    // for print
    const componentRef = useRef(null);
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
    });


    // for updating data
    const onDataChange = (type, key) => {
        if (type === 'customer' || type === 'date') {
            return (data) => {
                const newEditInvoicesDict = {};
                for (const _key in editInvoicesDict) {
                    if (_key !== key) {  // copy
                        newEditInvoicesDict[_key] = editInvoicesDict[_key];
                    } else {
                        const newEditInvoice = dcInvoice(editInvoicesDict[_key]);
                        if (type === 'customer') {
                            newEditInvoice.customer = data;
                        } else {
                            newEditInvoice.date = data;
                        }
                        newEditInvoicesDict[_key] = newEditInvoice;
                    }
                }
                setEditInvoicesDict(newEditInvoicesDict);
            }
        } else if (type === 'items') {
            return (index, field, data) => {
                const newEditInvoicesDict = {};
                for (const _key in editInvoicesDict) {
                    if (_key !== key) {  // just copy
                        newEditInvoicesDict[_key] = editInvoicesDict[_key];
                    } else {  // update items[index][field]
                        const newEditInvoice = dcInvoice(editInvoicesDict[_key]);
                        const newItems = JSON.parse(JSON.stringify(newEditInvoice.items));
                        newItems[index][field] = data;
                        if (field === 'quantity' || field === 'unitPrice') {
                            newItems[index].amount = calItemAmount(newItems[index]);
                        }
                        newEditInvoice.items = newItems;
                        newEditInvoicesDict[_key] = newEditInvoice;
                    }
                }
                setEditInvoicesDict(newEditInvoicesDict);
            }
        }
    };

    const onModeChange = (key) => {
        return () => {
            const newModesDict = JSON.parse(JSON.stringify(modesDict));
            if (newModesDict[key] === 'edit') {
                uploadInvoice(key);
            } else {
                newModesDict[key] = 'edit';
            }
            setModeDict(newModesDict);
        }
    };

    // network
    const uploadInvoice = (key) => {
        // clean data
        const newInvoice = dcInvoice(editInvoicesDict[key]);
        newInvoice.date = newInvoice.date.format('YYYY-MM-DD');
        newInvoice.items = newInvoice.items.filter(item => !isItemEmpty(item));
        const nIncomplete = newInvoice.items.filter(item => {
            return item.material === '' || item.name === '' || item.spec === '' || item.quantity === 0 || item.unitPrice === 0
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
                if (res.status === 200) {  // success
                    const newInvoicesDict = {};
                    const newEditInvoicesDict = {};
                    const newModesDict = {}
                    for (const _key in invoicesDict) {
                        if (key !== _key) {  // just copy
                            newInvoicesDict[_key] = invoicesDict[_key];
                            newEditInvoicesDict[_key] = editInvoicesDict[_key];
                            newModesDict[_key] = modesDict[_key];
                        } else {  // update newInvoice
                            newInvoice.date = dayjs(newInvoice.date);
                            if (res.data.no !== undefined) {
                                newInvoice.no = res.data.no;
                                // update label
                                const newTabItems = [...tabItems];
                                for (let index = 0; index < newTabItems.length; index++) {
                                    if (newTabItems[index].key === key) {
                                        newTabItems[index].label = res.data.no;
                                        break;
                                    }
                                }
                                setTabItems(newTabItems);
                            }
                            newInvoicesDict[_key] = newInvoice;
                            newEditInvoicesDict[_key] = dcInvoice(newInvoice);
                            while (newEditInvoicesDict[_key].items.length < parseInt(invoiceSettings.defaultEditRowNum())) {
                                newEditInvoicesDict[_key].items.push(emptyItem());
                            }
                            newModesDict[_key] = 'view';
                        }
                    }
                    setInvoicesDict(newInvoicesDict);
                    setEditInvoicesDict(newEditInvoicesDict);
                    setModeDict(newModesDict);
                    messageApi.open({ type: 'success', content: '保存成功', });
                } else {
                    messageApi.open({ type: 'error', content: '保存失败', });
                }
            }).catch(_ => {
                messageApi.open({ type: 'error', content: '保存失败', });
            });
        }
    };

    const loadInvoices = () => {
        // update saved invoices
        const nos = [];
        for (const key in invoicesDict) {
            if (invoicesDict[key].no !== undefined) {
                nos.push(invoicesDict[key].no);
            }
        }
        if (nos.length === 0) return;

        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: 'invoice',
            params: { nos: nos },
            'Content-Type': 'application/json',
        }).then(res => {
            if (res.status !== 200) {
                messageApi.open({ type: 'error', content: '更新失败', });
            } else {
                const newInvoicesDict = {};
                for (const key in invoicesDict) {
                    if (invoicesDict[key].no === undefined) {  // just copy
                        newInvoicesDict[key] = invoicesDict[key];
                    } else {  // update
                        res.data.forEach(invoice => {
                            if (invoice.no === invoicesDict[key].no) {  // update 
                                const newInvoice = dcInvoice(invoice);
                                for (let index = 0; index < newInvoice.items.length; index++) {
                                    newInvoice.items[index].amount = calItemAmount(newInvoice.items[index]);
                                }
                                newInvoicesDict[key] = newInvoice;
                                return;
                            }
                        });
                    }
                }
                const newTabItems = tabItems.filter(item => {
                    if (item.key === 'instruction') return true;
                    for (const key in newInvoicesDict) {
                        if (key === item.key) {
                            return true;
                        }
                    }
                    return false;
                });
                if (newInvoicesDict[activeTabKey] === undefined) {
                    var lastKey = 'instruction';
                    for (const key in newInvoicesDict) {
                        lastKey = key;
                    }
                    setActiveTabKey(lastKey);
                }
                setTabItems(newTabItems);
                setInvoicesDict(newInvoicesDict);
                messageApi.open({ type: 'success', content: '更新成功', });
            }
        }).catch(err => {
            messageApi.open({ type: 'error', content: '更新失败', });
        });
    };

    useEffect(() => {
        // refresh invoices
        loadInvoices();
    }, [props.state])


    // button
    const addProduct = (key) => {
        const newInvoicesDict = {};
        for (const _key in editInvoicesDict) {
            if (_key !== key) {  // just copy
                newInvoicesDict[_key] = editInvoicesDict[_key];
            } else {  // add a new item
                const newInvoice = dcInvoice(editInvoicesDict[_key]);
                newInvoice.items.push(emptyItem());
                newInvoicesDict[_key] = newInvoice;
            }
        }
        setEditInvoicesDict(newInvoicesDict);
    }

    const removeProduct = (key) => {
        const newInvoicesDict = {};
        for (const _key in editInvoicesDict) {
            if (_key !== key) {  // just copy
                newInvoicesDict[_key] = editInvoicesDict[_key];
            } else {  // remove an empty item
                const newInvoice = dcInvoice(editInvoicesDict[_key]);
                var lastIdx = -1;
                newInvoice.items.forEach((item, idx) => {
                    if (isItemEmpty(item)) lastIdx = idx;
                });
                if (lastIdx === -1) {
                    messageApi.open({ type: 'error', content: '无空产品可移除', });
                    return;
                }
                newInvoice.items = newInvoice.items.filter((_, idx) => idx !== lastIdx);
                newInvoicesDict[_key] = newInvoice;
            }
        }
        setEditInvoicesDict(newInvoicesDict);
    }

    // upload
    const handleUpload = (options) => {
        const { file } = options;

        const readFile = (file) => {
            const fileReader = new FileReader();
            fileReader.onload = (e) => {
                let workbook = XLSX.read(e.target.result, {type: 'binary'});
                var items = []
                Object.keys(workbook.Sheets).forEach(sheet => {
                    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);
                    rows.forEach(row => {
                        var item = {
                            material: row['材质'] === undefined ? '' : row['材质'],
                            name: row['品名'] === undefined ? '' : row['品名'],
                            spec: row['规格'] === undefined ? '' : row['规格'],
                            quantity: row['数量'] === undefined ? 0 : row['数量'],
                            unitPrice: row['单价'] === undefined ? 0 : row['单价'],
                            remark: row['备注'] === undefined ? '' : row['备注'],
                        };
                        item.amount = item.quantity * item.unitPrice;
                        items.push(item);
                    })
                });
                // update product
                const newInvoicesDict = {};
                for (const _key in editInvoicesDict) {
                    if (_key !== activeTabKey) {  // just copy
                        newInvoicesDict[_key] = editInvoicesDict[_key];
                    } else {  // add a new item
                        const newInvoice = dcInvoice(editInvoicesDict[_key]);
                        newInvoice.items = items;
                        while (newInvoice.items.length < parseInt(invoiceSettings.defaultEditRowNum())) {
                            newInvoice.items.push(emptyItem());
                        }
                        newInvoicesDict[_key] = newInvoice;
                    }
                }
                setEditInvoicesDict(newInvoicesDict);
            }
            fileReader.readAsBinaryString(file);
        }
        readFile(file);
    }

    return (
        <div>
            {contextHolder}
            <Tabs
                type="editable-card"
                onChange={(newKey) => setActiveTabKey(newKey)}
                activeKey={activeTabKey}
                onEdit={onEditTab}
                items={tabItems}
            />
            {activeTabKey === 'instruction' || invoicesDict[activeTabKey] === undefined || modesDict[activeTabKey] === undefined ? instruction :
                <div>
                    <Space direction="vertical" size="middle" style={{ display: 'flex', }}>
                        <Space>
                            <Button type='primary' onClick={onModeChange(activeTabKey)}>{modesDict[activeTabKey] === 'edit' ? '保存' : '编辑'}</Button>
                            {
                                modesDict[activeTabKey] === 'edit' ?
                                    <>
                                        <Button onClick={() => addProduct(activeTabKey)}>新增产品</Button>
                                        <Button onClick={() => removeProduct(activeTabKey)}>移除产品</Button>
                                        <Upload accept=".xlsx" fileList={[]} customRequest={handleUpload}>
                                            <Tooltip placement="right" title='将覆盖原有数据'>
                                                <Button>导入xlsx</Button>
                                            </Tooltip>
                                        </Upload>
                                    </>
                                    :
                                    <Button onClick={handlePrint}>打印</Button>
                            }
                        </Space>
                        <div ref={componentRef}>
                            <div>
                                <Invoice
                                    mode={modesDict[activeTabKey]}
                                    invoice={invoicesDict[activeTabKey]}
                                    editInvoice={editInvoicesDict[activeTabKey]}
                                    onCustomerChange={onDataChange('customer', activeTabKey)}
                                    onDateChange={onDataChange('date', activeTabKey)}
                                    onItemsChange={onDataChange('items', activeTabKey)}
                                />
                            </div>
                        </div>
                    </Space>
                </div>
            }
        </div>
    );
}

export default NewInvoice;
