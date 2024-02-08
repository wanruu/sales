import React, { useState } from 'react'
import { Layout, theme, Menu } from 'antd'
import {
    SettingOutlined,
    PlusCircleOutlined,
    MinusCircleOutlined,
    UserOutlined,
    BarChartOutlined,
    DropboxOutlined
} from '@ant-design/icons'

const { Header, Content, Footer, Sider } = Layout


import SettingPage from './pages/SettingPage.js'
import ProductPage from './pages/ProductPage.js'
import PartnerPage from './pages/PartnerPage.js'
import InvoicePage from './pages/InvoicePage.js'

const defaultMenuKey = 'salesOrder'

function App() {
    const [menuKey, setMenuKey] = useState(defaultMenuKey)
    const [collapsed, setCollapsed] = useState(false)
    const { token: { colorBgContainer }, } = theme.useToken()

    // drafts
    const [salesOrders, setSalesOrders] = useState([])
    const [salesRefunds, setSalesRefunds] = useState([])
    const [purchaseOrders, setPurchaseOrders] = useState([])
    const [purchaseRefunds, setPurchaseRefunds] = useState([])

    // Pages
    const pages = {
        'salesOrder': <InvoicePage type='salesOrder' drafts={salesOrders} setDrafts={setSalesOrders} />,
        'salesRefund': <InvoicePage type='salesRefund' drafts={salesRefunds} setDrafts={setSalesRefunds} />,
        'purchaseOrder': <InvoicePage type='purchaseOrder' drafts={purchaseOrders} setDrafts={setPurchaseOrders} />,
        'purchaseRefund': <InvoicePage type='purchaseRefund' drafts={purchaseRefunds} setDrafts={setPurchaseRefunds} />,
        'product': <ProductPage />,
        'partner': <PartnerPage />,
        'settings': <SettingPage />
    }

    // Menu
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
        getMenuItem('产品', 'product', <DropboxOutlined />),
        getMenuItem('客户 / 供应商', 'partner', <UserOutlined />),
        getMenuItem('统计数据', 'stat', <BarChartOutlined />),
        getMenuItem('设置', 'settings', <SettingOutlined />)
    ]

    // Return
    return <Layout hasSider style={{ minHeight: '100vh' }}>
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
}

export default App
