import Axios from 'axios'
import { AutoComplete, Select, } from "antd";
import React, { useEffect, useState,  } from "react";


import { baseURL, unitOptions } from "../../utils/config";
import './InvoiceEdit.css'

export function PartnerInput(props) {
    const [options, setOptions] = useState([])

    const load = (keyword) => {
        setOptions([])
        if (keyword === '') { return }
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: `prompt/partner/name/${keyword}`,
            'Content-Type': 'application/json',
        }).then(res => {
            if (res.status === 200) {
                setOptions(res.data.map(i => { return { label: i, value: i } }))
            }
        }).catch(err => {
            // console.error(err)
        })
    }

    return <AutoComplete size={props.size || 'small'} value={props.value} 
        status={props.status} options={options}
        style={props.style || {}} 
        onChange={props.onChange}
        onSearch={load}
    />
}


export function ProductInput(props) {
    const [options, setOptions] = useState([])

    const load = (keyword) => {
        setOptions([])
        if (keyword === '') { return }
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: `prompt/product/${props.field}/${keyword}`,
            'Content-Type': 'application/json',
        }).then(res => {
            if (res.status === 200) {
                setOptions(res.data.map(i => { return { label: i, value: i } }))
            }
        }).catch(err => {
            console.error(err)
        })
    }

    return <AutoComplete size={props.size || 'small'} value={props.value} 
        status={props.status || ''} options={options}
        style={props.style || {}} 
        onChange={props.onChange}
        onSearch={load}
        disabled={props.disabled || false}
    />
}


export function UnitInput(props) {
    const [unit, setUnit] = useState(undefined)

    const load = () => {
        setUnit(undefined)
        if (props.material === '' || props.name === '' || props.spec === '') { 
            return 
        }
        if (props.material === undefined || props.name === undefined || props.spec === undefined) { 
            return 
        }
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: `product/unit/${props.material}/${props.name}/${props.spec}`,
            'Content-Type': 'application/json',
        }).then(res => {
            if (res.status === 200) {
                const _unit = res.data.unit
                setUnit(_unit)
                if (_unit !== undefined) {
                    props.onChange(_unit)
                }
            }
        }).catch(err => {
            console.error(err)
        })
    }

    const getStatus = () => {
        if (props.status !== undefined) {
            return props.status
        }
        return unit !== undefined && unit != props.value ? 'warning' : ''
    }

    useEffect(() => {
        load()
    }, [props.material, props.name, props.spec])

    return <Select size={props.size || 'small'} options={unitOptions} id='unitInput' disabled={props.disabled || false}
        align={props.align || 'center'} style={props.style || {}} value={props.value} 
        onChange={props.onChange} status={getStatus()}
    />
}