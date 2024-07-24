import dayjs from 'dayjs'
import Axios from 'axios'
import React, { useEffect, useState } from 'react'
import { Card, Col, Row, Statistic, Select, Space, Button } from 'antd'
import ReactEcharts from 'echarts-for-react'
import Title from 'antd/es/typography/Title'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'

import { DATE_FORMAT, baseURL } from '../utils/config'


const RANGE_OPTIONS = [
    { value: 'week', label: '按周统计'},
    { value: 'month', label: '按月统计'},
    { value: 'year', label: '按年统计'},
    { value: 'all', label: '全部统计'},
    { value: 'range', label: '范围统计'}
]



const RangeSelectionView = ({ dateRange, setDateRange }) => {
    const [rangeOption, setRangeOption] = useState('week')

    const handleRangeChange = (value) => {
        setRangeOption(value)
    }

    const initRange = () => {
        const current = new Date()
        if (rangeOption === 'week') {

        } else if (rangeOption === 'month') {
            
        }
    }

    const dateFormatter = (date, style) => {
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        const day = date.getDate()
        switch (style) {
            case 'year':
                return year + '年'
            case 'month':
                return year + '年' + month + '月'
            default:
                return year + '年' + month + '月' + day + '日'
        }
    }

    useEffect(initRange, [])

    return (
        <Row align='middle' style={{ marginTop: '15px' }}>
            <Col span={8}>
                <Select options={RANGE_OPTIONS} defaultValue='week' onChange={handleRangeChange} />
            </Col>
            <Col span={8} align='center'>
                <Button icon={<LeftOutlined />}></Button>
                <Button>
                    test
                </Button>
                <Button icon={<RightOutlined />}></Button>
            </Col>
        </Row>
    )
}

export default function StatisticPage() {
    const [salesStat, setSalesStat] = useState({
        nCustomers: null,
        nProducts: null,
        nInvoices: null,
        amount: null,
    })
    const [dateRange, setDateRange] = useState([null, null])

    const numFormatter = (value) => {
        return value == null ? '...' : value.toLocaleString()
    }

    const loadSalesStat = () => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: 'stat',
        }).then(res => {
            setSalesStat(res.data)
        }).catch(err => {

        })
    }

    useEffect(() => {
        loadSalesStat()
    }, [])


    const getOption = () => {
        return {
            title: { text: historyStat.length === 0 ? '暂无数据' : '', x: 'center', y: 'center' },
            xAxis: {
                type: 'category',
                data: historyStat.map(history => {
                    const d = dayjs(history.date).format(DATE_FORMAT)
                    if (historyRange === 'day') return d
                    if (historyRange === 'month') return d.slice(0, 8)
                    if (historyRange === 'year') return d.slice(0, 5)
                }),
            },
            yAxis: {
                type: 'value'
            },
            tooltip: {
                trigger: 'axis',
                formatter: function (params) {
                    const data = params[0].data
                    const result = `成交金额：¥ ${data.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}<br/>`
                    const d = dayjs(data.date).format(DATE_FORMAT)
                    if (historyRange === 'day') return result + `日期：${d}`
                    if (historyRange === 'month') return result + `月份：${d.slice(0, 8)}`
                    if (historyRange === 'year') return result + `年份：${d.slice(0, 5)}`
                }
            },
            series: [
                {
                    data: historyStat.map(history => ({
                        value: history.amount,
                        date: history.date,
                    })),
                    type: 'line'
                }
            ]
        }
    }

    return (
        <div className='pageMainContent'>
            <RangeSelectionView dateRange={dateRange} setDateRange={setDateRange} />

            <Title id='summary' level={2}>摘要</Title>
            <Card bordered={true}>
                <Row gutter={16} wrap>
                    <Col span={12}>
                        <Statistic title='成交单数' value={salesStat.nInvoices} formatter={numFormatter} />
                    </Col>
                    <Col span={12}>
                        <Statistic title='成交金额' value={salesStat.amount} precision={2} formatter={numFormatter} />
                    </Col>
                    <Col span={12}>
                        <Statistic title='客户数' value={salesStat.nCustomers} formatter={numFormatter} />
                    </Col>
                    <Col span={12}>
                        <Statistic title='产品数' value={salesStat.nProducts} formatter={numFormatter} />
                    </Col>
                </Row>
            </Card>
            <Title id='summary' level={2}>收支趋势图</Title>
            {/* <ReactEcharts option={getOption()} /> */}
        </div>
    )
}
