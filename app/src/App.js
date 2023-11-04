import React, { useState, useEffect } from 'react'
import { Layout, theme, Menu } from 'antd'
import {
    SettingOutlined,
    PlusCircleOutlined,
    MinusCircleOutlined,
    BankOutlined,
    UserOutlined,
    BarChartOutlined
} from '@ant-design/icons'


const { Header, Content, Footer, Sider } = Layout

import SalesOrderPage from './pages/SalesOrderPage.js'
import SettingPage from './pages/SettingPage.js';
import ProductPage from './pages/ProductPage.js'
import PartnerPage from './pages/PartnerPage.js'
import SalesRefundPage from './pages/SalesRefundPage.js'


function App() {
    const [menuKey, setMenuKey] = useState('salesOrder')
    const { token: { colorBgContainer }, } = theme.useToken()
    
    const pages = {
        'salesOrder': <SalesOrderPage />,
        'salesRefund': <SalesRefundPage />,
        'purchaseOrder': 'PurchaseOrder',
        'purchaseRefund': 'PurchaseRefund',
        'product': <ProductPage />,
        'partner': <PartnerPage />,
        'settings': <SettingPage />,
    }

    // ------------------ Menu
    const getMenuItem = (label, key, icon, children, type) => {
        return { key, icon, children, label, type }
    }
    const menuItems = [
        getMenuItem('清单', 'order', <PlusCircleOutlined />, [
            getMenuItem('销售清单', 'salesOrder'),
            getMenuItem('采购清单', 'purchaseOrder')
        ]),
        getMenuItem('退货单', 'refund', <MinusCircleOutlined />, [
            getMenuItem('销售退货', 'salesRefund'),
            getMenuItem('采购退货', 'purchaseRefund')
        ]),
        getMenuItem('产品', 'product', <BankOutlined />),
        getMenuItem('交易对象', 'partner', <UserOutlined />),
        getMenuItem('统计数据', 'stat', <BarChartOutlined />),
        getMenuItem('设置', 'settings', <SettingOutlined />),
    ]
    // ------------------

    return (
        <Layout hasSider style={{ background: colorBgContainer }}>
            <Sider style={{ overflow: 'auto', height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0, background: colorBgContainer }}>
                <Menu items={menuItems} mode='inline' defaultSelectedKeys={['salesOrder']}
                    defaultOpenKeys={['order', 'refund']} onSelect={({ key }) => setMenuKey(key)}
                />
            </Sider>
            <Layout className="site-layout" style={{ marginLeft: 200, }}>
                {/* <Header style={{ padding: 0, background: colorBgContainer }} >
                    header
                </Header> */}
                <Content style={{ overflow: 'initial', background: colorBgContainer }}>
                    <div style={{ paddingLeft: 18, paddingRight: 18, background: colorBgContainer }}>
                        {/* <SalesOrderPage style={{ display: menuKey==='salesOrder' ? 'block' : 'none' }} />
                        <SalesRefundPage style={{ display: menuKey==='salesRefund' ? 'block' : 'none' }} />
                        <ProductPage style={{ display: menuKey==='product' ? 'block' : 'none' }} />
                        <PartnerPage style={{ display: menuKey==='partner' ? 'block' : 'none' }} />
                        <SettingPage style={{ display: menuKey==='settings' ? 'block' : 'none' }} /> */}
                        {pages[menuKey]}
                    </div>
                </Content>
            </Layout>
        </Layout>
    )
}

export default App;
