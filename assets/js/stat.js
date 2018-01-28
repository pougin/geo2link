/**
 * Created by pougin on 2017/11/16.
 */
$(document).ready(function () {
    // 首先把chart满屏
    $('#chart').height($(window).height()).width($(window).width());
    var chart = echarts.init($('#chart').get(0));

    console.log(option);

    $.getJSON('bj_demo/stat.json', function (data) {
        $.each(data['nodeCount'], function (k, v) {
            option.xAxis[0].data.push(k);
            option.series[0].data.push(v);
        });
        $.each(data['meterCount'], function (k, v) {
            option.xAxis[1].data.push(k);
            option.series[1].data.push(v);
        });

        chart.setOption(option);
    });
});