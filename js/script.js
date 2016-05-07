//Found here originally
//https://www.data.gov/highlights/
//Full data
//https://data.seattle.gov/Public-Safety/Seattle-Real-Time-Fire-911-Calls/kzjm-xkqj
//April Seattle 911 Calls (depending on time zone, will actually start/end before/after April)
//https://data.seattle.gov/resource/grwu-wqtk.json?$where=Datetime%3E%272016-04-1T00:00:00%27%20AND%20DateTime%20%3C%20%272016-05-1T00:00:00%27&$order=Datetime%20asc&$limit=50000

(function (app, window, d3, undefined) {
  "use strict";

  var speed = 1000,
    cycleTime = 500,
    paused = false,
    currentTime = new Date(),
    displayedData = [],
    newestItems = [],
    //setup bar chart
    margin = {top: 20, right: 20, bottom: 30, left: 40},
    width,
    height,
    colorScale = d3.scale.category20(),
    canvas = d3.select('#barChart')
      .append('svg'),
    chart = canvas.append('g')
      .attr("transform", "translate(200,0)")
      .attr('id','bars'),
    yAxisElement = canvas.append('g')
      .attr("transform", "translate(200,10)")
      .attr('id','yaxis'),
    //setup bubble chart
    bubbleWidth,
    bubbleHeight,
    bubbleCanvas = d3.select('#bubbleChart')
      .append('svg'),
    bubbleChart = bubbleCanvas.append('g')
      .attr('id','bubbles');

  var pullData = function(callback) {
    d3.json("data/seattle911Calls.json", function (err, data){
      if (err) return console.warn(err);

      callback(data.map(function (val) {
        val.date = new Date(val.datetime); //Create a real date object to use in the app

        return val;
      }));
    })
  };

  //Update
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
        .range([0,width - 200 - 50]), //Remove the left offset and add padding for labels
      yscale = d3.scale.linear()
        .domain([0,types.length])
        .range([0,height]),
      yAxis = d3.svg.axis(),
      rects = chart.selectAll('rect')
        .data(typeCounts), //Update type data
      texts = d3.select('#bars')
        .selectAll('text')
        .data(typeCounts),
      barHeight = height / types.length;

    //Set up the yaxis defaults
    yAxis
      .orient('left')
      .scale(yscale)
      .tickSize(0)
      .tickFormat(function(d,i){ return types[i]; })
      .tickValues(d3.range(types.length));

    //Move the y axis element around
    yAxisElement
      .transition()
      .duration(cycleTime)
      .ease("quad") 
      .call(yAxis);

    //Set up new bars for new types
    rects
      .enter()
      .append('rect')
      .attr({
        fill: function (d, i) { return colorScale(i); },
        class: "bar",
        y: function (d, i) { return yscale(i + 1); }
      });

    //Update existing types size/position
    rects
      .transition()
      .duration(cycleTime)
      .ease("quad")
      .attr({
        height: barHeight,
        width: function(d) { return xscale(d); },
        y: function(d,i){ return yscale(i); }
      });

    //Set up new bar labels
    texts
      .enter()
      .append('text')
      .attr("class", "bar-label");

    //Update existing text element values and positions
    texts
      .transition()
      .duration(cycleTime)
      .ease("quad")
      .text(function(d){ return d; })
      .attr({
        x:function(d) { return xscale(d)+10; },
        //y:function(d,i){ return yscale(i)+ ((barHeight)/2) - 7; }
        y:function(d,i){ return yscale(i)+ ((barHeight - 20)/2) + 14; }
      });

    //Bubble chart
    var newTypes = newestItems
        .map(function (item) { return item.type })
        .filter(function(item, i, ar){ return ar.indexOf(item) === i; }), //Find any unique new types
      circles = bubbleChart.selectAll("circle.bubble")
        .data(newTypes); //Add new types of data

    circles.enter().append("circle") //Add new circles in a random spot with the same color as the bar chart types
      .attr({
        cy: function () { return Math.floor(Math.random() * (bubbleHeight - 100)) + 50; },
        cx: function () { return Math.floor(Math.random() * (bubbleWidth - 100)) + 50; },
        r: 0,
        fill: function (d, i) { return colorScale(types.indexOf(d)); }
      })
      .style("opacity", 1)
      .transition() //Make the circle get bigger and fade out over a random period of time
      .delay(function () { return Math.floor(Math.random() * (200)); })
      .duration(function () { return Math.floor(Math.random() * (2000 - 800)) + 800; })
      .attr("r", 50)
      .style("opacity", 0)
      .remove(); //Remove the circle once the transition is over
      //TODO: Maybe make the radius dependent on how many new items this cycle
      //.attr("r", function(d) { return Math.sqrt(d); });
  };

  var resizeChart = function () {
    //Bar Chart
    width = parseInt(d3.select('#barChart').style("width"), 10) - margin.left - margin.right;
    height = parseInt(d3.select('#barChart').style("height"), 10) - margin.top - margin.bottom;

    canvas.attr({'width':width,'height':height});

    //Bubble Chart
    bubbleWidth = parseInt(d3.select('#bubbleChart').style("width"), 10) - margin.left - margin.right;
    bubbleHeight = parseInt(d3.select('#bubbleChart').style("height"), 10) - margin.top - margin.bottom;

    bubbleCanvas.attr({'width': bubbleWidth,'height': bubbleHeight});

    redrawChart();
  };

  var startClockCycle = function(data) {
    currentTime = data[0].date; //Just start the time off with the first element

    //Fire initial blob here
    var removedItem = data.splice(0, 1);

    newestItems = removedItem;

    displayedData = displayedData.concat(removedItem);

    resizeChart();
    app.updateDisplay();

    var intervalHandle = setInterval(function(){
      if (!paused) {
        currentTime.setMilliseconds(currentTime.getMilliseconds() + (cycleTime * speed)) //Single tick

        var newestItemIndex = null;

        for (var i = 0; i < data.length; i++) {
          if (data[i].date < currentTime) {
            newestItemIndex = i;
          }
          else {
            break; //Exit out for performance after finding a date after the current time
          }
        }

        newestItems = [];

        if (newestItemIndex !== null) {
          newestItems = data.splice(0, newestItemIndex + 1);
        }

        displayedData = displayedData.concat(newestItems);

        //console.log(currentTime, speed, newestItems);

        redrawChart(); //Update the charts

        if (!data.length) { //Out of data, end the clock
          d3.select(".data-over")
            .classed("hide", false);

          if (newestItems.length) {
            currentTime = newestItems[newestItems.length - 1].date; //Set final time
          }

          //Unload work
          clearInterval(intervalHandle);
          newestItems = [];
        }

        app.updateDisplay();
      }
    }, cycleTime);
  };

  app.updateDisplay = function () {
    d3.select(".time-display")
      .text(currentTime);

    d3.select(".speed-display")
      .text(speed + "x");

    d3.select(".pause i")
      .classed("fa-pause", !paused).classed("fa-play", paused);
  };

  app.increaseSpeed = function () {
    if (speed < 1000000) {
      speed *= 10;
    }

    app.updateDisplay();
  };

  app.decreaseSpeed = function () {
    if (speed > 1) {
      speed /= 10;
    }

    app.updateDisplay();
  };

  app.pause = function () {
    paused = !paused;

    app.updateDisplay();
  };

  app.bindHandlers = function () {
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
  };

  app.bindHandlers();
  pullData(startClockCycle);

})(window.app = window.app || {}, window, d3);