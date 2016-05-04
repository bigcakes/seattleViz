
//April Seattle 911 Calls (depending on time zone, will actually start/end before/after April)
//https://data.seattle.gov/resource/grwu-wqtk.json?$where=Datetime%3E%272016-04-1T00:00:00%27%20AND%20DateTime%20%3C%20%272016-05-1T00:00:00%27&$order=Datetime%20asc&$limit=50000
(function (app) {
  "use strict";

  var speed = 1,
    paused = false,
    startTime = new Date(),
    displayedData = [];

  var pullData = function(callback) {
    d3.json("data/seattle911Calls.json", function (err, data){
      if (err) return console.warn(err);

      callback(data.map(function (val) {
        val.date = new Date(val.datetime);

        return val;
      }));
    })
  }



  var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = parseInt(d3.select('#chart').style("width"), 10) - margin.left - margin.right,
    height = parseInt(d3.select('#chart').style("height"), 10) - margin.top - margin.bottom;

  var colors = ['#3182bd','#6baed6','#9ecae1','#c6dbef','#e6550d','#fd8d3c','#fdae6b','#fdd0a2','#31a354','#74c476','#a1d99b','#c7e9c0','#756bb1','#9e9ac8','#bcbddc','#dadaeb', '636363', '969696', 'bdbdbd', 'd9d9d9'];


  var canvas = d3.select('#chart')
    .append('svg')
    .attr({'width':width,'height':height});

  var chart = canvas.append('g')
    .attr("transform", "translate(150,0)")
    .attr('id','bars');

  var redrawChart = function () {
    var types = displayedData
      .map(function (item) { return item.type })
      .filter(function(item, i, ar){ return ar.indexOf(item) === i; });

    var typeCounts = [];

    for (var i = 0; i < types.length; i++) {
      typeCounts.push(
        displayedData.filter(function (item) { return item.type === types[i]; }).length
      );
    }

    var maxCount = Math.max(...typeCounts);

    var xscale = d3.scale.linear()
      .domain([0,maxCount])
      .range([0,width]); //TODO: Add margin

    var yscale = d3.scale.linear()
      .domain([0,types.length])
      .range([0,height]);

    var colorScale = d3.scale.quantize()
      .domain([0, types.length])
      .range(colors);

    //TODO: Fix axis moving around
    var yAxis = d3.svg.axis();
    yAxis
      .orient('left')
      .scale(yscale)
      .tickSize(2)
      .tickFormat(function(d,i){ return types[i]; })
      .tickValues(d3.range(17));

    var y_xis = canvas.append('g')
      .attr("transform", "translate(150,0)")
      .attr('id','yaxis')
      .call(yAxis);

    //var myColors = d3.scale.category20c();
    chart.selectAll('rect')
      .data(typeCounts)
      .enter()
      .append('rect')
      .attr({
        x: 0,
        fill: function(d,i){ return colorScale(i); }
      });
      //.attr({x:0,y:function(d,i){ return yscale(i)+19; }, fill: myColors});
      //.style('fill',function(d,i){ return colorScale(i); })
      //.attr('width',function(d){ return 0; });

    var transit = d3.select("svg").selectAll("rect")
      .data(typeCounts)
      .transition()
      .duration(1000) 
      .attr({
        height: height / types.length,
        width: function(d) { return xscale(d); },
        y: function(d,i){ return yscale(i)+19; }
      });

    var transitext = d3.select('#bars')
      .selectAll('text')
      .data(typeCounts)
      .enter()
      .append('text')
      .text(function(d){ return d; })
      .attr({
        x:function(d) { return xscale(d)-50; },
        y:function(d,i){ return yscale(i)+35; }
      })
      .style({'fill':'#fff','font-size':'16px'});
  }

  var startClockCycle = function(data) {
    startTime = data[0].date;

    //Fire initial blob here
    var removedItem = data.splice(0, 1);

    displayedData = displayedData.concat(removedItem);

    setInterval(function(){
      if (!paused) {
        //redraw blobs and histogram (TODO)
        startTime.setSeconds(startTime.getSeconds() + (1 * speed))

        var newestItemIndex = null;

        for (var i = 0; i < data.length; i++) {
          if (data[i].date < startTime) {
            newestItemIndex = i;
          }
          else {
            break;
          }
        }

        var removedItems = [];

        if (newestItemIndex !== null) {
          removedItems = data.splice(0, newestItemIndex + 1);
        }

        displayedData = displayedData.concat(removedItems);

        console.log(startTime, speed, removedItems);

        //if (displayedData.length === 5 || displayedData === 6) {
          redrawChart();
        //}
      }
    }, 1000);
  }

  app.increaseSpeed = function() {
    speed *= 10;
  }

  app.decreaseSpeed = function() {
    speed /= 10;
  }

  app.pause = function() {
    paused = !paused;
  }

  pullData(startClockCycle);

})(window.app = window.app || {});