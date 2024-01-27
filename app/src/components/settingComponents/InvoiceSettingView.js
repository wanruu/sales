import React, { useEffect, useState } from 'react'
import { Space, Form, Table, Button, Radio, Tooltip, Divider } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'


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

function TipsView(props) {
    return (
        <Tooltip title={props.help} >
            <QuestionCircleOutlined style={{ marginLeft: '3px', color: 'gray' }} />
        </Tooltip>
    )
}

export default function InvoiceSettingView() {
    const [ifShowDiscount, setIfShowDiscount] = useState(invoiceSettings.get('ifShowDiscount'))
    const [ifShowMaterial, setIfShowMaterial] = useState(invoiceSettings.get('ifShowMaterial'))
    const [ifShowDelivered, setIfShowDelivered] = useState(invoiceSettings.get('ifShowDelivered'))
    const [ifShowInvoiceDelivered, setIfShowInvoiceDelivered] = useState(invoiceSettings.get('ifShowInvoiceDelivered'))
    const [ifShowItemDelivered, setIfShowItemDelivered] = useState(invoiceSettings.get('ifShowItemDelivered'))
    const [ifShowAmountSign, setIfShowAmountSign] = useState(invoiceSettings.get('ifShowAmountSign'))
    const [allowEditAmount, setAllowEditAmount] = useState(invoiceSettings.get('allowEditAmount'))
    const [invoiceAmountDigitNum, setInvoiceAmountDigitNum] = useState(invoiceSettings.get('invoiceAmountDigitNum'))
    const [itemAmountDigitNum, setItemAmountDigitNum] = useState(invoiceSettings.get('itemAmountDigitNum'))

    return (
        <Space direction='vertical' size={0} style={{ width: '100%' }}>
            <div className='itemTitle'>产品材质</div>
            <SettingSwitchItem keyy='ifShowMaterial' value={ifShowMaterial} setValue={setIfShowMaterial} 
                label='显示材质' help='该开关不会影响原有数据，只是显示或隐藏材质项。' />
            <Divider />

            <UnitSettingView />
            <Divider />

            <div className='itemTitle'>折扣功能</div>
            <SettingSwitchItem keyy='ifShowDiscount' value={ifShowDiscount} setValue={setIfShowDiscount} 
                label='折扣功能' help='该开关不会影响原有数据，只是显示或隐藏折扣及折前金额。' />
            <Divider />

            <div className='itemTitle'>配送功能</div>
            <SettingSwitchItem keyy='ifShowDelivered' value={ifShowDelivered} setValue={setIfShowDelivered} 
                label='允许编辑配送情况' help='若开关打开，则可以在开单页面显示并更改配送情况。' />

            <SettingSwitchItem keyy='ifShowInvoiceDelivered' value={ifShowInvoiceDelivered} setValue={setIfShowInvoiceDelivered} 
                label='显示清单配送情况' help='若开关打开，清单列表中配送情况将会显示为”未配送“、”部分配送“或”全部配送“；否则，将隐藏配送情况一栏。' />
            
            <SettingSwitchItem keyy='ifShowItemDelivered' value={ifShowItemDelivered} setValue={setIfShowItemDelivered} 
                label='显示单个产品配送情况' help='若开关打开，产品配送情况将会显示为”未配送“或”已配送“；否则，将隐藏配送情况一栏。' />
            <Divider />

            <div className='itemTitle'>金额</div>
            <SettingSwitchItem keyy='ifShowAmountSign' value={ifShowAmountSign} setValue={setIfShowAmountSign} 
                label='显示金额符号' help='若开关打开，金额将会显示￥符号前缀，例如￥88；否则，只显示数字。不影响打印显示。' />
            <SettingSwitchItem keyy='allowEditAmount' value={allowEditAmount} setValue={setAllowEditAmount}
                label='允许修改金额' help='若开关打开，则允许在自动计算金额的基础上输入自定义金额。' />
            
            <Item label={<>清单金额保留小数的位数<TipsView help='不影响已创建的清单。'/></>}>
                <Radio.Group style={{ float: 'right' }} value={invoiceAmountDigitNum} onChange={e => {
                    setInvoiceAmountDigitNum(e.target.value)
                    invoiceSettings.set('invoiceAmountDigitNum', e.target.value)
                }}>
                    <Radio.Button value='0'>不保留</Radio.Button>
                    <Radio.Button value='2'>2位小数</Radio.Button>
                    <Radio.Button value='3'>3位小数</Radio.Button>
                </Radio.Group>
            </Item>
            <Item label={<>单个产品金额保留小数的位数<TipsView help='不影响已创建的清单。'/></>}>
                <Radio.Group style={{ float: 'right' }} value={itemAmountDigitNum} onChange={e => {
                    setItemAmountDigitNum(e.target.value)
                    invoiceSettings.set('itemAmountDigitNum', e.target.value)
                }}>
                    <Radio.Button value='0'>不保留</Radio.Button>
                    <Radio.Button value='2'>2位小数</Radio.Button>
                    <Radio.Button value='3'>3位小数</Radio.Button>
                </Radio.Group>
            </Item>

        </Space>
    )
}