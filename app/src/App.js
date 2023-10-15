import { useState, useEffect } from 'react';
import React from 'react';

import MyMenu from './components/MyMenu.js'
import InvoiceList from './pages/InvoiceList.js'
import NewInvoice from './pages/NewInvoice.js';
import Setting from './pages/Setting.js';
import Bin from './pages/Bin.js';
import SaleStat from './pages/SaleStat.js'
import CustomerStat from './pages/CustomerStat.js';
import ProductStat from './pages/ProductStat.js';

function App() {
    const [menuKey, setMenuKey] = useState('newInvoice');

    const pages = {
        // 'newInvoice': <NewInvoice />,
        'invoices': <InvoiceList />,
        'sales': <SaleStat />,
        'products': <ProductStat />,
        'customers': <CustomerStat />,
        'bin': <Bin />,
        'settings': <Setting />,
    };

    const onSelectMenuKey = (key) => {
        setMenuKey(key);
    };


    const [newInvoicePageState, setNewInvoicePageState] = useState(0);
    useEffect(() => {
        if (menuKey === 'newInvoice') {
            setNewInvoicePageState(newInvoicePageState + 1);
        }
    }, [menuKey]);

    return (
        <div style={{ overflow: 'hidden' }}>
            <div style={{ float: 'left', width: '20%', height: '100vh', overflow: 'auto', }}>
                <MyMenu setSelectedMenuKey={onSelectMenuKey} defaultKey={menuKey} />
            </div>
            <div style={{ float: 'right', width: '80%', height: '100vh', overflow: 'auto', }} >
                <div style={{ marginLeft: '15px', marginRight: '15px' }}>
                    <div style={{ display: menuKey !== 'newInvoice' ? 'none' : 'block', overflow: 'none', }}>
                        <NewInvoice state={newInvoicePageState} />
                    </div>
                    {menuKey !== 'newInvoice' ? pages[menuKey] : ''}
                </div>
            </div>
        </div>
    );
}

export default App;
