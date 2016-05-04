
//April Seattle 911 Calls (depending on time zone, will actually start/end before/after April)
//https://data.seattle.gov/resource/grwu-wqtk.json?$where=Datetime%3E%272016-04-1T00:00:00%27%20AND%20DateTime%20%3C%20%272016-05-1T00:00:00%27&$order=Datetime%20asc&$limit=50000


var speed = 1,
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

var startClockCycle = function (data) {
  console.log(data.slice(0, 10));

  startTime = data[0].date;

  setInterval(function(){
    //redraw blobs and histogram (TODO)
    startTime.setSeconds(startTime.getSeconds() + (1 * speed))

    console.log(startTime);
  }, 1000);
}

function increaseSpeed() {
  speed *= 10;
}


pullData(startClockCycle);