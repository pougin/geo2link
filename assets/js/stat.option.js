var option = {
    title : [{
        text: '按节点数统计的路段数量',
        top: '4%',
        x: 'center',
        align: 'right'
    },{
        text: '按长度数统计的路段数量',
        top: '52%',
        x: 'center',
        align: 'right'
    }],
    grid: [{
        left: 50,
        right: 50,
        top:'10%',
        height: '35%'
    }, {
        left: 50,
        right: 50,
        top: '58%',
        height: '35%'
    }],
    toolbox: {
        feature: {
            dataZoom: {
                yAxisIndex: 'none'
            },
            restore: {},
            saveAsImage: {}
        }
    },
    tooltip : {
        trigger: 'axis',
        axisPointer: {
            type: 'cross',
            animation: false,
            label: {
                backgroundColor: '#505765'
            }
        }
    },
    legend: {
        data:['路段数（按节点统计）', '路段数（按长度统计）'],
        x: 'left'
    },
    // dataZoom: [
    //     {
    //         show: true,
    //         realtime: true,
    //         start: 65,
    //         end: 85
    //     },
    //     {
    //         type: 'inside',
    //         realtime: true,
    //         start: 65,
    //         end: 85
    //     }
    // ],
    xAxis : [
        {
            type : 'category',
            boundaryGap : false,
            axisLine: {onZero: false},
            data : []
        },
        {
            type : 'category',
            gridIndex: 1,
            boundaryGap : false,
            axisLine: {onZero: false},
            data : []
        },
    ],
    yAxis: [
        {
            name: '路段数',
            type: 'value',
            // max: 500
        },
        {
            name: '路段数',
            max: 85,
            gridIndex: 1,
            type: 'value'
        }
    ],
    series: [
        {
            name:'路段数（按节点统计）',
            type:'line',
            animation: false,
            areaStyle: {
                normal: {}
            },
            lineStyle: {
                normal: {
                    width: 1
                }
            },
            // markArea: {
            //     silent: true,
            //     data: [[{
            //         xAxis: '2009/9/12\n7:00'
            //     }, {
            //         xAxis: '2009/9/22\n7:00'
            //     }]]
            // },
            data:[]
        },
        {
            name:'路段数（按长度统计）',
            type:'scatter',
            xAxisIndex:1,
            yAxisIndex:1,
            animation: false,
            symbolSize: 5,
            // areaStyle: {
            //     normal: {}
            // },
            lineStyle: {
                normal: {
                    width: 1
                }
            },
            // markArea: {
            //     silent: true,
            //     data: [[{
            //         xAxis: '2009/9/10\n7:00'
            //     }, {
            //         xAxis: '2009/9/20\n7:00'
            //     }]]
            // },
            data: []
        }
    ]
};
