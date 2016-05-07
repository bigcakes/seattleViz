//Found here originally
//https://www.data.gov/highlights/
//Full data
//https://data.seattle.gov/Public-Safety/Seattle-Real-Time-Fire-911-Calls/kzjm-xkqj
//April Seattle 911 Calls (depending on time zone, will actually start/end before/after April)
//https://data.seattle.gov/resource/grwu-wqtk.json?$where=Datetime%3E%272016-04-1T00:00:00%27%20AND%20DateTime%20%3C%20%272016-05-1T00:00:00%27&$order=Datetime%20asc&$limit=50000

(function (app) {
  "use strict";

  var speed = 1000,
    cycleTime = 500,
    paused = false,
    currentTime = new Date(),
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

  app.updateDisplay = function () {
    d3.select(".time-display")
      .text(currentTime);

    d3.select(".speed-display")
      .text(speed + "x");
  }

  app.increaseSpeed = function () {
    if (speed < 1000000) {
      speed *= 10;
    }
  }

  app.decreaseSpeed = function () {
    if (speed > 1) {
      speed /= 10;
    }
  }

  app.pause = function () {
    paused = !paused;

    d3.select(".pause i")
      .classed("fa-pause", !paused).classed("fa-play", paused);
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
    .attr("transform", "translate(200,0)")
    .attr('id','bars');

  var yAxisElement = canvas.append('g')
    .attr("transform", "translate(200,10)")
    .attr('id','yaxis');

  //setup bubble chart
  var bubbleWidth = parseInt(d3.select('#bubbleChart').style("width"), 10) - margin.left - margin.right,
    bubbleHeight = parseInt(d3.select('#bubbleChart').style("height"), 10) - margin.top - margin.bottom;

  var bubbleCanvas = d3.select('#bubbleChart')
    .append('svg')
    .attr({'width': bubbleWidth,'height': bubbleHeight});

  var bubbleChart = bubbleCanvas.append('g')
    .attr('id','bubbles');

  //TODO: Clean up code duplication
  var resizeChart = function () {
    //bar
    width = parseInt(d3.select('#barChart').style("width"), 10) - margin.left - margin.right;
    height = parseInt(d3.select('#barChart').style("height"), 10) - margin.top - margin.bottom;

    canvas.attr({'width':width,'height':height});

    //bubble
    bubbleWidth = parseInt(d3.select('#bubbleChart').style("width"), 10) - margin.left - margin.right;
    bubbleHeight = parseInt(d3.select('#bubbleChart').style("height"), 10) - margin.top - margin.bottom;

    bubbleCanvas.attr({'width': bubbleWidth,'height': bubbleHeight});

    redrawChart();
  }


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
      .range([0,width - 200 - 50]); //Remove the left offset and add padding for labels

    var yscale = d3.scale.linear()
      .domain([0,types.length])
      .range([0,height]);

    var yAxis = d3.svg.axis();
    yAxis
      .orient('left')
      .scale(yscale)
      .tickSize(0)
      .tickFormat(function(d,i){ return types[i]; })
      .tickValues(d3.range(types.length));

    var y_xis = yAxisElement
      .transition()
      .duration(cycleTime)
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
      .duration(cycleTime)
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
      .duration(cycleTime)
      .ease("quad")
      .text(function(d){ return d; })
      .attr({
        x:function(d) { return xscale(d)+10; },
        y:function(d,i){ return yscale(i)+13; }
      });


    //Bubble chart
    var newTypes = newestItems
      .map(function (item) { return item.type })
      .filter(function(item, i, ar){ return ar.indexOf(item) === i; });

    var circles = bubbleChart.selectAll("circle.bubble")
      .data(newTypes);

    circles.enter().append("circle")
      .attr({
        cy: function () { return Math.floor(Math.random() * (bubbleHeight - 100)) + 50; },
        cx: function () { return Math.floor(Math.random() * (bubbleWidth - 100)) + 50; },
        r: 0,
        fill: function (d, i) { return colorScale(types.indexOf(d)); }
      })
      .style("opacity", 1)
      .transition()
      .delay(function () { return Math.floor(Math.random() * (200)); })
      .duration(function () { return Math.floor(Math.random() * (2000 - 800)) + 800; })
      .attr("r", 50)
      .style("opacity", 0)
      .remove()
      //TODO: Maybe make the radius dependent on how many new items this cycle
      //.attr("r", function(d) { return Math.sqrt(d); });

    //circles.exit().remove();
  }

  var startClockCycle = function(data) {
    currentTime = data[0].date;

    //Fire initial blob here
    var removedItem = data.splice(0, 1);

    newestItems = removedItem;

    displayedData = displayedData.concat(removedItem);

    redrawChart();
    app.updateDisplay();

    var intervalHandle = setInterval(function(){
      if (!paused) {
        //redraw blobs and histogram (TODO)
        currentTime.setMilliseconds(currentTime.getMilliseconds() + (cycleTime * speed))

        var newestItemIndex = null;

        for (var i = 0; i < data.length; i++) {
          if (data[i].date < currentTime) {
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

        console.log(currentTime, speed, newestItems);

        redrawChart();
      }
      
      if (!data.length) {
        d3.select(".data-over")
          .classed("hide", false);

        clearInterval(intervalHandle);
      }
      app.updateDisplay();
    }, cycleTime);
  }

  d3.select(".increase-speed")
    .on("click", function () {
      app.increaseSpeed();
    });

  d3.select(".decrease-speed")
    .on("click", function () {
      app.decreaseSpeed();
    });

  d3.select(".pause")
    .on("click", function () {
      app.pause();
    });

  d3.select(window)
    .on('resize', resizeChart);

  pullData(startClockCycle);

})(window.app = window.app || {});