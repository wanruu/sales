import React, { useState } from "react";
import { Input, Space, Button, Form, InputNumber, message } from "antd";
import  Axios  from "axios";
import Decimal from "decimal.js";

const { Item } = Form

import { baseURL, unitCoeffDict } from "../../utils/config";
import { UnitInput } from "../common/PromptInput";


function ProductEditView(props) {
    const [editProduct, setEditProduct] = useState(props.editProduct)
    const [messageApi, contextHolder] = message.useMessage();

    const updateEdit = (field, value) => {
        const p = JSON.parse(JSON.stringify(editProduct))
        p[field] = value
        setEditProduct(p)
    }

    const getStatus = (field) => {
        if (editProduct === undefined || props.product === undefined) {
            return ''
        }
        return props.product[field] === editProduct[field] ? '' : 'warning'
    }

    const dismiss = () => {
        if (props.dismiss !== undefined) {
            props.dismiss()
        }
        if (props.refresh !== undefined) {
            props.refresh()
        }
    }

    const upload = () => {
        const p = JSON.parse(JSON.stringify(editProduct))
        if (props.product !== undefined) {
            p.unitRatio = Decimal(unitCoeffDict[p.unit]).div(unitCoeffDict[props.product.unit]).toString()
        }
        p.quantity = p.quantity || '0'
        Axios({
            method: props.product !== undefined ? 'put' : 'post',
            baseURL: baseURL(),
            url: props.product !== undefined ? `/product/id/${p.id}` : '/product',
            data: p,
            'Content-Type': 'application/json',
        }).then(res => {
            if (res.data.changes === 1) {
                messageApi.open({ type: 'success', content: '保存成功', });
                dismiss()
            } else {
                messageApi.open({ type: 'error', content: `保存失败：${res.data.prompt}`, });
            }
        }).catch(err => {
            messageApi.open({ type: 'error', content: '保存失败', });
        })
    }

    return <Form>
        {contextHolder}
        <Item label='材质'>
            <Input value={editProduct === undefined ? '' : editProduct.material} 
                onChange={e => updateEdit('material', e.target.value)} status={getStatus('material')} />
        </Item>
        <Item label='名称'>
            <Input value={editProduct === undefined ? '' : editProduct.name} 
                onChange={e => updateEdit('name', e.target.value)} status={getStatus('name')} />
        </Item>
        <Item label='规格'>
            <Input value={editProduct === undefined ? '' : editProduct.spec} 
                onChange={e => updateEdit('spec', e.target.value)} status={getStatus('spec')} />
        </Item>
        <Item label='数量'>
            <Space>
                <InputNumber value={editProduct === undefined ? '' : editProduct.quantity} 
                    onChange={val => updateEdit('quantity', val)} stringMode status={getStatus('quantity')} />
                <UnitInput size='medium' style={{width: '80px'}} status={getStatus('unit')}
                    value={editProduct === undefined ? '' : editProduct.unit} onChange={val => updateEdit('unit', val)} />
            </Space>
        </Item>
        <Button type='primary' onClick={upload} 
            disabled={editProduct===undefined||editProduct.material===''||editProduct.name===''||editProduct.spec===''||editProduct.unit===''}>保存</Button>
    </Form>
}


export default ProductEditView