/**
 * Created by pougin on 2017/11/12.
 */

var RawGeoJSON={}
    , highwayLayers={}
    , highwayData={}
    , map
    , linkData={}
    , linkLayer;

var geoStyle = {
    trunk: {
        color:'#992ab9',
        weight: 5,
        opacity:1
    },
    trunk_link: {
        color:'#992ab9',
        weight: 5,
        opacity:0.8
    },
    motorway: {
        color:'#992ab9',
        weight: 5,
        opacity:1
    },
    motorway_link: {
        color:'#992ab9',
        weight: 5,
        opacity:0.8
    },
    primary: {
        color:'#992ab9',
        weight: 5,
        opacity:1
    },
    primary_link: {
        color:'#992ab9',
        weight: 5,
        opacity:1
    },
    secondary: {
        color:'#dfa019',
        weight: 4,
        opacity:0.8
    },
    secondary_link: {
        color:'#dfa019',
        weight: 4,
        opacity:0.8
    },
    tertiary: {
        color:'#39da23',
        weight: 4,
        opacity:0.8
    },
    tertiary_link: {
        color:'#39da23',
        weight: 4,
        opacity:0.8
    },
};

$(document).ready(function () {
    // 首先把chart满屏
    $('#map').height($(window).height()).width($(window).width()-204);

    // 显示地图 116.6207612,39.9138927
    map = L.map('map').setView([39.9138927, 116.6207612], 13);
    // L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    //     attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    // }).addTo(map);
    // L.geoJSON(data).addTo(map);

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="http://mapbox.com">Mapbox</a>',
        id: 'mapbox.light'
    }).addTo(map);
    L.geoJSON({
        "type": "Feature",
        "properties": {
            "name": "Coors Field",
            "amenity": "Baseball Stadium",
            "popupContent": "This is where the Rockies play!"
        },
        "geometry": {
            "type": "Point",
            "coordinates": [116.6207612,39.9138927]
        }
    }).addTo(map);




    // 做一个geoJSON图层
    // var geoLayer= L.geoJSON().addTo(map);

    var Counter={
        highway_members:{},
        z_order_members:{},
        geometry_types:{}
    };

    // var HighwayJSON={};

    $.getJSON('bj_demo/bj1.geojson', function (data) {
        RawGeoJSON=data;

        // 1 查看数据情况
        console.log(data.features.length);
        $.each(data.features, function (index, item) {
            // L.geoJSON(item).addTo(map);

            _item=Counter.geometry_types;
            if(_item.hasOwnProperty(item.geometry.type)){
                _item[item.geometry.type]++;
            } else{
                _item[item.geometry.type]=1;
            }

            // console.log(index+': '+item.properties.osm_id);
            $.each(item.properties, function (k, v) {
               if(Counter.hasOwnProperty(k)){
                   Counter[k]++;
               } else{
                   Counter[k]=1;
               }
               if(k=='highway' || k=='z_order'){
                   _item=Counter[k+'_members'];
                   if(_item.hasOwnProperty(v)){
                       _item[v]++;
                   } else{
                       _item[v]=1;
                   }
               }
               if (k=='highway'){
                   if(! highwayData.hasOwnProperty(v)){
                       highwayData[v]=[];
                   }
                   highwayData[v].push(item);

                   // 每一个item都做成一个layer，并存到highwayLayers里面
                   if(! highwayLayers.hasOwnProperty(v)){
                       // highwayLayers[v]=L.geoJSON(null,{style:style});
                       highwayLayers[v]=[];
                   }
                   var style=geoStyle.hasOwnProperty(v)?geoStyle[v]:{};
                   var newLayer=L.geoJSON(item,{style:style}).bindPopup(function (layer) {
                       console.log(layer.feature.geometry.coordinates);
                       return getPropertiesList(layer.feature);
                   });
                   newLayer.on({
                       mouseover: function (event) {
                           // console.log(layer);
                           event.layer.setStyle({color:'#ff0000'});
                           event.layer.pointsLayer=getPointsLayer(event.layer.feature.geometry.coordinates);
                           event.layer.pointsLayer.addTo(map);
                       },
                       mouseout: function (event) {
                           // console.log(event);
                           newLayer.resetStyle(event.layer);
                           if(event.layer.pointsLayer){
                               event.layer.pointsLayer.removeFrom(map);
                           }
                       }
                   });
                   highwayLayers[v].push(newLayer);
               }
            });
        });
        console.log(Counter);
        // console.log(highwayLayers['primary']);

        // highwayLayers['primary'].addTo(map);
        // highwayLayers['primary'].removeFrom(map);

        $.each(sortObject(Counter.highway_members), function (k, v) {
            $('.highway-list').append($('<a class="list" href="#" />').click(function () {
                if($(this).hasClass('selected'))
                    $(this).removeClass('selected');
                else
                    $(this).addClass('selected');

                reRender();
            }).data({'highway': k}).text(k+' : '+v));
            // 把关注的部分标注为准备显示
            if(geoStyle.hasOwnProperty(k)){
                $('.highway-list a:last').addClass('selected');
            }
        });
        //add a global controller
        $('<a href="#">SHOW ALL</a>').click(function () {
            if($(this).hasClass('selected')){
                $(this).removeClass('selected').text('SHOW ALL');
                $('.highway-list .list').removeClass('selected');
            }else {
                $(this).addClass('selected').text('HIDE ALL');
                $('.highway-list .list').addClass('selected');
            }

            reRender();
        }).prependTo($('.highway-list'));

        reRender();
    });


    // 加载Link数据并显示
    $.getJSON('bj_demo/link.geojson', function (data) {
        linkData=data;
        linkLayer=L.geoJson(data,{style:{
            color:'#000000',
            weight: 5,
            opacity:0.5
        }}).bindPopup(function (layer) {
            return getPropertiesList(layer.feature);
        });
        linkLayer.on({
            mouseover: function (event) {
                // console.log(layer);
                event.layer.setStyle({color:'#0000ff'});
                event.layer.pointsLayer=getPointsLayer(event.layer.feature.geometry.coordinates);
                event.layer.pointsLayer.addTo(map);
            },
            mouseout: function (event) {
                // console.log(event);
                linkLayer.resetStyle(event.layer);
                if(event.layer.pointsLayer){
                    event.layer.pointsLayer.removeFrom(map);
                }
            }
        });

        $('<a href="#">显示LINK</a>').click(function () {
            if($(this).hasClass('selected')){
                $(this).removeClass('selected').text('显示LINK');
                linkLayer.removeFrom(map);
            }else {
                $(this).addClass('selected').text('隐藏LINK');
                linkLayer.addTo(map);
            }
        }).prependTo($('.link-controller'));
    });
});

// 把LineString的一系列
function getPointsLayer(coordinates) {
    var features=[];
    $.each(coordinates, function (i, v) {
        features.push({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": v
            }
        });
    });

    return L.geoJSON(features,  {
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, {
                radius: 8,
                fillColor: "#ff7800",
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            })
        }
    });
}


function getPropertiesList(item) {
    var data='';
    $.each(item.properties, function (k, v) {
        data = data + k + ': ' + v +'<br>';
    });

    data= JSON.stringify(data + item.geometry.coordinates[0]);
    return data;
}

function reRender() {
    $('.highway-list .list').each(function () {
        if($(this).hasClass('selected')){
            $.each(highwayLayers[$(this).data('highway')], function (index, layer) {
                layer.addTo(map);
            });
            // highwayLayers[$(this).data('highway')].addTo(map);
        }else{
            $.each(highwayLayers[$(this).data('highway')], function (index, layer) {
                layer.removeFrom(map);
            })
            // highwayLayers[$(this).data('highway')].removeFrom(map);
        }
    });
}


// sort an object by key
function sortObject(o) {
    var sorted = {},
        key, a = [];

    for (key in o) {
        if (o.hasOwnProperty(key)) {
            a.push(key);
        }
    }

    a.sort();

    for (key = 0; key < a.length; key++) {
        sorted[a[key]] = o[a[key]];
    }
    return sorted;
}