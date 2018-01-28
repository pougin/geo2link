<?php
/**
 * 读取geoJSON文件，生产link
 */
require_once __DIR__.'/../vendor/autoload.php';

use Location\Coordinate;
use Location\Polyline;
use Location\Distance\Vincenty;

// 点，所有出现在系统中的点。key=lat:lng, value=[line_id]
$Point = array();

// 线条，直接对应于geoJSON里面的lineString，key=osm:{$osm_id}，value=(array)lineString feature
$Line = array();

// 端点, key=lat:lng，value=[line_id]
$EndPoint = array();

// 交点，key=lat:lng，value=[line_id]
$IntersectionPoint = array();

// 路段，[id=>{start=>[lat,lng], end=>[lat,lng], path=[point], line_id=>string, length=>int(in metres)
//  downstream=[link_id], upstream=[link_id], nodeCount=>sizeof(lineString)}]。id 自增
$Link = array();
$LinkIndex = array(
    // key=lat:lng, value=[link_id]
    'start' => array(),
    // key=lat:lng
    'end' => array()
);

// 统计信息
$Statistics = array(
    'nodeCount'=>array(),
    'meterCount'=>array()
);

$raw = json_decode(file_get_contents('../bj_demo/bj1.geojson'), true);

// 生产 Point & Line & EndPoint
foreach ($raw['features'] as $v) {
    // 只处理公路
    if (! isset($v['properties']['highway'])) {
        continue;
    }
    
    $line_id = 'osm:' . $v['properties']['osm_id'];
    
    // 添加线条
    $Line[$line_id] = $v;
    
    // 添加点
    foreach ($v['geometry']['coordinates'] as $p) {
        addPoint($p, $line_id, $Point);
    }
    
    // 添加端点
    $start = $v['geometry']['coordinates'][0];
    $end = $v['geometry']['coordinates'][0];
    addPoint($start, $line_id, $EndPoint);
    addPoint($end, $line_id, $EndPoint);
}
unset($raw);

echo "原始数据录入，处理结果：\n" . "\t" . sizeof($Line) . " 线条录入\n" . "\t" . sizeof($Point) . " 节点录入\n" . "\t" . sizeof($EndPoint) . " 端点录入\n";

// 生产 IntersectionPoint
foreach ($Point as $k => $v) {
    if (sizeof($v) > 1) {
        $IntersectionPoint[$k] = $v;
    }
}

echo "\t" . sizeof($IntersectionPoint) . " 交点录入\n";

// 生产 Link
foreach ($Line as $k => $v) {
    $nodes = $v['geometry']['coordinates'];
    
    $a = $nodes[0];
    $l = sizeof($nodes);
    $points = array(
        0 => $a
    );
    // $points[]=$a;
    for ($i = 1; $i < $l; $i ++) {
        $b = $nodes[$i];
        $points[] = $b;
        
        // b是终点，直接结束
        if ($i == $l - 1) {
            addLink($a, $b, $points, $k);
            break;
        }
        
        // b是这条线的交点，添加link，并重置$a, $points
        $key = "{$b[0]}:{$b[1]}";
        if (isset($IntersectionPoint[$key]) && in_array($k, $IntersectionPoint[$key])) {
            addLink($a, $b, $points, $k);
            // 重置
            $a = $b;
            $points = array(
                0 => $a
            );
        }
        
        // b不是终点也不是交点，什么也不做
    }
}

// TODO 去掉所有非目标等级道路的路段
echo "\t" . sizeof($Link) . " 路段录入\n";

// 生产 $LinkIndex，方便后续处理upstream，downstream
foreach ($Link as $k => $v) {
    $start_key = "{$v['start'][0]}:{$v['start'][1]}";
    if (! isset($LinkIndex['start'][$start_key])) {
        $LinkIndex['start'][$start_key] = array();
    }
    $LinkIndex['start'][$start_key][] = $k;
    
    $end_key = "{$v['end'][0]}:{$v['end'][1]}";
    if (! isset($LinkIndex['end'][$end_key])) {
        $LinkIndex['end'][$end_key] = array();
    }
    $LinkIndex['end'][$end_key][] = $k;
}

echo "\t成功建立LinkIndex\n";

// 补完Link 信息： upstream，downStream，nodeCount
foreach ($Link as $k => & $v) {
    // nodeCount
    $count = sizeof($v['path']);
    $v['nodeCount'] = $count;
    
    // length
    $v['length'] = getPathLength($v['path']);
    $length=round($v['length']);
    
    // 更新统计数
    if (! isset($Statistics['nodeCount']["{$count}"])) {
        $Statistics['nodeCount']["{$count}"] = 0;
    }
    $Statistics['nodeCount']["{$count}"] ++;
    if (! isset($Statistics['meterCount']["{$length}"])) {
        $Statistics['meterCount']["{$length}"] = 0;
    }
    $Statistics['meterCount']["{$length}"] ++;
    
    $start_key = "{$v['start'][0]}:{$v['start'][1]}";
    if (isset($LinkIndex['end'][$start_key])) {
        $v['upstream'] = $LinkIndex['end'][$start_key];
    } else {
        $v['upstream'] = array();
    }
    
    $end_key = "{$v['end'][0]}:{$v['end'][1]}";
    if (isset($LinkIndex['start'][$end_key])) {
        $v['downstream'] = $LinkIndex['start'][$end_key];
    } else {
        $v['downstream'] = array();
    }
}

// 排序 $Statistics
ksort($Statistics['nodeCount']);
ksort($Statistics['meterCount']);

echo "\t成功建立Link上下游关系\n";

// var_dump($Statistics);

// 所有Link输出为geoJSON
$OutputGeoJSON=array(
    "type"=> "FeatureCollection",
    'name'=>'Links for Beijing',
    'features'=>array()
);
foreach ($Link as $k => & $v) {
    $OutputGeoJSON['features'][]=array(
        "type"=> "Feature",
        "properties"=>array(
            'id'=>$k,
            'length'=>$v['length'],
            'downstream'=>json_encode($v['downstream']),
            'upstream'=>json_encode($v['upstream'])
        ),
        "geometry"=>array(
            "type"=> "LineString", 
            "coordinates"=> $v['path']
        )
    );
}
file_put_contents('../bj_demo/link.geojson', json_encode($OutputGeoJSON));
file_put_contents('../bj_demo/stat.json', json_encode($Statistics));

/**
 * 获得路径长度，单位 米
 */
function getPathLength($path){
    $track = new Polyline();
    foreach ($path as $v){
        $track->addPoint(new Coordinate($v[1], $v[0]));
    }
    
    return $track->getLength(new Vincenty());
}

/**
 * 添加一个link
 */
function addLink($a, $b, $points, $link_id)
{
    global $Link;
    
    $Link[] = array(
        'start' => $a,
        'end' => $b,
        'path' => $points,
        'line_id' => $link_id
    );
}

/*
 * 把一个点加入数组，并关联线条
 */
function addPoint($point, $line_id, & $object)
{
    $key = "{$point[0]}:{$point[1]}";
    if (! isset($object[$key])) {
        $object[$key] = array();
    }
    
    if (! in_array($line_id, $object[$key])) {
        $object[$key][] = $line_id;
    }
}






