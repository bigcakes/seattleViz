//Found here originally
//https://www.data.gov/highlights/
//Full data
//https://data.seattle.gov/Public-Safety/Seattle-Real-Time-Fire-911-Calls/kzjm-xkqj
//April Seattle 911 Calls (depending on time zone, will actually start/end before/after April)
//https://data.seattle.gov/resource/grwu-wqtk.json?$where=Datetime%3E%272016-04-1T00:00:00%27%20AND%20DateTime%20%3C%20%272016-05-1T00:00:00%27&$order=Datetime%20asc&$limit=50000

(function (app) {
  "use strict";

  var speed = 1,
    paused = false,
    startTime = new Date(),
    displayedData = [],
    newestItems = [];

  var pullData = function(callback) {
    d3.json("data/seattle911Calls.json", function (err, data){
      if (err) return console.warn(err);

      callback(data.map(function (val) {
        val.date = new Date(val.datetime);

        return val;
      }));
    })
  }


  //setup bar chart
  var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = parseInt(d3.select('#barChart').style("width"), 10) - margin.left - margin.right,
    height = parseInt(d3.select('#barChart').style("height"), 10) - margin.top - margin.bottom;

  var colors = ['#3182bd','#6baed6','#9ecae1','#c6dbef','#e6550d','#fd8d3c','#fdae6b','#fdd0a2','#31a354','#74c476','#a1d99b','#c7e9c0','#756bb1','#9e9ac8','#bcbddc','#dadaeb', '636363', '969696', 'bdbdbd', 'd9d9d9'];
  var colorScale = d3.scale.category20();

  var canvas = d3.select('#barChart')
    .append('svg')
    .attr({'width':width,'height':height});

  var chart = canvas.append('g')
    .attr("transform", "translate(150,0)")
    .attr('id','bars');

  var yAxisElement = canvas.append('g')
    .attr("transform", "translate(150,10)")
    .attr('id','yaxis');

  //setup bubble chart
  var bubbleWidth = parseInt(d3.select('#bubbleChart').style("width"), 10) - margin.left - margin.right,
    bubbleHeight = parseInt(d3.select('#bubbleChart').style("height"), 10) - margin.top - margin.bottom;

  var bubbleCanvas = d3.select('#bubbleChart')
    .append('svg')
    .attr({'width': bubbleWidth,'height': bubbleHeight});

  var bubbleChart = bubbleCanvas.append('g')
    .attr('id','bubbles');


  //update
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

    var maxCount = d3.max(typeCounts);

    //Bar chart
    var xscale = d3.scale.linear()
      .domain([0,maxCount])
      .range([0,width - 150 - 50]); //Remove the left offset and add padding for labels

    var yscale = d3.scale.linear()
      .domain([0,types.length])
      .range([0,height]);

    var yAxis = d3.svg.axis();
    yAxis
      .orient('left')
      .scale(yscale)
      .tickSize(1)
      .tickFormat(function(d,i){ return types[i]; })
      .tickValues(d3.range(types.length));

    var y_xis = yAxisElement
      .transition()
      .duration(1000)
      .ease("quad") 
      .call(yAxis);

    var rects = chart.selectAll('rect')
      .data(typeCounts);

    rects
      .enter()
      .append('rect')
      .attr({
        fill: function (d, i) { return colorScale(i); },
        class: "bar",
        y: function (d, i) { return yscale(i + 1); }
      });

    rects
      .transition()
      .duration(1000)
      .ease("quad")
      .attr({
        height: height / types.length,
        width: function(d) { return xscale(d); },
        y: function(d,i){ return yscale(i); }
      });

    var texts = d3.select('#bars')
      .selectAll('text')
      .data(typeCounts);

    texts
      .enter()
      .append('text')
      .attr("class", "bar-label");

    texts
      .transition()
      .duration(1000)
      .ease("quad")
      .text(function(d){ return d; })
      .attr({
        x:function(d) { return xscale(d)+20; },
        y:function(d,i){ return yscale(i)+16; }
      });


    //Bubble chart
    var newTypes = newestItems
      .map(function (item) { return item.type })
      .filter(function(item, i, ar){ return ar.indexOf(item) === i; });

    var circles = bubbleChart.selectAll("circle.bubble")
      .data(newTypes);

    circles.enter().append("circle")
      .attr({
        //cy: 60,
        //cx: function(d, i) { return i * 100 + 30; },
        cy: function () { return Math.floor(Math.random() * (bubbleHeight - 100)) + 50; },
        cx: function () { return Math.floor(Math.random() * (bubbleWidth - 100)) + 50; },
        r: 0,
        fill: function (d, i) { return colorScale(types.indexOf(d)); }
      })
      .style("opacity", 1)
      .transition()
      .delay(function () { return Math.floor(Math.random() * (200)); })
      .duration(function () { return Math.floor(Math.random() * (2000 - 400)) + 400; })
      .attr("r", 50)
      .style("opacity", 0)
      .remove()
      //TODO: Maybe make the radius dependent on how many new items this cycle
      //.attr("r", function(d) { return Math.sqrt(d); });

    //circles.exit().remove();
  }

  var startClockCycle = function(data) {
    startTime = data[0].date;

    //Fire initial blob here
    var removedItem = data.splice(0, 1);

    newestItems = removedItem;

    displayedData = displayedData.concat(removedItem);

    redrawChart();

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

        newestItems = [];

        if (newestItemIndex !== null) {
          newestItems = data.splice(0, newestItemIndex + 1);
        }

        displayedData = displayedData.concat(newestItems);

        console.log(startTime, speed, newestItems);

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