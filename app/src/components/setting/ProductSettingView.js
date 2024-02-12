import React, { useEffect, useState } from 'react'
import { Table, Button, Divider, Card } from 'antd'


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
import SettingSwitchItem from './SettingSwitchItem'
import Title from 'antd/es/typography/Title'


function UnitSettingView() {
    const [unitOptions, setUnitOptions] = useState(JSON.parse(invoiceSettings.get('unitOptions')))
    const [isEditing, setIsEditing] = useState(false)

    const editTableColumns = [
        { title: '单位', dataIndex: 'label', width: '100px', align: 'center' },
        {
            title: '状态', dataIndex: 'default', width: '150px', align: 'center', render: (_, curUnit) =>
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
        {
            title: '状态', dataIndex: 'default', width: '150px', align: 'center', render: (_, curUnit) =>
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
        const style = {
            ...props.style,
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

    if (isEditing) {
        return (
            <>
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
                <ol style={{ color: 'gray' }}>
                    <li>勾选的单位将会显示在“开单页面”、“产品编辑页面”的单位选择列表中，不勾选则不显示。</li>
                    <li>拖动列表项目可以为单位排序。</li>
                    <li>无需手动保存。</li>
                </ol>
            </>
        )
    }

    return (
        <Table size='small' rowKey='key' columns={viewTableColumns} pagination={false}
            dataSource={unitOptions.filter(o => o.showing)}
            footer={_ => <Button size='small' onClick={_ => setIsEditing(true)}>编辑</Button>}
        />
    )
}


export default function ProductSettingView() {
    const [ifShowMaterial, setIfShowMaterial] = useState(invoiceSettings.get('ifShowMaterial'))

    return (<>
        <Title id='product' level={2}>产品设置</Title>

        <Card>
            <Title id='product-material' level={3}>材质</Title>
            <SettingSwitchItem keyy='ifShowMaterial' value={ifShowMaterial} setValue={setIfShowMaterial}
                label='开启材质' help='该开关不会影响原有数据，只是显示或隐藏材质项。' />
            <Divider />

            <Title id='product-unit' level={3}>单位</Title>
            <UnitSettingView />
        </Card>
    </>)
}