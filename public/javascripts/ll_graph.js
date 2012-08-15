// /////////////////////////////////////////////////////////////////////
// MOTHER OF ALL CLASSES
/*
 * Simple JavaScript Inheritance By John Resig http://ejohn.org/ MIT Licensed.
 */
// Inspired by base2 and Prototype
(function() {
	var initializing = false, fnTest = /xyz/.test(function() {
				xyz;
			}) ? /\b_super\b/ : /.*/;
	// The base Class implementation (does nothing)
	this.Class = function() {
	};
	// Create a new Class that inherits from this class
	Class.extend = function(prop) {
		var _super = this.prototype;

		// Instantiate a base class (but only create the instance,
		// don't run the init constructor)
		initializing = true;
		var prototype = new this();
		initializing = false;

		// Copy the properties over onto the new prototype
		for (var name in prop) {
			// Check if we're overwriting an existing function
			prototype[name] = typeof prop[name] == "function"
					&& typeof _super[name] == "function"
					&& fnTest.test(prop[name]) ? (function(name, fn) {
				return function() {
					var tmp = this._super;

					// Add a new ._super() method that is the same method
					// but on the super-class
					this._super = _super[name];

					// The method only need to be bound temporarily, so we
					// remove it when we're done executing
					var ret = fn.apply(this, arguments);
					this._super = tmp;

					return ret;
				};
			})(name, prop[name]) : prop[name];
		}

		// The dummy class constructor
		function Class() {
			// All construction is actually done in the init method
			if (!initializing && this.init)
				this.init.apply(this, arguments);
		}

		// Populate our constructed prototype object
		Class.prototype = prototype;

		// Enforce the constructor to be what we expect
		Class.prototype.constructor = Class;

		// And make this class extendable
		Class.extend = arguments.callee;

		return Class;
	};
})();

// /////////////////////////////////////////////////////////////////////
// DATE RELATED
Date.prototype.setISO8601 = function(string) {
	var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})"
			+ "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?"
			+ "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
	var d = string.match(new RegExp(regexp));

	var offset = 0;
	var date = new Date(d[1], 0, 1);

	if (d[3]) {
		date.setUTCMonth(d[3] - 1);
	}
	if (d[5]) {
		date.setUTCDate(d[5]);
	}
	if (d[7]) {
		date.setUTCHours(d[7]);
	}
	if (d[8]) {
		date.setUTCMinutes(d[8]);
	}
	if (d[10]) {
		date.setUTCSeconds(d[10]);
	}
	if (d[12]) {
		date.setUTCMilliseconds(Number("0." + d[12]) * 1000);
	}

	/*
	 * if(d[14]) { offset = (Number(d[16]) * 60) + Number(d[17]); offset *=
	 * ((d[15] == '-') ? 1 : -1); } offset -= date.getTimezoneOffset(); time =
	 * (Number(date) + (offset * 60 * 1000)); this.setTime(Number(time));
	 */

	this.setTime(date.getTime());
}

// see http://webcloud.se/log/JavaScript-and-ISO-8601/
Date.prototype.toISO8601 = function() {
	function twoDigits(d) {
		if (0 <= d && d < 10)
			return "0" + d.toString();
		if (-10 < d && d < 0)
			return "-0" + (-1 * d).toString();
		return d.toString();
	}

	return this.getUTCFullYear() + "-" + twoDigits(1 + this.getUTCMonth())
			+ "-" + twoDigits(this.getUTCDate()) + " "
			+ twoDigits(this.getUTCHours()) + ":"
			+ twoDigits(this.getUTCMinutes()) + ":"
			+ twoDigits(this.getUTCSeconds());

	/*
	 * function pad(n) { return n < 10 ? '0' + n : n; }
	 * 
	 * var d = this; return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) +
	 * '-' + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + ':' +
	 * pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + 'Z'
	 */

}

function twoDigits(d) {
	if (0 <= d && d < 10)
		return "0" + d.toString();
	if (-10 < d && d < 0)
		return "-0" + (-1 * d).toString();
	return d.toString();
}

Date.prototype.toMysqlFormat = function() {
	return this.getUTCFullYear() + "-" + twoDigits(1 + this.getUTCMonth())
			+ "-" + twoDigits(this.getUTCDate()) + " "
			+ twoDigits(this.getUTCHours()) + ":"
			+ twoDigits(this.getUTCMinutes()) + ":"
			+ twoDigits(this.getUTCSeconds());
};

Date.prototype.fromMysqlFormat = function(s){
  var t = s.split(/[- :]/);
  this.setUTCFullYear(t[0]);
  this.setUTCMonth(t[1]-1);
  this.setUTCDate(t[2]);
  this.setUTCHours(t[3]);
  this.setUTCMinutes(t[4]);
  this.setUTCSeconds(t[5]);
  this.setUTCMilliseconds(0);
};

Date.months = ["January", "February", "March", "April", "May", "June", "July",
		"August", "September", "October", "November", "December"];
Date.weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday",
		"Friday", "Saturday"];

// /////////////////////////////////////////////////////////////////////
// UNIQUE ID CREATION
GUID = {
	S4 : function() {
		return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
	},

	generate : function() {
		return (GUID.S4() + GUID.S4() + "-" + GUID.S4() + "-" + GUID.S4() + "-"
				+ GUID.S4() + "-" + GUID.S4() + GUID.S4() + GUID.S4());
	}
}

// /////////////////////////////////////////////////////////////////////
// P5 helper instantiation

// setup a hidden instance of processing which can be accessed via global 'p5'
// variable
function setupP5() {
	if (typeof p5 == 'undefined') {
		// if(isUndefined(p5)){
		Processing.logger = console;
		new Processing(document.createElement("canvas"), function(processing) {
					p5 = processing;
					p5.setup = function() {
						p5.println("setupP5");
					}
				});
	}
}

// /////////////////////////////////////////////////////////////////////
// GRAPH

Graph = Class.extend({

	init : function() {
		this.specs = [];
		setupP5();
	},

	create : function(data) {
		console.log(data);
		this.numFields = this.specs.length;

		this.startDate = new Date();
		this.startDate.setISO8601(data.req.startDate);

		this.endDate = new Date();
		this.endDate.setISO8601(data.req.endDate);

		this.startTime = this.startDate.getTime();
		this.endTime = this.endDate.getTime();
		this.timespan = this.endTime - this.startTime;
		this.numPoints = Math.ceil(this.timespan / 3600000.);

		this.points = [];

		for (var i = 0; i < this.numPoints; i++) {
			this.points.push({
						isValid : false,
						date : new Date(this.startDate.getTime() + i * 3600000.)
					});
		}

		var numDataPoints = data.results.length;
		for (var i = 0; i < numDataPoints; i++) {
			var dp = data.results[i];
			var date = new Date();
			date.setISO8601(dp.date);
			var index = Math
					.round((date.getTime() - this.startTime) / 3600000.);
			if (index >= 0 && index < this.numPoints) {
				var pt = this.points[index];
				pt.isValid = true;
				pt.data = [];
				for (var j = 0; j < this.specs.length; j++) {
					var spec = this.specs[j];
					var val = dp[spec.field] / spec.factor;
					pt.data.push(val);
				}
				pt.date.setTime(date.getTime());
			}
		}

		this.updatePoints();
	},

	// override this to add extra cached data to each point
	updatePoints : function() {
	}
});

// /////////////////////////////////////////////////////////////////////

LineGraph = Graph.extend({

			init : function(left, top, right, bottom) {
				this._super();
				this.left = left != undefined ? left : 100;
				this.top = top != undefined ? top : 100;
				this.right = right != undefined ? right : 200;
				this.bottom = bottom != undefined ? bottom : 200;
			},

			updatePoints : function() {
				this.gap = 1.0 * (this.right - this.left) / this.points.length;
				for (var i = 0; i < this.numPoints; i++) {
					var pt = this.points[i];
					if (pt.isValid) {
						pt.point = [];
						for (var j = 0; j < this.specs.length; j++) {
							var spec = this.specs[j];
							// pt.point.push({x:i*this.gap,y:p5.map(pt.data[j],spec.min,spec.max,spec.drawMin,spec.drawMax)});
							pt.point.push({
										x : this.left + i * this.gap,
										y : p5
												.map(pt.data[j], spec.min,
														spec.max, this.top,
														this.bottom)
									});
						}
					}
				}
			}
		});

LCGraph = LineGraph.extend({

			init : function(left, top, right, bottom) {

				this._super(left, top, right, bottom);
				this.specs.push({
							field : "red_avg",
							color : p5.color(255, 0, 0),
							factor : 1.0,
							min : 255,
							max : 0
						});
				this.specs.push({
							field : "green_avg",
							color : p5.color(0, 255, 0),
							factor : 1.0,
							min : 255,
							max : 0
						});
				this.specs.push({
							field : "blue_avg",
							color : p5.color(0, 0, 255),
							factor : 1.0,
							min : 255,
							max : 0
						});
			}

		});

TTGraph = LineGraph.extend({

			init : function(left, top, right, bottom) {
				this._super(left, top, right, bottom);
				this.specs.push({
							field : "temp1_avg",
							color : p5.color(255, 255, 0),
							factor : 1000000.0,
							min : 10,
							max : 30
						});
				this.specs.push({
							field : "temp2_avg",
							color : p5.color(0, 255, 255),
							factor : 1000000.0,
							min : 10,
							max : 30
						});
			}

		});

WTGraph = LineGraph.extend({

			init : function(left, top, right, bottom) {
				this._super(left, top, right, bottom);
				this.specs.push({
							field : "gust_normalized_avg",
							color : p5.color(0, 0, 0),
							factor : 1000000.0,
							min : 0,
							max : 1
						});
			}

		});

LineGraphDisplay = Class.extend({

	init : function(mainDiv, socket) {

		var self = this;

		var ui = {};
		ui.deviceSelect = $('<select></select>');
		ui.userSelect = $('<select></select>');
		ui.startDate = $('<input type="text"/>');
		ui.endDate = $('<input type="text"/>');
		this.ui = ui;

		var uiDiv = $('<div></div>').css('position', 'absolute').css('z-index',
				2);
		for (var n in ui) {
			uiDiv.append(ui[n]);
		}
		mainDiv.append(uiDiv);

		// setup menu items
		var deviceTypes = ["LC", "TT", "WT"];
		for (var n in deviceTypes) {
			ui.deviceSelect.append('<option value="' + deviceTypes[n] + '">'
					+ deviceTypes[n] + '</option>');
		}

		for (var i = 1; i < 22; i++) {
			ui.userSelect
					.append('<option value="' + i + '">' + i + '</option>');
		}

		var endDate = new Date();
		var startDate = new Date();
		startDate.setMonth(endDate.getMonth() - 1);
		ui.startDate.datepicker().datepicker('setDate', startDate);
		ui.endDate.datepicker().datepicker('setDate', endDate);

		this.graph = null;
		this.mousePoint = null;

		this.width = mainDiv.innerWidth();
		this.height = mainDiv.innerHeight();

		function sketch(p) {
			p.setup = function() {
				p.size(self.width, self.height);
				p.smooth();
				p.strokeWeight(1);
				p.background(250, 250, 250);
			}
			p.updateMousePoint = function() {
				if (self.graph) {
					var index = p.round(p.mouseX / self.graph.gap);
					if (index >= 0 && index < self.graph.points.length) {
						self.mousePoint = self.graph.points[index];
					} else {
						self.mousePoint = null;
					}
				}

			}

			p.mouseMoved = function() {
				p.updateMousePoint();
			}

			p.mouseDragged = function() {
				p.updateMousePoint();
			}

			p.draw = function() {
				if (!self.graph) {
					p.background(250, 250, 250);
				} else {
					p.background(250, 250, 250);

					if (self.graph.points.length > 0) {
						p.noFill();
						var prevPt = self.graph.points[0];
						var pt = self.graph.points[0];

						for (var i = 1; i < self.graph.points.length; i++) {
							pt = self.graph.points[i];
							if (prevPt.isValid && pt.isValid) {
								for (var j = 0; j < self.graph.numFields; j++) {
									p.stroke(self.graph.specs[j].color);
									p.line(prevPt.point[j].x,
											prevPt.point[j].y, pt.point[j].x,
											pt.point[j].y);
								}
							}
							// update prev values
							prevPt = pt;
							prevX = x;
						}
					}

					if (self.mousePoint) {
						if (self.mousePoint.isValid) {
							var x = 10;
							var y = 40;
							p.fill(0, 0, 0);
							p.text(self.mousePoint.date.toString(), x, y);
							y += 20;
							for (var j = 0; j < self.graph.numFields; j++) {
								var spec = self.graph.specs[j];

								p.fill(spec.color);
								p
										.text(
												spec.field
														+ " : "
														+ self.mousePoint.data[j],
												x, y);
								p.ellipse(self.mousePoint.point[j].x,
										self.mousePoint.point[j].y, 5, 5);
								y += 20;
							}

						}
					}
				}
			}
		}

		var canvas = document.createElement("canvas");
		var p5div = $('<div></div>').css('position', 'absolute').css('z-index',
				1);
		p5div.append($(canvas));
		mainDiv.append(p5div);

		Processing.logger = console;
		this.p = new Processing(canvas, sketch);

		for (var n in ui) {
			ui[n].change(function(data) {
						self.requestData(data)
					});
		}

		this.socket = socket;
		this.socket.on('hourlyData', function(data) {
					console.log('received hourly data');
					self.createGraph(data);
				});

	},

	createGraph : function(data) {

		if (data)
			if (data.req.reqId == this.req.reqId)
				if ("results" in data)
					if (Object.prototype.toString.call(data.results) === '[object Array]')
						if (data.results.length > 0) {
							this.graph = null;
							this.mousePoint = null;
							switch (data.req.device) {
								case "LC" :
									this.graph = new LCGraph(0, 0, this.width,
											this.height);
									this.graph.create(data);
									break;
								case "TT" :
									this.graph = new TTGraph(0, 0, this.width,
											this.height);
									this.graph.create(data);
									break;
								case "WT" :
									this.graph = new WTGraph(0, 0, this.width,
											this.height);
									this.graph.create(data);
									break;
							}
						}
	},

	requestData : function() {
		console.log("requestData");
		this.graph = null;
		this.mousePoint = null;
		this.req = {};
		this.req.reqId = GUID.generate();
		this.req.startDate = this.ui.startDate.datepicker('getDate')
				.toISO8601();
		this.req.endDate = this.ui.endDate.datepicker('getDate').toISO8601();
		this.req.device = this.ui.deviceSelect.val();
		this.req.user = this.ui.userSelect.val();
		this.socket.emit('hourlyData', this.req);
	}

});

// /////////////////////////////////////////////////////////////////////

GridGraph = Graph.extend({

			init : function(left, top, right, bottom) {
				this._super();
				this.left = left != undefined ? left : 100;
				this.top = top != undefined ? top : 100;
				this.right = right != undefined ? right : 200;
				this.bottom = bottom != undefined ? bottom : 200;
			}

		});

LCGridGraph = GridGraph.extend({

			init : function(left, top, right, bottom) {

				this._super(left, top, right, bottom);
				this.specs.push({
							field : "red_avg",
							color : p5.color(255, 0, 0),
							factor : 1.0,
							min : 255,
							max : 0
						});
				this.specs.push({
							field : "green_avg",
							color : p5.color(0, 255, 0),
							factor : 1.0,
							min : 255,
							max : 0
						});
				this.specs.push({
							field : "blue_avg",
							color : p5.color(0, 0, 255),
							factor : 1.0,
							min : 255,
							max : 0
						});
			},

			updatePoints : function() {
				for (var i = 0; i < this.numPoints; i++) {
					var pt = this.points[i];
					if (pt.isValid) {
						pt.color = p5.color(pt.data[0], pt.data[1], pt.data[2]);
					}
				}
			}

		});

TTGridGraph = GridGraph.extend({

			init : function(left, top, right, bottom, ttColourConverter) {
				this._super(left, top, right, bottom);
				this.ttColourConverter = ttColourConverter;
				this.specs.push({
							field : "temp1_avg",
							color : p5.color(255, 255, 0),
							factor : 1000000.0,
							min : 10,
							max : 30,
							drawMin : 200,
							drawMax : 0
						});
				this.specs.push({
							field : "temp2_avg",
							color : p5.color(0, 255, 255),
							factor : 1000000.0,
							min : 10,
							max : 30,
							drawMin : 200,
							drawMax : 0
						});
			},

			updatePoints : function() {
				for (var i = 0; i < this.numPoints; i++) {
					var pt = this.points[i];
					if (pt.isValid) {
						pt.color1 = this.ttColourConverter
								.getColour(pt.data[0]);
						pt.color2 = this.ttColourConverter
								.getColour(pt.data[1]);
					}
				}
			}

		});

WTGridGraph = GridGraph.extend({

			init : function(left, top, right, bottom) {
				// create word range for wind display
				var words = ["calm", "light air", "light breeze", "gentle breeze",
						"moderate breeze", "fresh breeze", "strong breeze",
						"high wind", "fresh gale", "strong gale", "storm", "huricane"];
				this.wordRange = [];
				var rangeStep = 1 / words.length;
				var rangeVal = 0;
				for (var i = 0; i < words.length; i++) {
					rangeVal += rangeStep
					this.wordRange.push([words[i], rangeVal]);
				}
				
				this._super(left, top, right, bottom);
				this.specs.push({
							field : "gust_normalized_avg",
							color : p5.color(0, 0, 0),
							factor : 1000000.0,
							min : 0,
							max : 1
						});
			},

			updatePoints : function() {
				for (var i = 0; i < this.numPoints; i++) {
					var pt = this.points[i];
					if (pt.isValid) {
						var val = Math.round(p5.constrain(p5.map(
										1 - pt.data[0], 0, 1, 0, 255), 0, 255));
						pt.color = p5.color(val, val, val);
						
						val = pt.data[0];
						var wordRangeVal = "";
						for (var j = 0; j < this.wordRange.length; j++)
							if (val <= this.wordRange[j][1]) {
								wordRangeVal = this.wordRange[j][0];
								break;
							}
						}
						pt.word = wordRangeVal;
				}
			}
		});

function formatUserID(id) {
	var s = id + "";
	while (s.length < 3)
		s = "0" + s;
	return s;
}

GridGraphDisplay = Class.extend({

	init : function(mainDiv, socket) {

		var self = this;
		this.socket = socket;

		var ui = {};
		ui.userSelect = $('<select></select>');
		ui.deviceSelect = $('<select></select>');
		ui.monthSelect = $('<select></select>');
		this.ui = ui;

		var uiDiv = $('<div></div>').css('position', 'absolute').css('z-index',
				2).css('top', '10px').css('left', '10px');
		for (var n in ui) {
			ui[n].sb();
			ui[n].appendTo(uiDiv);
		}
		mainDiv.append(uiDiv);

		var displayTop = '70px';
		
		this.dateDiv = $('<div></div>').css('z-index', 2).css('position',
				'absolute').css('top', displayTop).css('left', '10px').css(
				'font-family', 'Arial,sans-serif').css('font-size', '14px')
				.appendTo(mainDiv);
		// mainDiv.append(this.dateDiv);

		// these divs will be used to display data relating to the mouse
		// position
		this.displayDivs = {};

		var l = Math.round(mainDiv.width() * 0.5);
		var r = Math.round(mainDiv.width() * 0.5 - 20);
		this.displayDivs.LC = $('<div></div>');
		this.displayDivs.TT = $('<div></div>');
		this.displayDivs.WT = $('<div></div>');
		for(var n in this.displayDivs){
			this.displayDivs[n]
			.css('z-index', 2)
			.css('position', 'absolute')
			.css('top', displayTop)
			.css('left', l + 'px')
			.css('width', r + 'px')
			.css('text-align','right')
			.css('font-family', 'Arial,sans-serif')
			.css('font-size', '14px')
			.appendTo(mainDiv).hide();
		}
				
		// setup menu items
		var deviceNames = ["Light Collector", "Temperature Tape", "Wind Tunnel"];
		var deviceTypes = ["LC", "TT", "WT"];
		for (var n in deviceTypes) {
			ui.deviceSelect.append('<option value="' + deviceTypes[n] + '">'
					+ deviceNames[n] + '</option>');
		}

		for (var i = 1; i < 22; i++) {
			ui.userSelect.append('<option value="' + i + '">Household ' + formatUserID(i)
					+ '</option>');
		}

		// populate month select
		var firstMonth = new Date(2011, 10, 1, 0, 0, 0, 0);
		var currentMonth = new Date();
		while (currentMonth.getTime() > firstMonth.getTime()) {
			ui.monthSelect.append("<option value='" + currentMonth.getMonth()
					+ "_" + currentMonth.getFullYear() + "'>"
					+ Date.months[currentMonth.getMonth()] + " "
					+ currentMonth.getFullYear() + "</option>");
			currentMonth.setMonth(currentMonth.getMonth() - 1);
		}

		for (var n in ui) {
			ui[n].sb("refresh");
		}
		
		// create word range for wind display
		var words = ["calm", "light air", "light breeze", "gentle breeze",
				"moderate breeze", "fresh breeze", "strong breeze",
				"high wind", "fresh gale", "strong gale", "storm", "huricane"];
		this.wordRange = [];
		var rangeStep = 1 / words.length;
		var rangeVal = 0;
		for (var i = 0; i < words.length; i++) {
			rangeVal += rangeStep
			this.wordRange.push([words[i], rangeVal]);
		}

		this.graph = null;
		this.mousePoint = null;

		this.width = mainDiv.width();
		this.height = mainDiv.height();

		this.mouseDay = 1;
		this.mouseHour = 1;
		this.pointIndex = 0;
		this.refreshGraph = false;

		// setup processing instance
		Processing.logger = console;
		this.sketch = new Processing.Sketch();
		this.ttImgPath = "images/tt.png";


		this.sketch.imageCache.add(this.ttImgPath);
		this.sketch.attachFunction = function(p) {
			p.setup = function() {
				p.size(self.width, self.height);
				p.smooth();
				p.strokeWeight(1);
				p.background(255, 255, 255);

				p.CL = 10;
				p.CR = p.width - 10;
				p.CT = 95;
				p.CB = p.height - 10;
				p.CWidth = p.CR - p.CL;
				p.CHeight = p.CB - p.CT;
				p.CGap = 5;
				p.CSize = Math.round((p.CWidth - 23 * p.CGap) / 24.0);

				self.ttColourConverter = new TTColourConverter(p
								.loadImage(self.ttImgPath), p);

				var img = p.createImage(p.CSize, p.CSize, Processing.RGB);
				var colours = [p.color(128,128,128),p.color(255,255,255),p.color(255,255,255)]; // this defines the no data pattern
				var offset = 0;
				for(var y=0; y<p.CSize; y++){
					offset = y % colours.length;
					for(var x=0; x<p.CSize; x++){
						var c = (offset + x) % colours.length;
						img.set(x,y,colours[c]);
					}
				}
				self.noDataImg = img;

				self.p5ready();

			}
			p.updateMousePoint = function() {

				if (self.graph) {
					var deltaX = p.mouseX - p.CL;
					var deltaY = p.mouseY - p.CT;
					var hour = p.constrain(Math.floor(deltaX / p.CWidth * 24),
							0, 23);
					var day = p.constrain(Math.floor(deltaY / p.CWidth * 24),
							0, 31);
					// var day = p.constrain(Math.floor(deltaY / p.CHeight *
					// 31),0,30);
					self.setMousePoint(day, hour);
				}

			}

			p.mouseMoved = function() {
				p.updateMousePoint();
			}

			p.mouseDragged = function() {
				p.updateMousePoint();
			}

			p.draw = function() {
				if (self.p5Draw) {
					self.p5Draw.apply(self);
				} else {
					p.background(255, 255, 255);
				}
			}
		}
		var canvas = document.createElement("canvas");
		var p5div = $('<div></div>').css('position', 'absolute').css('z-index',
				1);
		p5div.append($(canvas));
		mainDiv.append(p5div);
		this.p = new Processing(canvas, this.sketch);
	},

	drawLCGrid : function() {

		if (this.refreshGraph) {
			var p = this.p;

			p.background(255, 255, 255);

			if (this.graph.points.length > 0) {

				var i = 0;
				p.noStroke();
				for (var row = 0; row < 31; row++) {
					for (var col = 0; col < 24; col++) {
						if (i < this.graph.points.length) {
							var pt = this.graph.points[i];
							if (pt.isValid) {
								p.noStroke();
								p.fill(pt.color);
								p.rect(p.CL + col * p.CSize + col * p.CGap,
										p.CT + row * p.CSize + row * p.CGap,
										p.CSize, p.CSize);
							} else {
								p.image(this.noDataImg, p.CL + col * p.CSize
												+ col * p.CGap, p.CT + row
												* p.CSize + row * p.CGap);
							}
						}
						i++;
					}
				}

			}
			this.refreshGraph = false;

		}
	},

	drawTTGrid : function() {

		if (this.refreshGraph) {
			var p = this.p;

			p.background(250, 250, 250);

			if (this.graph.points.length > 0) {

				var i = 0;
				p.noStroke();
				for (var row = 0; row < 31; row++) {
					for (var col = 0; col < 24; col++) {
						// p.fill(this.cellValue[i].valid ? onColor : offColor);
						if (i < this.graph.points.length) {
							var pt = this.graph.points[i];
							if (pt.isValid) {
								p.noStroke();
								var l = p.CL + col * p.CSize + col * p.CGap;
								var t = p.CT + row * p.CSize + row * p.CGap;
								var r = l + p.CSize;
								var b = t + p.CSize;

								p.fill(pt.color1);
								p.triangle(l, t, r, t, l, b);
								// p.rect(p.CL+col*p.CSize + col *
								// p.CGap,p.CT+row*p.CSize + row *
								// p.CGap,p.CSize,p.CSize);
								p.fill(pt.color2);
								p.triangle(r, t, r, b, l, b);
							} else {
								// p.stroke(128,128,128);
								// p.noFill();

								p.image(this.noDataImg, p.CL + col * p.CSize
												+ col * p.CGap, p.CT + row
												* p.CSize + row * p.CGap);
							}
						}
						i++;
					}
				}

			}
			this.refreshGraph = false;

		}
	},

	formatDate : function(d) {

		function formatDigit(val, numDigits) {
			temp = val + "";
			while (temp.length < numDigits) {
				temp = "0" + val;
			}
			return temp;
		}

		function formatHour(hour) {
			switch (hour) {
				case 0 :
					return "12AM";
					break;
				case 12 :
					return "12PM";
					break;
				default :
					if (hour < 12) {
						return hour + "AM";
					} else {
						return (hour - 12) + "PM";
					}
					break;
			}
		}

		// return formatDigit(d.getDate(),2) + "/" +
		// formatDigit(d.getMonth()+1,2) + "/" + d.getFullYear() + " " +
		// formatDigit(d.getHours(),2) + ":" + formatDigit(d.getMinutes(),2);
		return formatDigit(d.getDate(), 2) + " " + Date.months[d.getMonth()]
				+ " " + d.getFullYear() + " | " + Date.weekdays[d.getDay()]
				+ " | " + formatHour(d.getHours());
	},

	p5ready : function() {

		var self = this;

		this.socket.on('hourlyData', function(data) {
					console.log('received hourly data');
					self.createGraph(data);
				});

		// activate menu interactivity
		for (var n in this.ui) {
			this.ui[n].change(function(data) {
						self.requestData(data)
					});
		}

		this.requestData();
	},

	setMousePoint : function(day, hour) {

		/*
		 * self.mouseHour = p.constrain(Math.floor(deltaX / p.CWidth *
		 * 24),0,23); self.mouseDay = p.constrain(Math.floor(deltaY / p.CHeight *
		 * 31),0,30); self.pointIndex = self.mouseDay * 24 + self.mouseHour;
		 */

		var index = day * 24 + hour;

		var selectedPoint = null;
		if (index >= 0 && index < this.graph.points.length) {
			selectedPoint = this.graph.points[index];
		}

		if (selectedPoint != this.mousePoint) {
			this.mousePoint = selectedPoint;
			this.mousePointChanged();
		}

	},

	mousePointChanged : function() {
		if (this.mousePoint) {
			// if(self.mousePoint.isValid){
			var text = this.formatDate(this.mousePoint.date);
			this.dateDiv.html(text);
			// }

			for (var i = 0; i < this.mousePointChangedHandlers.length; i++) {
				this.mousePointChangedHandlers[i].apply(this);
			}

		} else {
			this.dateDiv.html("");
		}
	},

	lcMousePointChanged : function() {
		if (this.mousePoint) {
			if (this.mousePoint.isValid) {
				this.displayDivs.LC.html("RED:" + this.mousePoint.data[0]
						+ " GREEN:" + this.mousePoint.data[1] + " BLUE:"
						+ this.mousePoint.data[2]);
			} else {
				this.displayDivs.LC.html("no data available");
			}
		}
	},

	ttMousePointChanged : function() {
		if (this.mousePoint) {
			if (this.mousePoint.isValid) {
				this.displayDivs.TT.html("HOOK:"
						+ (1.0 * this.mousePoint.data[0]).toFixed(2) + "C "
						+ "EYE:" + (1.0 * this.mousePoint.data[1]).toFixed(2)
						+ "C");
			} else {
				this.displayDivs.TT.html("no data available");
			}
		}
	},

	wtMousePointChanged : function() {
		if (this.mousePoint) {
			if (this.mousePoint.isValid) {
				var val = this.mousePoint.data[0];
				var wordRangeVal = "";
				for (var j = 0; j < this.wordRange.length; j++)
					if (val <= this.wordRange[j][1]) {
						wordRangeVal = this.wordRange[j][0];
						break;
					}

				this.displayDivs.WT.html(wordRangeVal);
			} else {
				this.displayDivs.WT.html("no data available");
			}
		}
	},

	createGraph : function(data) {

		if (data)
			if (data.req.reqId == this.req.reqId)
				if ("results" in data)
					if (Object.prototype.toString.call(data.results) === '[object Array]')
						//if (data.results.length > 0) {
							this.graph = null;
							this.mousePoint = null;
							switch (data.req.device) {
								case "LC" :
									this.graph = new LCGridGraph(0, 0,
											this.width, this.height);
									this.graph.create(data);
									this.refreshGraph = true;
									this.displayDivs.LC.show();
									this.mousePointChangedHandlers
											.push(this.lcMousePointChanged);
									this.p5Draw = this.drawLCGrid;
									break;
								case "TT" :
									this.graph = new TTGridGraph(0, 0,
											this.width, this.height,
											this.ttColourConverter);
									this.graph.create(data);
									this.refreshGraph = true;
									this.displayDivs.TT.show();
									this.mousePointChangedHandlers
											.push(this.ttMousePointChanged);
									this.p5Draw = this.drawTTGrid;
									break;
								case "WT" :
									this.graph = new WTGridGraph(0, 0,
											this.width, this.height);
									this.graph.create(data);
									this.refreshGraph = true;
									this.displayDivs.WT.show();
									this.mousePointChangedHandlers
											.push(this.wtMousePointChanged);
									this.p5Draw = this.drawLCGrid;
									break;
							}
						//}
	},

	requestData : function() {
		console.log("requestData");
		this.graph = null;
		this.mousePoint = null;
		this.deviceType = "";
		this.mousePointChangedHandlers = [];

		// hide all display divs
		for (var n in this.displayDivs) {
			this.displayDivs[n].hide();
		}

		this.req = {};
		this.req.reqId = GUID.generate();

		var monthString = this.ui.monthSelect.val();
		var s = monthString.split('_');
		this.startDate = new Date(s[1], s[0], 1, 3, 0, 0, 0);
		this.startDate.setUTCMonth(Number(s[0]));
		this.startDate.setUTCDate(1);
		this.startDate.setUTCHours(0);
		this.endDate = new Date(this.startDate.getTime());
		this.endDate.setUTCMonth((this.startDate.getUTCMonth() + 1));

		this.req.startDate = this.startDate.toMysqlFormat();
		this.req.endDate = this.endDate.toMysqlFormat();
		this.req.device = this.ui.deviceSelect.val();
		this.req.user = this.ui.userSelect.val();
		console.log(this.req);
		this.socket.emit('hourlyData', this.req);
	}

});

GridGraphDisplay2 = Class.extend({

	init : function(mainDiv, socket) {

		var self = this;
		this.socket = socket;

		var ui = {};
		ui.userSelect = $('<select></select>');
		ui.deviceSelect = $('<select></select>');
		ui.monthSelect = $('<select></select>');
		this.ui = ui;

		var uiDiv = $('<div></div>').css('position', 'absolute').css('z-index',
				10).css('top', '10px').css('left', '10px');
		for (var n in ui) {
			ui[n].sb();
			ui[n].appendTo(uiDiv);
		}
		mainDiv.append(uiDiv);

		var displayTop = '100px';//'70px';
		
		this.dateDiv = $('<div></div>').css('z-index', 2).css('position',
				'absolute').css('top', displayTop).css('left', '10px').css(
				'font-family', 'Arial,sans-serif').css('font-size', '14px')
				.appendTo(mainDiv);
		// mainDiv.append(this.dateDiv);

		// these divs will be used to display data relating to the mouse
		// position
		this.displayDivs = {};

		var l = Math.round(mainDiv.width() * 0.5);
		var r = Math.round(mainDiv.width() * 0.5 - 20);
		this.displayDivs.LC = $('<div></div>');
		this.displayDivs.TT = $('<div></div>');
		this.displayDivs.WT = $('<div></div>');
		for(var n in this.displayDivs){
			this.displayDivs[n]
			.css('z-index', 2)
			.css('position', 'absolute')
			.css('top', displayTop)
			.css('left', l + 'px')
			.css('width', r + 'px')
			.css('text-align','right')
			.css('font-family', 'Arial,sans-serif')
			.css('font-size', '14px')
			.appendTo(mainDiv).hide();
		}
				
		// create mouse div
		this.mouseDivWidth = 100;
		this.mouseDivHeight = 50;
		
		
		// setup menu items
		var deviceNames = ["Light Collector", "Temperature Tape", "Wind Tunnel"];
		var deviceTypes = ["LC", "TT", "WT"];
		for (var n in deviceTypes) {
			ui.deviceSelect.append('<option value="' + deviceTypes[n] + '">'
					+ deviceNames[n] + '</option>');
		}

		for (var i = 1; i <= 22; i++) {
			if(i<=2 || i>= 7 || i==5){
				ui.userSelect.append('<option value="' + i + '">Household ' + formatUserID(i)
						+ '</option>');
			}
		}

		// populate month select
		var firstMonth = new Date(2011, 10, 1, 0, 0, 0, 0);
		var currentMonth = new Date();
		while (currentMonth.getTime() > firstMonth.getTime()) {
			ui.monthSelect.append("<option value='" + currentMonth.getMonth()
					+ "_" + currentMonth.getFullYear() + "'>"
					+ Date.months[currentMonth.getMonth()] + " "
					+ currentMonth.getFullYear() + "</option>");
			currentMonth.setMonth(currentMonth.getMonth() - 1);
		}

		for (var n in ui) {
			ui[n].sb("refresh");
		}
		
		// create word range for wind display
		var words = ["calm", "light air", "light breeze", "gentle breeze",
				"moderate breeze", "fresh breeze", "strong breeze",
				"high wind", "fresh gale", "strong gale", "storm", "huricane"];
		this.wordRange = [];
		var rangeStep = 1 / words.length;
		var rangeVal = 0;
		for (var i = 0; i < words.length; i++) {
			rangeVal += rangeStep
			this.wordRange.push([words[i], rangeVal]);
		}

		this.graph = null;
		this.mousePoint = null;

		this.width = mainDiv.width();
		this.height = mainDiv.height();

		this.mouseDay = 1;
		this.mouseHour = 1;
		this.pointIndex = 0;
		this.refreshGraph = false;

		// setup processing instance
		Processing.logger = console;
		this.sketch = new Processing.Sketch();
		this.ttImgPath = "images/tt.png";


		this.sketch.imageCache.add(this.ttImgPath);
		this.sketch.attachFunction = function(p) {
			p.setup = function() {
				p.size(self.width, self.height);
				p.smooth();
				p.strokeWeight(1);
				p.background(255, 255, 255);

				p.CL = 10;
				p.CR = p.width - 10;
				p.CT = 125;//95;
				p.CB = p.height - 10;
				p.CWidth = p.CR - p.CL;
				p.CHeight = p.CB - p.CT;
				p.CGap = 5;
				p.CSize = Math.round((p.CWidth - 23 * p.CGap) / 24.0);

				self.mouseDivOffsetX = -0.5 * self.mouseDivWidth + (p.CSize * 0.5);
				self.mouseDivOffsetY = -1 * self.mouseDivHeight;
				
				self.ttColourConverter = new TTColourConverter(p
								.loadImage(self.ttImgPath), p);

				var img = p.createImage(p.CSize, p.CSize, Processing.RGB);
				var colours = [p.color(128,128,128),p.color(255,255,255),p.color(255,255,255)]; // this defines the no data pattern
				var offset = 0;
				for(var y=0; y<p.CSize; y++){
					offset = y % colours.length;
					for(var x=0; x<p.CSize; x++){
						var c = (offset + x) % colours.length;
						img.set(x,y,colours[c]);
					}
				}
				self.noDataImg = img;

				self.p5ready();

			}
			p.updateMousePoint = function() {

				if (self.graph) {
					var deltaX = p.mouseX - p.CL;
					var deltaY = p.mouseY - p.CT;
					var hour = p.constrain(Math.floor(deltaX / p.CWidth * 24),
							0, 23);
					var day = p.constrain(Math.floor(deltaY / p.CWidth * 24),
							0, 31);
					self.setMousePoint(day, hour);
				}

			}

			p.mouseMoved = function() {
				p.updateMousePoint();
			}

			p.mouseDragged = function() {
				p.updateMousePoint();
			}

			p.draw = function() {
				if (self.p5Draw) {
					self.p5Draw.apply(self);
				} else {
					p.background(255, 255, 255);
				}
			}
		}
		var canvas = document.createElement("canvas");
		var p5div = $('<div></div>').css('position', 'absolute').css('z-index',
				1);
		p5div.append($(canvas));
		mainDiv.append(p5div);
		this.p = new Processing(canvas, this.sketch);
		
		// overlay p5
		this.oSketch = new Processing.Sketch();
		this.oSketch.attachFunction = function(p){
			p.setup = function(){
				p.size(self.width, self.height);
				
				var fontA = p.loadFont("arial");
  				p.textFont(fontA, 12); 
				
			}
			
			p.updateMousePoint = function() {

				if (self.graph) {
					var deltaX = p.mouseX - self.p.CL;
					var deltaY = p.mouseY - self.p.CT;
					var hour = p.constrain(Math.floor(deltaX / self.p.CWidth * 24),
							0, 23);
					var day = p.constrain(Math.floor(deltaY / self.p.CWidth * 24),
							0, 31);
					self.setMousePoint(day, hour);
				}

			}

			p.mouseMoved = function() {
				p.updateMousePoint();
			}

			p.mouseDragged = function() {
				p.updateMousePoint();
			}
			
			p.draw = function(){
				p.background(0,0,0,0);
				p.noStroke();
				
				
				if("drawHook" in p){
					p.drawHook(p,self);
				} else {
					//p.fill(255,0,0);
					//p.ellipse(p.width * 0.5,p.height * 0.5,50,50);
				}
					
			}
			
			p.setupTextbox = function(lines){
				p.lineHeight = 17;
				p.lines = lines;
				p.boxW = 200;
				p.boxH = lines * p.lineHeight + 5;
				p.boxX = p.constrain(self.mousePoint.l - 5,0,p.width-p.boxW-5);
				
				//p.boxX = p.mouseX;
				p.boxY = self.mousePoint.t - p.boxH - 10;
//				p.boxY = p.mouseY - p.boxH - 5;
				p.lineY = p.boxY - 2;
				p.lineX = p.boxX + 5;
				
				var t = p.boxY + p.boxH;
				var b = self.mousePoint.t+2;
				var c = self.mousePoint.l + self.p.CSize * 0.5;
				var l = c-10;
				var r = c+10;
				
				// draw shadow
				p.pushMatrix();
				p.translate(2,2);
				p.fill(0,0,0,75);
				p.rect(p.boxX-1,p.boxY-1,p.boxW+1, p.boxH+1);
				p.triangle(l,t,c,b,r,t);
				p.popMatrix();
				
				// draw text box background
				p.fill(255,255,255,255);
				p.rect(p.boxX,p.boxY,p.boxW, p.boxH);
				p.triangle(l,t,c,b,r,t);
				
				
				
			}
			
		}
		var oCanvas = document.createElement("canvas");
		var oDiv = $('<div></div>').css('position', 'absolute').css('z-index',2);
		oDiv.append($(oCanvas));
		mainDiv.append(oDiv);
		this.oP = new Processing(oCanvas, this.oSketch);
		
		
		// mouse pointer related
		
		this.mouseDiv = $('<div></div>').appendTo(mainDiv)
		.css('z-index',3)
		.css('position', 'absolute')
		.css('width', this.mouseDivWidth + 'px')
		.css('height', this.mouseDivHeight + 'px')
		.css('border', '1px solid red')
		.hide();
		
		
		
		this.mouseSketch = new Processing.Sketch();
		this.mouseSketch.attachFunction = function(p){
			p.setup = function(){
				var h = self.mouseDivHeight;
				var w = self.mouseDivWidth;
				
				p.size(w,h);
				p.background(0,0,0,0);
				p.noStroke();
				p.fill(200,200,200);
				

				var triangleH = 10;
				var centreX = w * 0.5;
				var rectBottom = h-triangleH;
				
				p.rect(0,0,w,rectBottom);
				
				
				
				
				p.triangle(centreX - triangleH,rectBottom,centreX,h,centreX + triangleH,rectBottom);
			}
		}
		var mouseCanvas = document.createElement("canvas");
		this.mouseDiv.append($(mouseCanvas));
		this.mouseP = new Processing(mouseCanvas,this.mouseSketch);
		
		this.mouseContentDiv = $('<div></div>').appendTo(this.mouseDiv)
		.css('z-index',2)
		.css('position', 'absolute')
		.css('left','0px')
		.css('top','0px')
		.css('width', this.mouseDivWidth + 'px')
		.css('height', this.mouseDivHeight + 'px')
		.css('font-family', 'Arial,sans-serif')
		.css('font-size', '10px')
		.css('padding','5px');
	},

	drawLCGrid : function() {

		if (this.refreshGraph) {
			var p = this.p;

			p.background(255, 255, 255);

			if (this.graph.points.length > 0) {

				var i = 0;
				p.noStroke();
				for (var row = 0; row < 31; row++) {
					for (var col = 0; col < 24; col++) {
						if (i < this.graph.points.length) {
							var pt = this.graph.points[i];
							if (pt.isValid) {
								p.noStroke();
								p.fill(pt.color);
								p.rect(pt.l,pt.t,p.CSize,p.CSize);
							} else {
								p.stroke(230,230,230);
								p.noFill();
								p.rect(pt.l,pt.t,p.CSize,p.CSize);
								p.line(pt.l,pt.b,pt.r,pt.t);
								//p.image(this.noDataImg, pt.l,pt.t);
							}
						}
						i++;
					}
				}

			}
			this.refreshGraph = false;

		}
	},

	drawTTGrid : function() {

		if (this.refreshGraph) {
			var p = this.p;

			p.background(255, 255, 255);

			if (this.graph.points.length > 0) {

				var i = 0;
				p.noStroke();
				for (var row = 0; row < 31; row++) {
					for (var col = 0; col < 24; col++) {
						// p.fill(this.cellValue[i].valid ? onColor : offColor);
						if (i < this.graph.points.length) {
							var pt = this.graph.points[i];
							if (pt.isValid) {
								p.noStroke();
								var l = p.CL + col * p.CSize + col * p.CGap;
								var t = p.CT + row * p.CSize + row * p.CGap;
								var r = l + p.CSize;
								var b = t + p.CSize;

								p.fill(pt.color1);
								p.triangle(l, t, r, t, l, b);
								// p.rect(p.CL+col*p.CSize + col *
								// p.CGap,p.CT+row*p.CSize + row *
								// p.CGap,p.CSize,p.CSize);
								p.fill(pt.color2);
								p.triangle(r, t, r, b, l, b);
							} else {
								// p.stroke(128,128,128);
								// p.noFill();
								p.stroke(230,230,230);
								p.noFill();
								p.rect(pt.l,pt.t,p.CSize,p.CSize);
								p.line(pt.l,pt.b,pt.r,pt.t);
								/*
								 p.image(this.noDataImg, p.CL + col * p.CSize
												+ col * p.CGap, p.CT + row
												* p.CSize + row * p.CGap);
								*/
							}
						}
						i++;
					}
				}

			}
			this.refreshGraph = false;

		}
	},

	updateDatapoints : function(){
		// cache cell positions / dimensions
		if (this.graph.points.length > 0) {
			var i = 0;
			var p = this.p;
			for (var row = 0; row < 31; row++) {
				for (var col = 0; col < 24; col++) {
					if (i < this.graph.points.length) {
						var pt = this.graph.points[i];
						pt.l = p.CL + col * p.CSize + col * p.CGap;
						pt.t = p.CT + row * p.CSize + row * p.CGap;
						pt.r = pt.l + p.CSize;
						pt.b = pt.t + p.CSize;
					}
					i++;
				}
			}

		}
	},
	
	formatDate : function(d) {

		function formatDigit(val, numDigits) {
			temp = val + "";
			while (temp.length < numDigits) {
				temp = "0" + val;
			}
			return temp;
		}

		function formatHour(hour) {
			switch (hour) {
				case 0 :
					return "12AM";
					break;
				case 12 :
					return "12PM";
					break;
				default :
					if (hour < 12) {
						return hour + "AM";
					} else {
						return (hour - 12) + "PM";
					}
					break;
			}
		}

		// return formatDigit(d.getDate(),2) + "/" +
		// formatDigit(d.getMonth()+1,2) + "/" + d.getFullYear() + " " +
		// formatDigit(d.getHours(),2) + ":" + formatDigit(d.getMinutes(),2);
		return formatDigit(d.getDate(), 2) + " " + Date.months[d.getMonth()]
				+ " " + d.getFullYear() + " | " + Date.weekdays[d.getDay()]
				+ " | " + formatHour(d.getHours());
	},

	p5ready : function() {

		var self = this;

		this.socket.on('hourlyData', function(data) {
					console.log('received hourly data');
					self.createGraph(data);
				});

		// activate menu interactivity
		for (var n in this.ui) {
			this.ui[n].change(function(data) {
						self.requestData(data)
					});
		}

		this.requestData();
	},

	setMousePoint : function(day, hour) {

		/*
		 * self.mouseHour = p.constrain(Math.floor(deltaX / p.CWidth *
		 * 24),0,23); self.mouseDay = p.constrain(Math.floor(deltaY / p.CHeight *
		 * 31),0,30); self.pointIndex = self.mouseDay * 24 + self.mouseHour;
		 */

		var index = day * 24 + hour;

		var selectedPoint = null;
		if (index >= 0 && index < this.graph.points.length) {
			selectedPoint = this.graph.points[index];
		}

		if (selectedPoint != this.mousePoint) {
			this.mousePoint = selectedPoint;
			this.mousePointChanged();
		}

	},

	mousePointChanged : function() {
		if (this.mousePoint) {
			// if(self.mousePoint.isValid){
			var text = this.formatDate(this.mousePoint.date);
			this.dateDiv.html(text);
			// }

			// update mouse div
			
//			this.mouseDiv.show()
//			.css('left',(this.mousePoint.l+this.mouseDivOffsetX)+'px')
//			.css('top',(this.mousePoint.t+this.mouseDivOffsetY)+'px');
			
//			this.mouseContentDiv.html(text);
			
			for (var i = 0; i < this.mousePointChangedHandlers.length; i++) {
				this.mousePointChangedHandlers[i].apply(this);
			}

		} else {
			this.dateDiv.html("");
			
		}
	},

	lcMousePointChanged : function() {
		if (this.mousePoint) {
			if (this.mousePoint.isValid) {
				this.displayDivs.LC.html("RED:" + this.mousePoint.data[0]
						+ " GREEN:" + this.mousePoint.data[1] + " BLUE:"
						+ this.mousePoint.data[2]);
			} else {
				this.displayDivs.LC.html("no data available");
			}
		}
	},

	ttMousePointChanged : function() {
		if (this.mousePoint) {
			if (this.mousePoint.isValid) {
				this.displayDivs.TT.html("HOOK:"
						+ (1.0 * this.mousePoint.data[0]).toFixed(2) + "C "
						+ "EYE:" + (1.0 * this.mousePoint.data[1]).toFixed(2)
						+ "C");
			} else {
				this.displayDivs.TT.html("no data available");
			}
		}
	},

	wtMousePointChanged : function() {
		if (this.mousePoint) {
			if (this.mousePoint.isValid) {
//				var val = this.mousePoint.data[0];
//				var wordRangeVal = "";
//				for (var j = 0; j < this.wordRange.length; j++)
//					if (val <= this.wordRange[j][1]) {
//						wordRangeVal = this.wordRange[j][0];
//						break;
//					}
//
//				this.displayDivs.WT.html(wordRangeVal);
				this.displayDivs.WT.html(this.mousePoint.word);
			} else {
				this.displayDivs.WT.html("no data available");
			}
		}
	},

	lcOverlayDraw : function(p,self){
		
		if (self.mousePoint) {
			p.setupTextbox(2);
			
			// date
			var text = self.formatDate(self.mousePoint.date);
			p.lineY += p.lineHeight;
			p.fill(0,0,0);
			p.text(text,p.lineX,p.lineY);
		
			if (self.mousePoint.isValid) {
				
				// rgb values
				p.lineY += p.lineHeight;
				
				p.fill(self.mousePoint.data[0],self.mousePoint.data[1],self.mousePoint.data[2]);
				p.noStroke();
				p.rect(p.lineX,p.lineY-10,50,11);
				
				p.fill(255,0,0);
				p.text(self.mousePoint.data[0],p.lineX + 60,p.lineY);
				
				p.fill(0,255,0);
				p.text(self.mousePoint.data[1],p.lineX+90,p.lineY);
				
				p.fill(0,0,255);
				p.text(self.mousePoint.data[2],p.lineX+120,p.lineY);
				
				
				
			} else {
				p.fill(0,0,0);
				p.lineY += p.lineHeight;
				p.text("no data available",p.lineX,p.lineY);
			}
			
		}
	},
	
	ttOverlayDraw : function(p,self){
		
		if (self.mousePoint) {
			p.setupTextbox(2);
			
			// date
			var text = self.formatDate(self.mousePoint.date);
			p.lineY += p.lineHeight;
			p.fill(0,0,0);
			p.text(text,p.lineX,p.lineY);
		
			if (self.mousePoint.isValid) {
				p.lineY += p.lineHeight;
				p.text("HOOK:" + (1.0 * self.mousePoint.data[0]).toFixed(2) + "C ",p.lineX,p.lineY);
				p.text("EYE:" + (1.0 * self.mousePoint.data[1]).toFixed(2) + "C",p.lineX + 100,p.lineY);
			} else {
				p.fill(0,0,0);
				p.lineY += p.lineHeight;
				p.text("no data available",p.lineX,p.lineY);
			}
			
		}
	},
	
	wtOverlayDraw : function(p,self){
		
		if (self.mousePoint) {
			p.setupTextbox(2);
			
			// date
			var text = self.formatDate(self.mousePoint.date);
			p.lineY += p.lineHeight;
			p.fill(0,0,0);
			p.text(text,p.lineX,p.lineY);
		
			if (self.mousePoint.isValid) {
				p.lineY += p.lineHeight;
				p.text(self.mousePoint.word,p.lineX,p.lineY);
			} else {
				p.fill(0,0,0);
				p.lineY += p.lineHeight;
				p.text("no data available",p.lineX,p.lineY);
			}
			
		}
	},
	
	createGraph : function(data) {

		if (data)
			if (data.req.reqId == this.req.reqId)
				if ("results" in data)
					if (Object.prototype.toString.call(data.results) === '[object Array]')
						//if (data.results.length > 0) {
							this.graph = null;
							this.mousePoint = null;
							switch (data.req.device) {
								case "LC" :
									this.graph = new LCGridGraph(0, 0,
											this.width, this.height);
									this.graph.create(data);
									this.updateDatapoints();
									this.refreshGraph = true;
									this.displayDivs.LC.show();
									this.mousePointChangedHandlers
											.push(this.lcMousePointChanged);
									this.oP.drawHook = this.lcOverlayDraw;
									this.p5Draw = this.drawLCGrid;
									break;
								case "TT" :
									this.graph = new TTGridGraph(0, 0,
											this.width, this.height,
											this.ttColourConverter);
									this.graph.create(data);
									this.updateDatapoints();
									this.refreshGraph = true;
									this.displayDivs.TT.show();
									this.mousePointChangedHandlers
											.push(this.ttMousePointChanged);
									this.oP.drawHook = this.ttOverlayDraw;
									this.p5Draw = this.drawTTGrid;
									break;
								case "WT" :
									this.graph = new WTGridGraph(0, 0,
											this.width, this.height);
									this.graph.create(data);
									this.updateDatapoints();
									this.refreshGraph = true;
									this.displayDivs.WT.show();
									this.mousePointChangedHandlers
											.push(this.wtMousePointChanged);
									this.oP.drawHook = this.wtOverlayDraw;
									this.p5Draw = this.drawLCGrid;
									break;
							}
						//}
	},

	requestData : function() {
		console.log("requestData");
		this.graph = null;
		this.mousePoint = null;
		//this.oP.drawHook = null;
		this.deviceType = "";
		this.mousePointChangedHandlers = [];

		// hide all display divs
		for (var n in this.displayDivs) {
			this.displayDivs[n].hide();
		}

		this.req = {};
		this.req.reqId = GUID.generate();

		var monthString = this.ui.monthSelect.val();
		var s = monthString.split('_');
		this.startDate = new Date(s[1], s[0], 1, 3, 0, 0, 0);
		this.startDate.setUTCMonth(Number(s[0]));
		this.startDate.setUTCDate(1);
		this.startDate.setUTCHours(0);
		this.endDate = new Date(this.startDate.getTime());
		this.endDate.setUTCMonth((this.startDate.getUTCMonth() + 1));

		this.req.startDate = this.startDate.toMysqlFormat();
		this.req.endDate = this.endDate.toMysqlFormat();
		this.req.device = this.ui.deviceSelect.val();
		this.req.user = this.ui.userSelect.val();
		console.log(this.req);
		this.socket.emit('hourlyData', this.req);
	}

});

TTColourConverter = Class.extend({

			init : function(img, p5) {
				this.img = img;
				this.p5 = p5;
				this.minTemp = 14.0;
				this.maxTemp = 29.0;
			},

			getColour : function(temp) {
				var p = this.p5;
				var pixelMax = this.img.width - 1;
				// map temp to x position within temperature range image
				var x = p.round(p.map(p.constrain(temp, this.minTemp,
								this.maxTemp), this.minTemp, this.maxTemp, 0,
						pixelMax));
				return this.img.pixels.getPixel(x, 0); // return pixel value in
														// first row at mapped x
			}
		});