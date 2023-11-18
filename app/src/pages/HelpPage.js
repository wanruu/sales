import React, { useState } from 'react'
import { Card, Button } from 'antd'
import { EditOutlined, DeleteOutlined, QuestionCircleOutlined, DownOutlined, UpOutlined,
    LineChartOutlined, ClearOutlined
} from '@ant-design/icons'


import './HelpPage.css'

export default function HelpPage() {
    const [collapseDict, setCollapseDict] = useState({})

    const getCollapse = (key) => {
        return collapseDict[key] === undefined ? true : collapseDict[key]
    }

    const revertCollapse = (key) => {
        const newDict = JSON.parse(JSON.stringify(collapseDict))
        newDict[key] = newDict[key] === undefined ? false : !newDict[key]
        setCollapseDict(newDict)
    }

    const getCollapseButton = (key) => {
        const text = getCollapse(key) ? '展开' : '收起'
        const icon = getCollapse(key) ? <DownOutlined /> : <UpOutlined />
        return <Button type='link' style={{ fontSize: '13px' }} onClick={_ => revertCollapse(key)} size='small'>{icon}{text}</Button>
    }

    const getCardTitle = (title, key) => {
        return <a style={{ color: 'black' }} onClick={_ => revertCollapse(key)}><QuestionCircleOutlined style={{ color: 'gray', marginRight: '10px' }}/>{title}</a>
    }

    const cards = [
        { key: 'newOrderMechanism', title: '新建销售/采购单的机制', content:  <ol>
            <li>尾款：点击尾款后的按钮“<Button icon={<EditOutlined />} size='small' />”，会根据
                <span style={{ fontWeight: 'bold' }}>清单金额</span>与
                <span style={{ fontWeight: 'bold' }}>定金</span>自动计算尾款并填入。
            </li>
            <li>产品条目：
                <ol>
                    <li>单位：填入<span style={{ fontWeight: 'bold' }}>材质、名称、规格</span>
                        后，如果该产品已存在，单位会自动填入且不可修改。如需修改单位，请到<span style={{ fontWeight: 'bold' }}>产品页面</span>修改，届时所有相关单据都会被修改，金额可能会发生变化（如当单位从“千件”改为“只”时）。
                    </li>
                    <li>历史价格：填入<span style={{ fontWeight: 'bold' }}>材质、名称、规格</span>后，可点击按钮“<Button icon={<LineChartOutlined />} size='small' />”查询价格。</li>
                    <li>删除：点击按钮“<Button type='link' size='small' danger icon={<DeleteOutlined/>}/>”可删除整行数据。</li>
                </ol>
            </li>
            <li>保存机制：新客户（或供应商）、新产品会被创建，但
                <span style={{ color: 'red', fontWeight: 'bold' }}>不会</span>
                删除旧客户（或供应商）、旧产品。产品库存会相应变化。</li>
        </ol> },
        { key: 'modifyOrderMechanism', title: '修改或删除销售/采购单的机制', content: <ol>
            <li>对产品的影响：影响相关的产品库存，但<span style={{ color: 'red', fontWeight: 'bold' }}>不会</span>删除产品。</li>
            <li>对退货单的影响1：修改产品<span style={{ fontWeight: 'bold' }}>材质、名称、规格、数量、备注</span>
                <span style={{ color: 'red', fontWeight: 'bold' }}>不会</span>
                影响挂钩的退货单条目，需要手动更新退货单；修改产品
                <span style={{ fontWeight: 'bold' }}>单价、折扣</span>会直接影响挂钩的退货单条目及金额。
            </li>
            <li>对退货单的影响2：删除单据会删除挂钩的退货单。</li>
        </ol> },
        { key: 'batchClean', title: <>什么是 <Button danger icon={<ClearOutlined/>}>批量清理</Button>  ？</>, content: <ol>
            在产品页面、客户/供应商页面，该按钮用于批量删除表格中显示的所有可删除的条目。
            <li>什么是可删除的条目：即名下无单据的产品、客户/供应商。</li>
            <li>清理范围：只包括显示在表格中的条目，不包括其他不满足查找条件的条目。</li>
            <li>注意：<Button danger icon={<ClearOutlined/>}>批量清理</Button> 不等同于 <Button danger icon={<DeleteOutlined/>}>批量删除</Button> ！</li>
        </ol>}
    ]

    return <>
        { cards.map(card => 
            <Card key={card.key} title={getCardTitle(card.title, card.key)} size='middle' 
                className='helpCard' extra={getCollapseButton(card.key)}>
                { getCollapse(card.key) ? null : card.content }
            </Card>
        )}
    </>
}