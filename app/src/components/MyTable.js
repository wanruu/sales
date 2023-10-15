import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Modal, InputNumber, AutoComplete } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';
import Axios from 'axios';


import './invoice.css';
import digitUppercase from '../utils/digitUppercase.js';
import PriceHistory from './PriceHistory.js';
import { baseURL } from '../config.js';



const calAmount = (items) => {
    return items.map(item => item.amount === -1 ? 0 : item.amount).reduce((a, b) => a + b, 0);
};


export function ViewTable(props) {
    return (
        <table style={{ width: "100%", height: '100%', }} className='plainTable' >
            <thead>
                <tr>
                    <th className='plainTh' style={{ width: '04.0%', }}>序号</th>
                    <th className='plainTh' style={{ width: '05.0%', }}>材质</th>
                    <th className='plainTh' style={{ width: '10.0%', }}>品名</th>
                    <th className='plainTh' style={{ width: '10.0%', }}>规格</th>
                    <th className='plainTh' style={{ width: '08.0%', }}>数量</th>
                    <th className='plainTh' style={{ width: '08.0%', }}>单价</th>
                    <th className='plainTh' style={{ width: '11.0%', }}>金额</th>
                    <th className='plainTh' style={{ width: '15.0%', }}>备注</th>
                </tr>
            </thead>
            <tbody>
                {
                    props.items.map((item, itemIdx) =>
                        <tr key={itemIdx}>
                            <td className='plainTd'>{itemIdx+1}</td>
                            <td className='plainTd'>{item.material}</td>
                            <td className='plainTd'>{item.name}</td>
                            <td className='plainTd'>{item.spec}</td>
                            <td className='plainTd'>{item.quantity}</td>
                            <td className='plainTd'>¥ {item.unitPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                            <td className='plainTd'>¥ {item.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                            <td className='plainTd'>{item.remark}</td>
                        </tr>
                    )
                }
                <tr>
                    <td className='plainTd' style={{ paddingTop: '2px', paddingBottom: '2px' }}>合计</td>
                    <td className='plainTd' style={{ textAlign: 'left', paddingTop: '2px', paddingBottom: '2px' }} colSpan={5}>{digitUppercase(calAmount(props.items))}</td>
                    <td className='plainTd' style={{ textAlign: 'left', paddingTop: '2px', paddingBottom: '2px' }} colSpan={2}>¥ {calAmount(props.items).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                </tr>
            </tbody>
        </table>
    )
}


export function EditTable(props) {
    const [pNameOptions, setPNameOptions] = useState([]);
    const [pSpecOptions, setPSpecOptions] = useState([]);
    const [pMaterialOptions, setPMaterialOptions] = useState([]);


    // const inputRef = useRef([]);
    // useEffect(() => {
    //     inputRef.current = inputRef.current.slice(0, props.items.length * 6);
    // }, [props.items]);


    const searchProductNames = (keyword, n) => {
        if (keyword === '') {
            setPNameOptions([]);
            return;
        }
        
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: `prompt/productName`,
            params: { name: keyword, maxLen: n },
            'Content-Type': 'application/json',
        }).then(res => {
            setPNameOptions(res.data.map(name => ({ value: name })));
        }).catch(_ => { });
    }
    const searchProductSpecs = (keyword, n) => {
        if (keyword === '') {
            setPSpecOptions([]);
            return;
        }
        
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: `prompt/productSpec`,
            params: { spec: keyword, maxLen: n },
            'Content-Type': 'application/json',
        }).then(res => {
            setPSpecOptions(res.data.map(name => ({ value: name })));
        }).catch(_ => { });
    }
    const searchMaterials = (name, n) => {
        if (name === '') {
            setPMaterialOptions([]);
            return;
        }
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: `prompt/productMaterial`,
            params: { keyword: name, maxLen: n },
            'Content-Type': 'application/json',
        }).then(res => {
            setPMaterialOptions(res.data.map(name => ({ value: name })));
        }).catch(_ => { });
    };


    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState(undefined);

    const onClickHistory = (rowIdx) => {
        return () => {
            if (props.customer === '' || props.items[rowIdx].name === '' || props.items[rowIdx].spec === '') {
                // TODO
            } else {
                Axios({
                    method: 'get',
                    baseURL: baseURL(),
                    url: 'stat/price',
                    params: { 
                        customer: props.customer, 
                        productName: props.items[rowIdx].name, 
                        productSpec: props.items[rowIdx].spec, 
                        material: props.items[rowIdx].material
                    },
                    'Content-Type': 'application/json',
                }).then(res => {
                    setHistory(res.data);
                    setShowHistory(true);
                }).catch(err => {
                    // TODO
                });
            }
        }
    };

    // const onKeyUp = (rowIdx, colIdx, e) => {
    //     if (e.code === 'ArrowDown') {
    //         if (rowIdx < props.items.length - 1) {
    //             inputRef.current[(rowIdx+1)*6+colIdx].focus();
    //         }
    //     } else if (e.code === 'ArrowUp') {
    //         if (rowIdx > 0) {
    //             inputRef.current[(rowIdx-1)*6+colIdx].focus();
    //         }
    //     } 
    //     else if (e.code === 'ArrowRight') {
    //         if (rowIdx * 6 + colIdx < props.items.length * 6 - 1) {
    //             inputRef.current[rowIdx*6+colIdx+1].focus();
    //         }
    //     } else if (e.code === 'ArrowLeft') {
    //         if (rowIdx * 6 + colIdx > 0) {
    //             inputRef.current[rowIdx*6+colIdx-1].focus();
    //         }
    //     }
    // }


    return (
        <table style={{ width: "100%", height: '100%', }} className='plainTable' >
            <Modal
                title="历史单价"
                open={showHistory}
                onCancel={() => setShowHistory(false)}
                footer={<Button type='primary' onClick={() => setShowHistory(false)}>关闭</Button>}
                width={'80vh'}
            >
                <PriceHistory data={history} />
            </Modal>
            <thead>
                <tr>
                    <th className='plainTh' style={{ width: '04.0%', }}>序号</th>
                    <th className='plainTh' style={{ width: '08.0%', }}>材质</th>
                    <th className='plainTh' style={{ width: '12.0%', }}>品名</th>
                    <th className='plainTh' style={{ width: '09.0%', }}>规格</th>
                    <th className='plainTh' style={{ width: '08.0%', }}>数量</th>
                    <th className='plainTh' style={{ width: '10.0%', }}>单价</th>
                    <th className='plainTh' style={{ width: '11.0%', }}>金额</th>
                    <th className='plainTh' style={{ width: '13.0%', }}>备注</th>
                </tr>
            </thead>
            <tbody>
                {
                    props.items.map((item, itemIdx) =>
                        <tr key={itemIdx}>
                            <td className='plainTd'>{itemIdx+1}</td>
                            {/* material */}
                            <td className='plainTd'>
                                <AutoComplete
                                    className='flexCenter'
                                    style={{ width: '100%', height: '100%' }}
                                    options={pMaterialOptions}
                                    onChange={data => props.onItemsChange(itemIdx, 'material', data)}
                                    size='small'
                                    allowClear
                                    value={item.material}
                                    onSearch={text => searchMaterials(text, 10)}
                                    // ref={el => inputRef.current[itemIdx*6] = el}
                                    // onKeyUp={e => onKeyUp(itemIdx, 0, e)}
                                />
                            </td>
                            {/* name */}
                            <td className='plainTd'>
                                <AutoComplete
                                    className='flexCenter'
                                    style={{ width: '100%', height: '100%' }}
                                    options={pNameOptions}
                                    onChange={value => props.onItemsChange(itemIdx, 'name', value)}
                                    size='small'
                                    allowClear
                                    value={item.name}
                                    onSearch={text => searchProductNames(text, 10)}
                                />
                            </td>
                            {/* spec */}
                            <td className='plainTd'>
                                <AutoComplete
                                    className='flexCenter'
                                    style={{ width: '100%', height: '100%' }}
                                    options={pSpecOptions}
                                    onChange={value => props.onItemsChange(itemIdx, 'spec', value)}
                                    size='small'
                                    allowClear
                                    value={item.spec}
                                    onSearch={text => searchProductSpecs(text, 10)}
                                />
                            </td>
                            {/* quantity */}
                            <td className='plainTd'>
                                <InputNumber
                                    className='flexCenter'
                                    onChange={value => {
                                        value == null ? props.onItemsChange(itemIdx, 'quantity', 0) :
                                            props.onItemsChange(itemIdx, 'quantity', value)
                                    }}
                                    keyboard={false}
                                    controls={false}
                                    size='small'
                                    style={{ width: '100%', }}
                                    value={item.quantity === 0 ? '' : item.quantity}
                                />
                            </td>
                            
                            {/* unitPrice */}
                            <td className='plainTd'>
                                <div style={{ display: 'flex', height: '100%' }} className='flexCenter'>
                                    <InputNumber
                                        className='flexCenter'
                                        onChange={value => {
                                            value == null ? props.onItemsChange(itemIdx, 'unitPrice', 0) :
                                                props.onItemsChange(itemIdx, 'unitPrice', value)
                                        }}
                                        keyboard={false}
                                        controls={false}
                                        size='small'
                                        style={{ width: '100%', }}
                                        value={item.unitPrice === 0 ? '' : item.unitPrice}
                                    />
                                    <span style={{ width: '2px' }}></span>
                                    <span
                                        onClick={onClickHistory(itemIdx)}
                                        className={item.material === '' || item.name === '' || item.spec === '' || props.customer === '' ? 'spanButton disabled' : 'spanButton'}
                                    >
                                        <BarChartOutlined size='small' style={{ paddingLeft: '1px', paddingRight: '1px' }} />
                                    </span>
                                </div>
                            </td>
                            {/* amount */}
                            <td className='plainTd'>
                                {
                                    item.amount === -1 ? '' : '¥ ' + item.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })
                                }
                            </td>
                            {/* remark */}
                            <td className='plainTd'>
                                <div style={{ display: 'flex', height: '100%' }} className='flexCenter'>
                                    <Input
                                        onChange={e => props.onItemsChange(itemIdx, 'remark', e.target.value)}
                                        className='compactInput flexCenter'
                                        value={item.remark}
                                    />
                                </div>
                            </td>
                        </tr>
                    )
                }
                <tr>
                    <td className='plainTd' style={{ paddingTop: '2px', paddingBottom: '2px' }}>合计</td>
                    <td className='plainTd' style={{ textAlign: 'left', paddingTop: '2px', paddingBottom: '2px' }} colSpan={5}>{digitUppercase(calAmount(props.items))}</td>
                    <td className='plainTd' style={{ textAlign: 'left', paddingTop: '2px', paddingBottom: '2px' }} colSpan={2}>¥ {calAmount(props.items).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                </tr>
            </tbody>
        </table>
    )
}