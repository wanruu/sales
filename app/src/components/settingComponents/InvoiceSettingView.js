import { Space, Card, Form, Switch, Table, Button, Tooltip } from 'antd'
import React, { useEffect, useState } from 'react'
import {
    QuestionCircleOutlined
} from '@ant-design/icons'

import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
    SortableContext,
    arrayMove,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'


import { invoiceSettings } from '../../utils/config'


const { Item } = Form


function UnitSettingView() {
    const [unitOptions, setUnitOptions] = useState(JSON.parse(invoiceSettings.get('unitOptions')))
    const [isEditing, setIsEditing] = useState(false)

    const editTableColumns = [
        { title: '单位', dataIndex: 'label', width: '100px', align: 'center' },
        { title: '状态', dataIndex: 'default', width: '150px', align: 'center', render: (_, curUnit) => 
            curUnit.default ? <b>当前默认单位</b> :
            <Button size='small' onClick={_ => {
                const newUnitData = JSON.parse(JSON.stringify(unitOptions))
                for (const unit of newUnitData) {
                    unit.default = unit.label === curUnit.label
                }
                setUnitOptions(newUnitData)
            }}>设为默认</Button>
        }
    ]
    const viewTableColumns = [
        { title: '序号', width: '32px', align: 'center', render: (_, __, idx) => idx + 1 },
        { title: '单位', dataIndex: 'label', width: '100px', align: 'center' },
        { title: '状态', dataIndex: 'default', width: '150px', align: 'center', render: (_, curUnit) => 
            curUnit.default ? <b>当前默认单位</b> :
            <Button size='small' onClick={_ => {
                const newUnitData = JSON.parse(JSON.stringify(unitOptions))
                for (const unit of newUnitData) {
                    unit.default = unit.label === curUnit.label
                }
                setUnitOptions(newUnitData)
            }}>设为默认</Button>
        }
    ]
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 1, } }))
    const onDragEnd = ({ active, over }) => {
        if (active.id !== over?.id) {
            setUnitOptions((prev) => {
                const activeIndex = prev.findIndex((i) => i.key === active.id)
                const overIndex = prev.findIndex((i) => i.key === over?.id)
                return arrayMove(prev, activeIndex, overIndex)
            })
        }
    }
    const rowSelection = {
        selectedRowKeys: unitOptions.filter(unit => unit.showing).map(unit => unit.key),
        onChange: (selectedRowKeys, selectedRows) => {
            const newUnitData = JSON.parse(JSON.stringify(unitOptions))
            for (const unit of newUnitData) {
                unit.showing = selectedRowKeys.includes(unit.key)
            }
            setUnitOptions(newUnitData)
        },
        getCheckboxProps: (record) => ({
            name: record.name,
        })
    }
    const TableRow = (props) => {
        const { attributes, listeners, setNodeRef,
            transform, transition, isDragging
        } = useSortable({ id: props['data-row-key'] })
        const style = { ...props.style,
            transform: CSS.Transform.toString(transform && { ...transform, scaleY: 1 }),
            transition,
            cursor: 'move',
            ...(isDragging ? { position: 'relative', zIndex: 9999 } : {})
        }
        return <tr {...props} ref={setNodeRef} style={style} {...attributes} {...listeners} />
    }

    useEffect(() => {
        invoiceSettings.set('unitOptions', JSON.stringify(unitOptions))
    }, [unitOptions])


    return <Space direction='vertical' size={0} style={{ width: '100%' }}>
        <div className='itemTitle'>产品单位</div>
        {
            isEditing ? 
            <Form layout='vertical'>
                <Item extra='（1）勾选的单位将会显示在开单页面、产品编辑页面的单位选择列表中，不勾选则不显示。
                    （2）拖动列表项目可以为单位排序。
                    （3）无需手动保存。'>
                    <DndContext sensors={sensors} modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
                        <SortableContext items={unitOptions.map(i => i.key)} strategy={verticalListSortingStrategy}>
                            <Table size='small' rowKey='key' columns={editTableColumns} dataSource={unitOptions}
                                pagination={false} components={{ body: { row: TableRow } }} 
                                rowSelection={rowSelection}
                                footer={_ =>
                                    <Button size='small' onClick={_ => setIsEditing(false)}>收起</Button>
                                }
                            />
                        </SortableContext>
                    </DndContext>
                </Item>
            </Form> :
            <Table size='small' rowKey='key' columns={viewTableColumns} pagination={false}
                dataSource={unitOptions.filter(o => o.showing)}
                footer={_ => <Button size='small' onClick={_ => setIsEditing(true)}>编辑</Button>}
            />
        }
        
    </Space>
}


/*
    Required: value, setValue, key, label, help
*/
function SwitchItem(props) {
    return <Item label={<>
        {props.label}
        <Tooltip title={props.help} >
            <QuestionCircleOutlined style={{ marginLeft: '3px', color: 'gray' }} />
        </Tooltip>
    </>}>
        <Switch checked={props.value === 'true'} onChange={val => {
            props.setValue(`${val}`)
            invoiceSettings.set(props.key, `${val}`)
        }} />
    </Item>
}


export default function InvoiceSettingView() {
    const [ifShowDiscount, setIfShowDiscount] = useState(invoiceSettings.get('ifShowDiscount'))
    const [ifShowMaterial, setIfShowMaterial] = useState(invoiceSettings.get('ifShowMaterial'))
    const [ifShowDelivered, setIfShowDelivered] = useState(invoiceSettings.get('ifShowDelivered'))
    const [ifShowInvoiceDelivered, setIfShowInvoiceDelivered] = useState(invoiceSettings.get('ifShowInvoiceDelivered'))
    const [ifShowItemDelivered, setIfShowItemDelivered] = useState(invoiceSettings.get('ifShowItemDelivered'))


    return <Card size='small'>
        <Space direction='vertical' size={0} style={{ width: '100%' }}>
            <div className='itemTitle'>产品材质</div>
            <SwitchItem key='ifShowMaterial' value={ifShowMaterial} setValue={setIfShowMaterial} 
                label='显示材质' help='该开关不会影响原有数据，只是显示或隐藏材质项。' />
            
            <UnitSettingView />

            <div className='itemTitle'>折扣功能</div>
            <SwitchItem key='ifShowDiscount' value={ifShowDiscount} setValue={setIfShowDiscount} 
                label='折扣功能' help='该开关不会影响原有数据，只是显示或隐藏折扣及折前金额。' />
            
            <div className='itemTitle'>配送功能</div>
            <SwitchItem key='ifShowDelivered' value={ifShowDelivered} setValue={setIfShowDelivered} 
                label='配送功能' help='若开关打开，则可以在开单页面显示并更改配送情况。' />

            <SwitchItem key='ifShowInvoiceDelivered' value={ifShowInvoiceDelivered} setValue={setIfShowInvoiceDelivered} 
                label='显示整体配送情况' help='若开关打开，清单列表中配送情况将会显示为”未配送“、”部分配送“或”全部配送“；否则，将隐藏配送情况一栏。' />
            
            <SwitchItem key='ifShowItemDelivered' value={ifShowItemDelivered} setValue={setIfShowItemDelivered} 
                label='显示单个产品配送情况' help='若开关打开，产品配送情况将会显示为”未配送“或”已配送“；否则，将隐藏配送情况一栏。' />
        </Space>
    </Card>
}