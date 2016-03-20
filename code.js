var API_PATH = "http://api.perthtransit.com/1";
var STATION = "city-west";

function parseTime(timeString) {    
    if (timeString == '') return null;

    var time = timeString.match(/(\d+)(:(\d\d))?\s*(p?)/i); 
    if (time == null) return null;

    var hours = parseInt(time[1],10);    
    if (hours == 12 && !time[4]) {
          hours = 0;
    }
    else {
        hours += (hours < 12 && time[4])? 12 : 0;
    }   
    var d = new Date();             
    d.setHours(hours);
    d.setMinutes(parseInt(time[3],10) || 0);
    d.setSeconds(0, 0);  
	
	var difference = d - (new Date());
	if (difference < -120000) { // If it is more than 2 minutes in the past
		d.setDate(d.getDate() + 1); // It is actually in the future
	}
	
    return d;
}

function updateTimes() {
	$('time.countdown').each(function(i, v) {
		var time = parseTime($(this).attr('time'));
		var minutesRemaining = Math.floor((time - (new Date())) / 60000);
		
		if (minutesRemaining <= 0) {
			$(this).text('0');
			$(this).closest("tr").addClass("leaving");
		} else {
			$(this).text(minutesRemaining);
		}
	});
}

function renderTrains() {
	$.getJSON(API_PATH + "/train_stations/" + STATION + "?callback=?", function(data) {
		var container = $('<table id="timetable"></table>');
		var curTime = new Date();
		
		for (entry of data['response']['times']) {
			var time = entry['time'];
			var minutesRemaining = Math.floor((parseTime(time) - (new Date())) / 60000);
			if (minutesRemaining < 0) {
				minutesRemaining = 0;
			}
			var direction = entry['line'];
			var pattern = entry['pattern'];
			if (pattern === null) {
				pattern = "All";
			}
			var onTime = entry['on_time'];
			
			var row;
			var late = '';
			
			if (onTime) {
				row = "<tr class='ontime'>";
			} else {
				row = "<tr class='late'>";
				late = '<i class="fa fa-exclamation-triangle"></i>';
				
				var rgx = /(\d+) min delay/i;
				var match = rgx.exec(entry['status']);
				
				if (match != null) {
					late += '<span class="info">+' + match[1] + '</span>';
				} else {
					late += '<span class="info">' + entry['status'] + '</span>';
				}
			}
			
			row += "<td><time class='countdown' time='" + time + "'>"+minutesRemaining+"</time></td><td>" + late + "</td><td>" + direction + "</td><td>" + pattern + "</td></tr>";
			container.append(row);
		}
		
		$('#timetable').remove();
		$('body').append(container);
	});
}

setInterval(renderTrains, 60000);
setInterval(updateTimes, 5000);

renderTrains();