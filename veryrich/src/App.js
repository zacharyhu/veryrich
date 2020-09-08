import React, {Component} from 'react'
import {Button, Input, Table, Card} from 'antd'
import {actions, connect} from 'mirrorx'
import {globalConstants} from './globalConstants'

const mapStateToProps = state => ({
    bossDmg: state.report.bossDmg,
    fight: state.report.fight,
    bossTrashDmg: state.report.bossTrashDmg,
})

class DashboardPage extends Component{

    constructor(props) {
        super(props)
        this.state={
            report: null,
            loading: false
        }
    }

    submit = () => {
        let promises = []
        this.setState({loading: true})

        promises.push(actions.report.getBOSSDmg(this.state.report))
        promises.push(actions.report.getFight(this.state.report))
        Promise.all(promises).then(()=>{
            const trashIds = this.findTargetIds(globalConstants.TRASHIDS, this.props.fight)
            const bossTrashIds = this.findTargetIds(globalConstants.EXTRABOSSIDS, this.props.fight)
            actions.report.getBossTrashDmg({trashIds, reportId: this.state.report}).then(()=> this.setState({loading: false}))
            actions.report.getExtraBossDmg({bossTrashIds, reportId: this.state.report}).then(()=> this.setState({loading: false}))
        })
    }

    findTargetIds = (trashIds, fight) => {
        const enemies = fight?.enemies
        return enemies.map(enemy=>trashIds.includes(enemy.guid)&&enemy.id).filter(id=>!!id)
    }

    calculateBossTime = (fight) => {
        let sum = 0
        fight&&fight.fights.filter(record=>record.boss!==0).map(record=>{
            sum+=record.end_time-record.start_time
        })
        return sum/1000
    }

    generateSource = (bossDmg, bossTrashDmg) => {
        let bossDmgMax = {}
        let bossTrashDmgMax = {}
        const bossTime = this.calculateBossTime(this.props.fight)
        let source = bossDmg.map(entry=>{
            const trashDmg = bossTrashDmg?.find(trashEntry=>trashEntry.id===entry.id)?.total
            bossDmgMax[entry.type] = bossDmgMax[entry.type] > entry.total ? bossDmgMax[entry.type] : entry.total
            bossTrashDmgMax[entry.type] = bossTrashDmgMax[entry.type] > trashDmg ? bossTrashDmgMax[entry.type] : trashDmg
            return {
                id: entry.id,
                name: entry.name,
                type: entry.type,
                bossDmg: entry.total,
                bossDps: (entry.total/bossTime).toFixed(2),
                bossTrashDmg: trashDmg
            }
        })

        source = source.map(entry=>{
            const bossScore =  (entry.bossDmg/bossDmgMax[entry.type]).toFixed(2)
            const bossTrashScore =  (entry.bossTrashDmg/bossTrashDmgMax[entry.type]).toFixed(2)
            entry.bossScore = bossScore
            entry.bossTrashScore = bossTrashScore
            entry.finalScore = ((parseFloat(bossScore)+parseFloat(bossTrashScore))/2) .toFixed(2)
            return entry
        })
        return source
    }

    render() {
        const {bossDmg, bossTrashDmg} = this.props
        const dataSource = bossDmg && bossTrashDmg && this.generateSource(bossDmg, bossTrashDmg)
        const columns = [
            {
                title: 'ID',
                dataIndex: 'name',
            },
            {
                title: '职业',
                dataIndex: 'type',
                filters: [
                    {
                        text: '战',
                        value: 'Warrior',
                    },
                    {
                        text: '法',
                        value: 'Mage',
                    },
                    {
                        text: '术',
                        value: 'Warlock',
                    },
                    {
                        text: '猎',
                        value: 'Hunter',
                    },
                    {
                        text: '贼',
                        value: 'Rogue',
                    },
                    {
                        text: '德',
                        value: 'Druid',
                    },
                    {
                        text: '牧',
                        value: 'Priest',
                    },
                    {
                        text: '骑',
                        value: 'Paladin',
                    },
                    {
                        text: '萨',
                        value: 'Shaman',
                    },

                ],
                onFilter: (value, record) => record.type === value ,
            },
            {
                title: 'Boss伤害',
                dataIndex: 'bossDmg',
                sorter: (a, b) => a.bossDmg-b.bossDmg,
            },
            {
                title: 'Boss DPS',
                dataIndex: 'bossDps',
            },
            {
                title: '全程有效伤害',
                dataIndex: 'bossTrashDmg',
                sorter: (a, b) => a.bossTrashDmg-b.bossTrashDmg,
                defaultSortOrder: 'descend',
            },
            {
                title: 'BOSS分',
                dataIndex: 'bossScore',
            },
            {
                title: '全程分',
                dataIndex: 'bossTrashScore',
            },
            {
                title: '平均分',
                dataIndex: 'finalScore',
                sorter: (a, b) => a.finalScore-b.finalScore,
            },
        ]
        return (
            <Card title={<div>
                <Input
                    style={{width: 400}}
                    placeholder="请粘贴reportID，例如: Jzx9tgnTKvVwAX"
                    onChange={event => this.setState({report: event.target.value})}/>
                <Button onClick={this.submit}>提交</Button>
            </div>}>
                <Table
                    size="small"
                    loading={this.state.loading}
                    dataSource={dataSource}
                    columns={columns}
                    rowKey='id'
                    pagination={false}
                />
            </Card>
        )
    }
}

export default connect(mapStateToProps, null) (DashboardPage)