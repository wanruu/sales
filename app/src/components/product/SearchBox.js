import React, { useEffect, useRef, useState } from 'react'
import { Form, Select, Space, Input, Button, Card, Tooltip, Row } from 'antd'
import { ExclamationCircleOutlined, SwapOutlined } from '@ant-design/icons'
import { pinyin } from 'pinyin-pro'


import { invoiceSettings } from '../../utils/config'


const { Item } = Form


/*
    Required: data, setFilteredData
    Optional: mode, keywords (TODO: 快捷搜索功能)
*/
export default function ProductSearchBox(props) {
    const [mode, setMode] = useState(props.mode || 'simple')

    // Animation
    const nodeRef = useRef(null)
    const [height, setHeight] = useState(0)
    const [animate, setAnimate] = useState(false)
    useEffect(() => {
        if (nodeRef.current) {
            setHeight(nodeRef.current.offsetHeight);
        }
    }, [mode])
    useEffect(() => {
        setAnimate(true)  // 在组件挂载后，启用动画效果
    }, [])


    const modeDict = {
        'simple': {
            title: <>智能搜索<Tooltip title='支持材质、名称、规格、单位，以空格分开。'>
                <ExclamationCircleOutlined style={{ color: 'gray', marginLeft: '3px' }} />
            </Tooltip></>,
            content: <SimpleSearchBar {...props} />
        },
        'complex': { title: '高级搜索', content: <ComplexSearchBox {...props} /> }
    }

    const changeMode = () => {
        props.setFilteredData(props.data || [])
        if (mode === 'simple') {
            setMode('complex')
        } else {
            setMode('simple')
        }
    }

    return (
        <div style={{ transition: animate ? 'height 0.2s ease-in-out' : '', height: animate ? height : 'auto' }}>
            <Card ref={nodeRef}>
                <Row style={{ justifyContent: 'space-between', marginBottom: '10px' }}>
                    <b style={{ fontSize: '12pt' }}>
                        {modeDict[mode]?.title}
                    </b>
                    <Button size='small' type='text' style={{ color: 'gray', fontSize: '10pt' }} onClick={changeMode}>
                        <Space size={1} direction='horizontal'>
                            <SwapOutlined />
                            <span>切换模式</span>
                        </Space>
                    </Button>
                </Row>
                {modeDict[mode]?.content}
            </Card>
        </div>
    )
}



/*
    Required: data, setFilteredData
    Optional: keywords (TODO: 快捷搜索功能)
*/
function SimpleSearchBar(props) {
    const [keywords, setKeywords] = useState(props.keywords || '')

    const filterData = () => {
        const keywordArray = keywords.replace(/\s+/g, ' ').split(' ').filter(k => k !== '')
        const filteredData = (props.data || []).filter(record => {
            const textToVerify = [
                record.material, record.name, record.spec, record.unit,
                pinyin(record.material, { pattern: 'first', toneType: 'none', type: 'array' }).join(''),
                pinyin(record.material, { toneType: 'none', type: 'array' }).join(''),
                pinyin(record.name, { pattern: 'first', toneType: 'none', type: 'array' }).join(''),
                pinyin(record.name, { toneType: 'none', type: 'array' }).join(''),
                pinyin(record.spec, { pattern: 'first', toneType: 'none', type: 'array' }).join(''),
                pinyin(record.spec, { toneType: 'none', type: 'array' }).join(''),
                pinyin(record.unit, { pattern: 'first', toneType: 'none', type: 'array' }).join(''),
                pinyin(record.unit, { toneType: 'none', type: 'array' }).join('')
            ]
            for (const keyword of keywordArray) {
                const results = textToVerify.map(text => (text || '').includes(keyword))
                if (results.filter(r => r).length === 0) {
                    return false
                }
            }
            return true
        })
        props.setFilteredData(filteredData)
    }

    const handleInputKeyDown = (event) => {
        if (event.key === 'Enter') {
            filterData()
        }
    }

    return (
        <Space.Compact style={{ width: '100%' }}>
            <Input placeholder='输入关键词' allowClear
                value={keywords}
                onKeyDown={handleInputKeyDown} onChange={e => setKeywords(e.target.value)} />
            <Button onClick={filterData} type='primary'>搜索</Button>
        </Space.Compact>
    )
}


/*
    Required: data, setFilteredData
    Optional: 
*/
function ComplexSearchBox(props) {
    const [form] = Form.useForm()

    const resetData = () => {
        form.resetFields()
        props.setFilteredData(props.data || [])
    }
    const filterData = () => {
        const conds = form.getFieldsValue()
        console.log(conds)
        const targetMaterial = (conds.material || '').replace(' ', '')
        const targetName = (conds.name || '').replace(' ', '')
        const targetSpec = (conds.spec || '').replace(' ', '')

        const filteredData = (props.data || []).filter(record => {
            const material = record.material.replace(' ', '')
            const name = record.name.replace(' ', '')
            const spec = record.spec.replace(' ', '')
            return (
                material.includes(targetMaterial) ||
                pinyin(material, { pattern: 'first', toneType: 'none', type: 'array' }).join('').includes(targetMaterial) ||
                pinyin(material, { toneType: 'none', type: 'array' }).join('').includes(targetMaterial)
            ) && (
                    name.includes(targetName) ||
                    pinyin(name, { pattern: 'first', toneType: 'none', type: 'array' }).join('').includes(targetName) ||
                    pinyin(name, { toneType: 'none', type: 'array' }).join('').includes(targetName)
                ) && (
                    spec.includes(targetSpec) ||
                    pinyin(spec, { pattern: 'first', toneType: 'none', type: 'array' }).join('').includes(targetSpec) ||
                    pinyin(spec, { toneType: 'none', type: 'array' }).join('').includes(targetSpec)
                ) &&
                (
                    !conds.unit || conds.unit.length === 0 || conds.unit.includes(record.unit)
                )
        })
        props.setFilteredData(filteredData)
    }

    const itemStyle = { style: { margin: '8px 0px' } }

    return (
        <Form form={form} onFinish={filterData} labelCol={{ span: 4 }} wrapperCol={{ span: 20 }}>
            {
                invoiceSettings.get('ifShowMaterial') === 'true' ?
                    <Item label='材质' name='material' {...itemStyle}>
                        <Input placeholder='材质' allowClear />
                    </Item> : null
            }
            <Item label='名称' name='name' {...itemStyle}>
                <Input placeholder='名称' allowClear />
            </Item>
            <Item label='规格' name='spec' {...itemStyle}>
                <Input placeholder='规格' allowClear />
            </Item>
            <Item label='单位' name='unit' {...itemStyle}>
                <Select placeholder='选择单位' allowClear mode='multiple'
                    options={JSON.parse(invoiceSettings.get('unitOptions')).filter(o => o.showing)}
                />
            </Item>
            <Item label=' ' colon={false} style={{ marginTop: 0, marginBottom: 0 }} >
                <Space direction='horizontal'>
                    <Button onClick={resetData}>清空</Button>
                    <Button htmlType='submit' type='primary'>搜索</Button>
                </Space>
            </Item>
        </Form>
    )
}