import {
    ContainerOutlined,
    SettingOutlined,
    BarChartOutlined,
    PlusCircleOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { Menu } from 'antd';
import React from 'react';

function MyMenu(props) {
    function getItem(label, key, icon, children, type) {
        return { key, icon, children, label, type };
    }

    const menuItems = [
        getItem('开单', 'newInvoice', <PlusCircleOutlined />),
        getItem('发货清单', 'invoices', <ContainerOutlined />),
        getItem('统计数据', 'stats', <BarChartOutlined />, [
            getItem('摘要', 'sales'),
            getItem('客户结算', 'customers'),
            getItem('产品数据', 'products'),
        ]),
        getItem('回收站', 'bin', <DeleteOutlined />),
        getItem('设置', 'settings', <SettingOutlined />)
        // getItem('Navigation Two', 'sub2', <AppstoreOutlined />, [
        //     getItem('Option 9', '9'),
        //     getItem('Option 10', '10'),
        //     getItem('Submenu', 'sub3', null, [getItem('Option 11', '11'), getItem('Option 12', '12')]),
        // ]),
    ];
    return (
        <Menu
            style={{height: '100%'}}
            mode='inline'
            defaultSelectedKeys={[props.defaultKey === undefined ? 'newInvoice' : props.defaultKey]}
            items={menuItems}
            defaultOpenKeys={['stats']}
            onSelect={({ key }) => props.setSelectedMenuKey(key)}
        />
    );
}

export default MyMenu;