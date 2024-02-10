import React, { useState } from 'react'
import { Layout, theme, Menu } from 'antd'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
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

    // Pages
    const pages = {
        'salesOrder': <InvoicePage type='salesOrder' />,
        'salesRefund': <InvoicePage type='salesRefund' />,
        'purchaseOrder': <InvoicePage type='purchaseOrder' />,
        'purchaseRefund': <InvoicePage type='purchaseRefund' />,
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

    return (
        <BrowserRouter>
            <Layout hasSider style={{ minHeight: '100vh' }}>
                <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
                    {/* <Menu theme='dark' items={menuItems} mode='inline' defaultSelectedKeys={[defaultMenuKey]}
                        defaultOpenKeys={['order', 'refund']} onSelect={({ key }) => setMenuKey(key)}
                    /> */}
                    <Menu theme='dark' mode='inline' defaultSelectedKeys={[defaultMenuKey]}
                        defaultOpenKeys={['order', 'refund']} onSelect={({ key }) => setMenuKey(key)}
                    >
                        <Menu.SubMenu key='order' title='清单' icon={<PlusCircleOutlined />}>
                            <Menu.Item key='salesOrder'><Link to='/salesOrder'>销售清单</Link></Menu.Item>
                            <Menu.Item key='purchaseOrder'><Link to='/purchaseOrder'>采购清单</Link></Menu.Item>
                        </Menu.SubMenu>
                        <Menu.SubMenu key='refund' title='退货单' icon={<MinusCircleOutlined />}>
                            <Menu.Item key='salesRefund'><Link to='/salesRefund'>销售退货</Link></Menu.Item>
                            <Menu.Item key='purchaseRefund'><Link to='/purchaseRefund'>采购退货</Link></Menu.Item>
                        </Menu.SubMenu>
                        <Menu.Item key='product' icon={<DropboxOutlined />}><Link to='/product'>产品</Link></Menu.Item>
                        <Menu.Item key='partner' icon={<UserOutlined />}><Link to='/partner'>客户 / 供应商</Link></Menu.Item>
                        <Menu.Item key='stat' icon={<BarChartOutlined />}><Link to='/stat'>统计数据</Link></Menu.Item>
                        <Menu.Item key='settings' icon={<SettingOutlined />}><Link to='/settings'>设置</Link></Menu.Item>
                    </Menu>
                </Sider>
                <Layout>
                    <Content style={{ padding: '0 16px', background: colorBgContainer }}>
                        {/* { pages[menuKey] } */}
                        <Routes>
                            <Route path='salesOrder' element={<InvoicePage type='salesOrder' key='salesOrder' />} />
                            <Route path='purchaseOrder' element={<InvoicePage type='purchaseOrder' key='purchaseOrder' />} />
                            <Route path='salesRefund' element={<InvoicePage type='salesRefund' key='salesRefund' />} />
                            <Route path='purchaseRefund' element={<InvoicePage type='purchaseRefund' key='purchaseRefund' />} />
                            <Route path='product' element={<ProductPage />} />
                            <Route path='partner' element={<PartnerPage />} />
                            <Route path='stat' element={<></>} />
                            <Route path='settings' element={<SettingPage />} />
                        </Routes>
                    </Content>
                </Layout>
            </Layout>
        </BrowserRouter>
    )
}

export default App
