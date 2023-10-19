import {
    ContainerOutlined,
    SettingOutlined,
    BarChartOutlined,
    PlusCircleOutlined,
    MinusCircleOutlined,
    BankOutlined,
    UserOutlined
} from '@ant-design/icons'
import { Menu } from 'antd'
import React from 'react'

function MyMenu(props) {
    function getItem(label, key, icon, children, type) {
        return { key, icon, children, label, type }
    }

    const menuItems = [
        getItem('清单', 'order', <PlusCircleOutlined />, [
            getItem('销售清单', 'salesOrder'),
            getItem('采购清单', 'salesRefund')
        ]),
        getItem('退货单', 'refund', <MinusCircleOutlined />, [
            getItem('销售退货', 'purchaseOrder'),
            getItem('采购退货', 'purchaseRefund')
        ]),
        getItem('产品', 'product', <BankOutlined />),
        getItem('交易对象', 'partner', <UserOutlined />),
        // getItem('统计数据', 'stats', <BarChartOutlined />, [
        //     getItem('摘要', 'sales'),
        //     getItem('客户结算', 'customrs'),
        //     getItem('产品数据', 'products'),
        // ]),
        getItem('设置', 'settings', <SettingOutlined />),
    ]
    

    return <Menu items={menuItems} mode='inline' 
        defaultSelectedKeys={['salesOrder']}
        defaultOpenKeys={['order', 'refund']}
        onSelect={({ key }) => props.setSelectedMenuKey(key)}
    />
        // <Menu
        //     style={{height: '100%'}}
        //     mode='inline'
        //     defaultSelectedKeys={[props.defaultKey === undefined ? 'newInvoice' : props.defaultKey]}
        //     items={menuItems}
        //     defaultOpenKeys={['stats']}
        //     onSelect={({ key }) => props.setSelectedMenuKey(key)}
        // />
}

export default MyMenu