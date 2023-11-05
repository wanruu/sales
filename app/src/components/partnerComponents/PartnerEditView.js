import React, { useState } from 'react'
import { Button, message, Form, Input } from 'antd'
import Axios from 'axios'

const { Item } = Form

import { baseURL } from '../../utils/config'


function PartnerEditView(props) {
    const [editPartner, setEditPartner] = useState(props.editPartner)
    const [messageApi, contextHolder] = message.useMessage();

    const updateEditPartner = (field, value) => {
        const p = JSON.parse(JSON.stringify(editPartner))
        p[field] = value
        setEditPartner(p)
    }

    const getStatus = (field) => {
        if (editPartner === undefined || props.partner === undefined) {
            return ''
        }
        return props.partner[field] === editPartner[field] ? '' : 'warning'
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
        Axios({
            method: props.partner === undefined ? 'post' : 'put',
            baseURL: baseURL(),
            url: props.partner === undefined ? '/partner' : `/partner/name/${props.partner.name}`,
            data: editPartner,
            'Content-Type': 'application/json',
        }).then(res => {
            if (res.data.changes === 1) {
                messageApi.open({ type: 'success', content: '保存成功', });
                dismiss()
            } else {
                messageApi.open({ type: 'error', content: `保存失败: ${res.data.prompt}`, });
            }
        }).catch(err => {
            messageApi.open({ type: 'error', content: '保存失败', });
        });
    }


    return <Form>
        {contextHolder}
        <Item label='姓名'>
            <Input onChange={e => updateEditPartner('name', e.target.value)} 
                value={editPartner === undefined ? '' : editPartner.name} status={getStatus('name')} />
        </Item>
        <Item label='电话'>
            <Input onChange={e => updateEditPartner('phone', e.target.value)} 
                value={editPartner === undefined ? '' : editPartner.phone} status={getStatus('phone')} />
        </Item>
        <Item label='地址'>
            <Input onChange={e => updateEditPartner('address', e.target.value)} 
                value={editPartner === undefined ? '' : editPartner.address} status={getStatus('address')} />
        </Item>
        <Button type='primary' onClick={upload} 
            disabled={editPartner===undefined||editPartner.name===''}>保存</Button>
    </Form>
}


export default PartnerEditView