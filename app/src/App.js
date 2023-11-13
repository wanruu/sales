import React, { useState, useEffect } from 'react'
import { Layout, theme, Menu, Button } from 'antd'
import {
    SettingOutlined,
    PlusCircleOutlined,
    MinusCircleOutlined,
    BankOutlined,
    UserOutlined,
    BarChartOutlined,
    MenuFoldOutlined, MenuUnfoldOutlined,
    QuestionCircleOutlined
} from '@ant-design/icons'


const { Header, Content, Footer, Sider } = Layout

import SalesOrderPage from './pages/SalesOrderPage.js'
import SettingPage from './pages/SettingPage.js'
import ProductPage from './pages/ProductPage.js'
import PartnerPage from './pages/PartnerPage.js'
import SalesRefundPage from './pages/SalesRefundPage.js'
import HelpPage from './pages/HelpPage.js'


const defaultMenuKey = 'salesOrder'
function App() {
    const [menuKey, setMenuKey] = useState(defaultMenuKey)
    const { token: { colorBgContainer }, } = theme.useToken()
    const [collapsed, setCollapsed] = useState(false)

    const pages = {
        'salesOrder': <SalesOrderPage />,
        'salesRefund': <SalesRefundPage />,
        'purchaseOrder': 'PurchaseOrder',
        'purchaseRefund': 'PurchaseRefund',
        'product': <ProductPage />,
        'partner': <PartnerPage />,
        'settings': <SettingPage />,
        'help': <HelpPage />
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
        getMenuItem('帮助', 'help', <QuestionCircleOutlined />)
    ]
    // ------------------

    return (
        // <Layout hasSider style={{ background: colorBgContainer }}>
        //     <Sider style={{ zIndex: 2, overflow: 'auto', height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0, background: colorBgContainer }}>
        //         <Menu items={menuItems} mode='inline' defaultSelectedKeys={[defaultMenuKey]}
        //             defaultOpenKeys={['order', 'refund']} onSelect={({ key }) => setMenuKey(key)}
        //         />
        //     </Sider>
        //     <Layout style={{ marginLeft: 190, zIndex: 1 }}>
        //         <Content style={{ overflow: 'initial', background: colorBgContainer }}>
        //             <div style={{ paddingLeft: 18, paddingRight: 18, background: colorBgContainer }}>
        //                 {pages[menuKey]}
        //             </div>
        //         </Content> 
        //     </Layout>
        // </Layout>
        <Layout hasSider style={{ minHeight: '100vh' }}>
            <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
                <Menu theme='dark' items={menuItems} mode='inline' defaultSelectedKeys={[defaultMenuKey]}
                    defaultOpenKeys={['order', 'refund']} onSelect={({ key }) => setMenuKey(key)}
                />
            </Sider>
            <Layout>
                <Content style={{ padding: '0 16px', background: colorBgContainer }}>
                    {pages[menuKey]}
                </Content>
            </Layout>
        </Layout>
    )
}

export default App
