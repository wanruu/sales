import { useState, useEffect } from 'react'
import React from 'react'
import { Layout, theme } from 'antd'

const { Header, Content, Footer, Sider } = Layout

import MyMenu from './components/common/MyMenu.js'
import SalesOrderPage from './pages/SalesOrderPage.js'
import SettingPage from './pages/SettingPage.js';
import ProductPage from './pages/ProductPage.js'


function App() {
    const [menuKey, setMenuKey] = useState('salesOrder')
    const { token: { colorBgContainer }, } = theme.useToken()
    const pages = {
        'salesOrder': <SalesOrderPage />,
        'salesRefund': 'SalesRefundList',
        'purchaseOrder': 'PurchaseOrder',
        'purchaseRefund': 'PurchaseRefund',
        'product': <ProductPage />,
        'settings': <SettingPage />,
    };

    return (
        <Layout hasSider style={{ background: colorBgContainer }}>
            <Sider style={{ overflow: 'auto', height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0, background: colorBgContainer }}>
                <MyMenu setSelectedMenuKey={key => setMenuKey(key)} defaultKey={menuKey} />
            </Sider>
            <Layout className="site-layout" style={{ marginLeft: 200, }}>
                {/* <Header style={{ padding: 0, background: colorBgContainer }} >
                    header
                </Header> */}
                <Content style={{ overflow: 'initial', background: colorBgContainer }}>
                    <div style={{ paddingLeft: 18, paddingRight: 18, background: colorBgContainer }}>
                        {pages[menuKey]}
                    </div>
                </Content>
            </Layout>
        </Layout>
    )
}

export default App;
