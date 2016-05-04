
//April Seattle 911 Calls (depending on time zone, will actually start/end before/after April)
//https://data.seattle.gov/resource/grwu-wqtk.json?$where=Datetime%3E%272016-04-1T00:00:00%27%20AND%20DateTime%20%3C%20%272016-05-1T00:00:00%27&$order=Datetime%20asc&$limit=50000
(function (app) {
  "use strict";

  var speed = 1,
    paused = false,
    startTime = new Date();

  var pullData = function(callback) {
    d3.json("data/seattle911Calls.json", function (err, data){
      if (err) return console.warn(err);

      callback(data.map(function (val) {
        val.date = new Date(val.datetime);

        return val;
      }));
    })
  }

  var startClockCycle = function(data) {
    console.log(data.slice(0, 10));

    startTime = data[0].date;

    //Fire initial blob here
    var removedItem = data.splice(0, 1);

    setInterval(function(){
      if (!paused) {
        //redraw blobs and histogram (TODO)
        startTime.setSeconds(startTime.getSeconds() + (1 * speed))

        var newestItemIndex = null;

        for (var i = 0; i < data.length; i++) {
          if (data[i].date < startTime) {
            newestItemIndex = i;
          }
        }

        var removedItems = [];

        if (newestItemIndex !== null) {
          removedItems = data.splice(0, newestItemIndex + 1);
        }

        console.log(startTime, speed, removedItems);
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