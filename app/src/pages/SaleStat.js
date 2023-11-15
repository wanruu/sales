import dayjs from 'dayjs'
import Axios from 'axios'
import React, { useEffect, useState } from 'react'
import { Card, Col, Row, Statistic, Radio } from 'antd'
import CountUp from 'react-countup'
import ReactEcharts from 'echarts-for-react'

import { DATE_FORMAT, baseURL } from '../config'

function SaleStat() {
    const [todayStat, setTodayStat] = useState({
        nCustomers: 0,
        nProducts: 0,
        nInvoices: 0,
        maxAmount: 0,
        minAmount: 0,
        amount: 0,
    })
    const [historyStat, setHistoryStat] = useState([])
    const [historyRange, setHistoryRange] = useState('day')

    const floatFormatter = (value) => <CountUp end={value} decimals={2} separator=',' duration={0.5} />
    const intFormatter = (value) => <CountUp end={value} separator=',' duration={0.5} />

    const loadTodayStat = () => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: 'stat/today',
        }).then(res => {
            setTodayStat(res.data)
        }).catch(err => {

        })
    }

    const loadHistoryStat = () => {
        Axios({
            method: 'get',
            baseURL: baseURL(),
            url: 'stat/history/',
            params: { range: historyRange }
        }).then(res => {
            setHistoryStat(res.data)
        }).catch(err => {

        })
    }

    const onHistoryRangeChange = ({ target: { value } }) => {
        setHistoryRange(value)
    }

    useEffect(() => {
        loadTodayStat()
    }, [])

    useEffect(() => {
        loadHistoryStat()
    }, [historyRange])


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
        <div>
            <h2>今日摘要</h2>
            <Card bordered={true}>
                <Row gutter={16}>
                    {/* 0-24 */}
                    <Col span={8}>
                        <Statistic title='成交单数' value={todayStat.nInvoices} formatter={intFormatter} />
                    </Col>
                    <Col span={8}>
                        <Statistic title='客户数' value={todayStat.nCustomers} formatter={intFormatter} />
                    </Col>
                    <Col span={8}>
                        <Statistic title='产品数' value={todayStat.nProducts} formatter={intFormatter} />
                    </Col>
                    <Col span={8}>
                        <Statistic title='成交金额 (元)' value={todayStat.amount} precision={2} formatter={floatFormatter} prefix='¥' />
                    </Col>
                    <Col span={8}>
                        <Statistic title='最大单额' value={todayStat.maxAmount} formatter={floatFormatter} prefix='¥' />
                    </Col>
                    <Col span={8}>
                        <Statistic title='最小单额' value={todayStat.minAmount} formatter={floatFormatter} prefix='¥' />
                    </Col>
                </Row>
            </Card>
            <h2>历史数据</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <font>成交金额</font>
                <Radio.Group
                    options={[{ label: '日', value: 'day' }, { label: '月', value: 'month' }, { label: '年', value: 'year' }]}
                    onChange={onHistoryRangeChange}
                    value={historyRange}
                    optionType='button'
                />
            </div>
            <ReactEcharts option={getOption()} />
        </div>
    )
}

export default SaleStat