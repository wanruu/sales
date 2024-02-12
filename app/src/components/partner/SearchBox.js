import React, { useEffect, useRef, useState } from 'react'
import { Form, Select, Space, Input, Button, Tooltip, Row, Tag, Divider } from 'antd'
import { ExclamationCircleOutlined, SwapOutlined } from '@ant-design/icons'
import { pinyin } from 'pinyin-pro'
import { useSelector, useDispatch } from 'react-redux'


const { Item } = Form


/*
    Required: data, setFilteredData
*/
export default function PartnerSearchBox(props) {
    const mode = useSelector(state => state.page.partner.searchMode || 'simple')
    const showing = useSelector(state => state.page.partner.showSearchBox)
    const dispatch = useDispatch()

    // Animation
    const nodeRef = useRef(null)
    const [height, setHeight] = useState(0)
    const [animate, setAnimate] = useState(false)
    useEffect(() => {
        if (nodeRef.current) {
            setHeight(nodeRef.current.offsetHeight)
        }
    }, [mode, showing])
    useEffect(() => {
        setAnimate(true)  // 在组件挂载后，启用动画效果
    }, [])


    const modeDict = {
        'simple': {
            title: <>智能搜索<Tooltip title='支持姓名、文件位置、电话、地址、身份，以空格分开。'>
                <ExclamationCircleOutlined style={{ color: 'gray', marginLeft: '3px' }} />
            </Tooltip></>,
            content: <div style={{ display: showing ? 'block' : 'none' }}><SimpleSearchBar {...props} /></div>
        },
        'complex': {
            title: '高级搜索',
            content: <div style={{ display: showing ? 'block' : 'none' }}><ComplexSearchBox {...props} /></div>
        }
    }

    const changeMode = () => {
        dispatch({ type: 'page/setSearchMode', menuKey: 'partner', searchMode: mode === 'simple' ? 'complex' : 'simple' })
    }

    return (
        <div style={{ transition: animate ? 'height 0.2s ease-in-out' : '', height: animate ? height : 'auto', overflowY: 'hidden' }}>
            <div ref={nodeRef}>
                {
                    showing ? <div style={{ paddingTop: '10px' }}>
                        <Divider style={{ margin: 0, padding: '5px 0' }} />
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
                    </div> : null
                }
                {modeDict[mode]?.content}
            </div>
        </div>
    )
}



/*
    Required: data, setFilteredData
*/
function SimpleSearchBar(props) {
    const keywords = useSelector(state => state.page.partner.keywords || '')
    const dispatch = useDispatch()

    const filterData = () => {
        const keywordArray = keywords.replace(/\s+/g, ' ').split(' ').filter(k => k !== '')


        const filteredData = (props.data || []).filter(record => {
            var textToVerify = []
            if (record.orderId != null) {
                textToVerify = [...textToVerify, '客户', 'kh', 'kehu']
            }
            if (record.purchaseId != null) {
                textToVerify = [...textToVerify, '供应商', 'gys', 'gongyingshang']
            }
            for (const key of ['name', 'folder', 'phone', 'address']) {
                const value = record[key]
                if (value != null && value !== '') {
                    textToVerify = [
                        ...textToVerify, value,
                        pinyin(value, { pattern: 'first', toneType: 'none', type: 'array' }).join(''),
                        pinyin(value, { toneType: 'none', type: 'array' }).join(''),
                    ]
                }
            }
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

    const handleInputChange = (event) => {
        dispatch({ type: 'page/updateKeywords', menuKey: 'partner', payload: event.target.value })
    }

    useEffect(filterData, [props.data])

    return (
        <Space.Compact style={{ width: '100%' }}>
            <Input placeholder='输入关键词' allowClear value={keywords}
                onKeyDown={handleInputKeyDown} onChange={handleInputChange} />
            <Button onClick={filterData} type='primary'>搜索</Button>
        </Space.Compact>
    )
}


/*
    Required: data, setFilteredData
*/
function ComplexSearchBox(props) {
    const [form] = Form.useForm()

    const searchForm = useSelector(state => state.page.partner.searchForm || {})
    const dispatch = useDispatch()

    // Form control
    const initForm = () => {
        form.resetFields()
        form.setFieldsValue(searchForm)
        filterData()
    }
    const resetForm = () => {
        form.resetFields()
        props.setFilteredData(props.data || [])
    }
    const filterData = () => {
        const conds = form.getFieldsValue()
        const targetFolder = (conds.folder || '').replace(' ', '')
        const targetName = (conds.name || '').replace(' ', '')
        const targetAddress = (conds.address || '').replace(' ', '')
        const targetPhone = (conds.phone || '').replace(' ', '')

        const checkArrayEquality = (arr1, arr2) => {
            if (arr1.length !== arr2.length) {
                return false; // 如果数组长度不同，直接返回 false
            }

            for (let i = 0; i < arr1.length; i++) {
                if (arr1[i] !== arr2[i]) {
                    return false; // 如果找到不同的元素，返回 false
                }
            }

            return true; // 数组完全相同，返回 true
        }

        const filteredData = (props.data || []).filter(record => {
            const folder = (record.folder || '').replace(' ', '')
            const name = (record.name || '').replace(' ', '')
            const address = (record.address || '').replace(' ', '')
            const phone = (record.phone || '').replace(' ', '')
            const identity = [record.orderId == null ? null : '客户', record.purchaseId == null ? null : '供应商'].filter(x => x != null)

            return (
                folder.includes(targetFolder) ||
                pinyin(folder, { pattern: 'first', toneType: 'none', type: 'array' }).join('').includes(targetFolder) ||
                pinyin(folder, { toneType: 'none', type: 'array' }).join('').includes(targetFolder)
            ) &&
                (
                    name.includes(targetName) ||
                    pinyin(name, { pattern: 'first', toneType: 'none', type: 'array' }).join('').includes(targetName) ||
                    pinyin(name, { toneType: 'none', type: 'array' }).join('').includes(targetName)
                ) &&
                (
                    address.includes(targetAddress) ||
                    pinyin(address, { pattern: 'first', toneType: 'none', type: 'array' }).join('').includes(targetAddress) ||
                    pinyin(address, { toneType: 'none', type: 'array' }).join('').includes(targetAddress)
                ) &&
                (
                    phone.includes(targetPhone) ||
                    pinyin(phone, { pattern: 'first', toneType: 'none', type: 'array' }).join('').includes(targetPhone) ||
                    pinyin(phone, { toneType: 'none', type: 'array' }).join('').includes(targetPhone)
                )
                &&
                (
                    !conds.identity || conds.identity.length === 0 || checkArrayEquality(conds.identity, identity)
                )
        })
        props.setFilteredData(filteredData)
    }
    const handleFormValuesChange = (values) => {
        dispatch({ type: 'page/updateSearchForm', menuKey: 'partner', payload: values })
    }
    const handleFormReset = () => {
        dispatch({ type: 'page/resetSearchForm', menuKey: 'partner' })
    }
    useEffect(initForm, [props.data])

    // Render
    const itemStyle = { style: { margin: '8px 0px' } }
    const identityOptions = [
        { label: '客户', value: '客户', color: 'blue' },
        { label: '供应商', value: '供应商', color: 'gold' }
    ]

    const identityTagRender = (props) => {
        const { label, value, closable, onClose } = props
        const onPreventMouseDown = (event) => {
            event.preventDefault()
            event.stopPropagation()
        }
        return <Tag color={identityOptions.filter(o => o.value === value)?.[0]?.color || 'red'}
            onMouseDown={onPreventMouseDown}
            closable={closable} onClose={onClose}
            style={{ marginRight: 3 }}
        >{label}</Tag>
    }

    return (
        <Form form={form} onFinish={filterData} onReset={resetForm}
            onValuesChange={handleFormValuesChange} onResetCapture={handleFormReset}
            labelCol={{ span: 4 }} wrapperCol={{ span: 20 }}>
            <Item label='姓名' name='name' {...itemStyle}>
                <Input placeholder='姓名' allowClear />
            </Item>
            <Item label='文件位置' name='folder' {...itemStyle}>
                <Input placeholder='文件位置' allowClear />
            </Item>
            <Item label='电话' name='phone' {...itemStyle}>
                <Input placeholder='电话' allowClear />
            </Item>
            <Item label='地址' name='address' {...itemStyle}>
                <Input placeholder='地址' allowClear />
            </Item>
            <Item label='身份' name='identity' {...itemStyle}>
                <Select placeholder='选择身份' allowClear mode='multiple'
                    options={identityOptions} tagRender={identityTagRender}
                />
            </Item>
            <Item label=' ' colon={false} style={{ marginTop: 0, marginBottom: 0 }} >
                <Space direction='horizontal'>
                    <Button htmlType='reset'>清空</Button>
                    <Button htmlType='submit' type='primary'>搜索</Button>
                </Space>
            </Item>
        </Form>
    )
}