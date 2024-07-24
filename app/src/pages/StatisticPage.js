import dayjs from 'dayjs'
import Axios from 'axios'
import React, { useEffect, useMemo, useState } from 'react'
import { Card, Col, Row, Statistic, Select, Space, Button, DatePicker } from 'antd'
import ReactEcharts from 'echarts-for-react'
import Title from 'antd/es/typography/Title'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'

import { DATE_FORMAT, baseURL } from '../utils/config'


const { RangePicker } = DatePicker


const RANGE_OPTIONS = [
    { value: 'week', label: '按周统计'},
    { value: 'month', label: '按月统计'},
    { value: 'year', label: '按年统计'},
    { value: 'all', label: '全部统计'},
    { value: 'range', label: '范围统计'}
]



const RangeSelectionView = ({ dateRange, setDateRange }) => {
    const [rangeOption, setRangeOption] = useState('week')

    const initRange = () => {
        const curr = dayjs()
        if (rangeOption === 'week') {
            setDateRange([curr.startOf('week'), null])
        } else if (rangeOption === 'month' || rangeOption === 'year') {
            setDateRange([curr, null])
        } else {
            Axios({
                method: 'get',
                baseURL: baseURL(),
                url: '/stat/range',
                'Content-Type': 'application/json',
            }).then(res => {
                // TODO
                // setDateRange([dayjs('2000/01/01'), dayjs()])
            }).catch(_ => {
                // setDateRange([null, null])
                setDateRange([dayjs('2000/01/01'), dayjs()])
            })
        }
    }

    const handleRangeMinus = () => {
        const handleDateMinus = (date) => {
            if (date == null) {
                return null
            }
            if (rangeOption === 'week') {
                return date.subtract(7, 'day')
            } else if (rangeOption === 'month') {
                return date.subtract(1, 'month')
            } else if (rangeOption === 'year') {
                return date.subtract(1, 'year')
            }
        }
        setDateRange([handleDateMinus(dateRange[0]), handleDateMinus(dateRange[1])])
    }

    const handleRangePlus = () => {
        const handleDatePlus = (date) => {
            if (date == null) {
                return null
            }
            if (rangeOption === 'week') {
                return date.add(7, 'day')
            } else if (rangeOption === 'month') {
                return date.add(1, 'month')
            } else if (rangeOption === 'year') {
                return date.add(1, 'year')
            }
        }
        setDateRange([handleDatePlus(dateRange[0]), handleDatePlus(dateRange[1])])
    }

    const rangeDisplay = useMemo(() => {
        if (dateRange[0] == null && dateRange[1] == null) {
            return '...'
        } else if (dateRange[1] == null) {
            if (rangeOption === 'year') {
                return <Space.Compact direction='horizontal'>
                    <Button icon={<LeftOutlined />} onClick={_ => handleRangeMinus()}></Button>
                    <DatePicker picker='year' format='YYYY年' allowClear={false}
                        value={dateRange[0]} onChange={val => setDateRange([val, null])} />
                    <Button icon={<RightOutlined />} onClick={_ => handleRangePlus()}></Button>
                </Space.Compact>
            } else if (rangeOption === 'month') {
                return <Space.Compact direction='horizontal'>
                    <Button icon={<LeftOutlined />} onClick={_ => handleRangeMinus()}></Button>
                    <DatePicker picker='month' format='YYYY年MM月' allowClear={false}
                        value={dateRange[0]} onChange={val => setDateRange([val, null])} />
                    <Button icon={<RightOutlined />} onClick={_ => handleRangePlus()}></Button>
                </Space.Compact>
            } else if (rangeOption === 'week') {
                return <Space.Compact direction='horizontal'>
                    <Button icon={<LeftOutlined />} onClick={_ => handleRangeMinus()}></Button>
                    <DatePicker picker='week' format='YYYY年MM月DD日 + 7' allowClear={false} 
                        value={dateRange[0]} onChange={val => setDateRange([val.startOf('week'), null])} />
                    <Button icon={<RightOutlined />} onClick={_ => handleRangePlus()}></Button>
                </Space.Compact>
            }
        } else {
            return <RangePicker value={dateRange} onChange={val => setDateRange(val)} />
        }
    }, [dateRange, rangeOption])

    useEffect(initRange, [rangeOption])

    return (
        <Row align='middle' style={{ marginTop: '15px' }}>
            <Col span={8}>
                <Select options={RANGE_OPTIONS} defaultValue='week' onChange={val => setRangeOption(val)} />
            </Col>
            <Col span={8} align='center'>
                {
                    // ["week", "month", "year"].includes(rangeOption) ? 
                    // <Space.Compact direction='horizontal'>
                    //     <Button icon={<LeftOutlined />} onClick={_ => handleRangeMinus()}></Button>
                    //     <Button>{rangeDisplay}</Button>
                    //     <Button icon={<RightOutlined />} onClick={_ => handleRangePlus()}></Button>
                    // </Space.Compact> : <Space.Compact direction='horizontal'>
                    //     <RangePicker />
                    // </Space.Compact>
                    
                }
                {rangeDisplay}
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
