/* The Graphing Stuff by Benjamin Green */

/* Requires jQuery SVG by Ken Wood */

/*
 * $("svg").find("g#series1").find("polyline");
 *  - returns an array.
 * ary[0].points.getItem(x).x = newxval;
 * http://stackoverflow.com/questions/12859013/jquery-svg-hover-element
 *
 * Using transform="rotate()" in SVG:
 * http://tutorials.jenkov.com/svg/svg-transformation.html
 *
 * The annotations functions included here should probably be extracted into
 * another, cooperating, class. - Benjamin 2016-05-17.
 */

var LetterAndNumberGenerator = function() {
	'use strict';
	
	var startLetter = 65;
	var endLetter = 65 + 25;
	var currLetter = startLetter;
	var currNumber = 0;
	
	this.generateIdentity = function() {
		var text = "";
		if (currNumber > 0) {
			text = String.fromCharCode(currLetter) + currNumber;
		} else {
			text = String.fromCharCode(currLetter);
		}
		if (currLetter == endLetter) {
			currLetter = startLetter;
			currNumber ++;
		} else {
			currLetter ++;
		}
		return text;
	};
};

var SVGChartHelper = new function() {
	'use strict';
	
	var self = this;
	
	this.processFixedIntervalData = function(dataset) {
		var fid = dataset.data;
		var max_v = -Number.MAX_VALUE;
		var min_v = Number.MAX_VALUE;
		var data = [];
		for (var k = 0; k < fid.length; k++) {
			if (!isNaN(fid[k])) {
				if (fid[k] > max_v) {
					max_v = fid[k];
				}
				if (fid[k] < min_v) {
					min_v = fid[k];
				}
			}
			data.push([dataset.interval * k + dataset.startingTimestamp, fid[k]]);
		}
		delete dataset.startingTimestamp;
		delete dataset.interval;
		dataset.data_type = "timestamped";
		dataset.data = data;
		if (fid.length === 0) { min_v = 0; max_v = 0; }
		dataset.y_min_v = min_v;
		dataset.y_max_v = max_v;
		dataset.x_min_v = dataset.data[0][0];
		dataset.x_max_v = dataset.data[dataset.data.length - 1][0];
	};
	
	this.processTimestampedData = function(dataset) {
		var tsd = dataset.data;
		var max_v = -Number.MAX_VALUE;
		var min_v = Number.MAX_VALUE;
		for (var k = 0; k < tsd.length; k++) {
			if (!isNaN(tsd[k][1])) {
				if (tsd[k][1] > max_v) {
					max_v = tsd[k][1];
				}
				if (tsd[k][1] < min_v) {
					min_v = tsd[k][1];
				} 
			}
		}
		if (tsd.length === 0) { min_v = 0; max_v = 0; }
		dataset.y_min_v = min_v;
		dataset.y_max_v = max_v;
		if (tsd.length > 0) {
			dataset.x_min_v = dataset.data[0][0];
			dataset.x_max_v = dataset.data[dataset.data.length - 1][0];
		}
	};
	
	/* Naturally the data array must be sorted... */
	this.binarySearch = function(data, timestamp) {
		var mid = Math.floor(data.length / 2);
		var range = mid;
		var count = 20;
		var prev = 0;
		var prev_prev = 0;
		var diffa;
		var diffb;
		while (data[prev_prev][0] !== data[mid][0] && count > 0) {
			prev_prev = prev;
			prev = mid;
			if (data[mid][0] === timestamp) {
				return mid;
			}
			if (data[mid][0] > timestamp) {
				//range = Math.ceil(range / 2);
				range = Math.floor(range / 2);
				if (range <= 1) { range = 1; count --; }
				mid = mid - range;
			} else
			if (data[mid][0] < timestamp) {
				//range = Math.ceil(range / 2);
				range = Math.floor(range / 2);
				if (range <= 1) { range = 1; count --; }
				mid = mid + range;
			}
			if (mid < 0) { mid = 0; }
			if (mid >= data.length) { mid = data.length - 1; }
			//console.log("mid " + mid + " range " + range + " data " + data[mid][0] + " " + timestamp + " GTR " + (data[mid][0] > timestamp) + " " + count + " p " + prev + " pp " + prev_prev);
		}
		diffa = timestamp - data[prev][0];
		diffb = timestamp - data[mid][0];
		if (diffa >= diffb) {
			return mid;
		} else {
			return prev;
		}
	};
	
	// Passing an array of charts will search in the renderers for the sensor id sensorId.
	this.getChartBySensorId = function(charts, sensorId) {
		for (var i = 0; i < charts.length; i++) {
			var chart = charts[i];
			for (var j = 0; j < chart.renderers.length; j++) {
				var renderer = chart.renderers[j];
				for (var k = 0; k < renderer.ids.length; k++) {
					var id = renderer.ids[k];
					//console.log(id + " == " + sensorId + " = " + (id == sensorId));
					if (id === sensorId) {
						return chart;
					}
				}
			}
		}
	};
	
	this.setAllSelectionsEnabled = function(charts, enabled) {
		var i;
		for (i = 0; i < charts.length; i++) {
			charts[i].selections_enabled(enabled);
		}
	};
	
	this.getAnnotationsBetweenForChart = function(chart, start, end) {
		var outputAry = [];
		for (var i = 0; i < chart.annotations.length; i++) {
			var annotation = chart.annotations[i];
			if (annotation.startingTimestamp > start && annotation.endingTimestamp < end) {
				outputAry.push(annotation);
			}
		}
		return outputAry;
	};
	
	this.getAnnotationsBetween = function(charts, start, end) {
		if (charts instanceof Array) {
			var outputAry = [];
			for (var i = 0; i < charts.length; i++) {
				var chartAnnotations = self.getAnnotationsBetweenForChart(charts[i], start, end);
				outputAry = outputAry.concat(chartAnnotations);
			}
			return outputAry;
		} else {
			return self.getAnnotationsBetweenForChart(charts, start, end);
		}
	};
	
	this.getAllRenderedSensorIds = function(chart) {
		var renderedIds = "";
		for (var i = 0; i < chart.renderers.length; i++) {
			var renderer = chart.renderers[i];
			for (var j = 0; j < renderer.ids.length; j++) {
				renderedIds += renderer.ids[j] + ",";
			}
		}
		return renderedIds.substring(0, renderedIds.length - 1);
	};
	
	this.getAnnotationsUnder = function(chart, start, end) {
		// |------[---]--------|
		// |        ^          |
		// ^ == [ < ^ && ^ < ]
		//console.log("Looking under : " + start + " - " + end);
		var selected = [];
		var annotations = chart.annotations;
		for (var i = 0; i < annotations.length; i ++) {
			var annotation = annotations[i];
			//console.log(annotation.startingTimestamp + " < " + start + " -- " + end + " > " + annotation.endingTimestamp);
			if (annotation.startingTimestamp < start && end < annotation.endingTimestamp) {
				selected.push(annotation);
			}
		}
		return selected;
	};
	
	this.getAnnotationsInTimestampOrder = function(chart) {
		// 
	};
}();

// deprecated!
var svgGraphHelper = SVGChartHelper;

function SVGChartYAxis() {
	'use strict';
	this.min_v = Number.MAX_VALUE;
	this.max_v = -Number.MAX_VALUE;
	
	this.manual_scale = false;
	
	this.colour = 'white';
	this.draw_gridlines = true;
	this.draw_ticks = true;
	this.draw_text = true;
	this.inverted = false;
	
	this.reset_min_max = function() {
		if (this.manual_scale === true) { return; }
		this.min_v = Number.MAX_VALUE;
		this.max_v = -Number.MAX_VALUE;
	};
	
	this.calc_min_max = function(dataset) {
		if (this.manual_scale === true) { return; }
		var ds_min = dataset.y_min_v;
		var ds_max = dataset.y_max_v;
		if (this.inverted === true) {
			var tmp;
			tmp = ds_min;
			ds_min = -ds_max;
			ds_max = -tmp;
		}
		if (this.min_v > ds_min) {
			this.min_v = ds_min;
		}
		if (this.max_v < ds_max) {
			this.max_v = ds_max;
		}
		if (this.max_v == this.min_v) {
			this.max_v = this.max_v + 1;
			this.min_v = this.min_v - 1;
		}
		/*
		if (this.inverted === true) {
			var tmp;
			tmp = this.min_v;
			this.min_v = -this.max_v;
			this.max_v = -tmp;
		}
		*/
	};
}

function SVGChart(container) {
	'use strict';
	this.container = container;
	if (typeof $(container).svg('get') === "undefined") {
		$(container).svg();
	}
	this.svg = $(container).svg('get');
	this.svg.element = $(container).find('svg');
	
	this.draw_circles = false;
	
	this.container = container;
	
	this.yaxes = [ new SVGChartYAxis(), new SVGChartYAxis() ];
	
	this.reset_min_max = function() {
		this.yaxes[0].reset_min_max();
		this.yaxes[1].reset_min_max();
	};
	
	this.allow_rightclick_selection = false;
	
	this.SELECTING_LEFTCLICK = 1;
	this.SELECTING_MIDDLECLICK = 2;
	this.SELECTING_RIGHTCLICK = 3;
	
	this._selections_enabled = true;
	
	// for this callback function to operate correctly you must ensure
	// an xaxis exists in the chart.
	this.selected_callback = function(self, start, end) {
		//alert("You finished a selection!");
	};
	this.number_formatter = formatNumber;

	this.hover_callback = function(self, destinationX, destinationY, xaxisPosition) {
		var i;
		var j;
		for (i = 0; i < this.renderers.length; i++) {
			var renderer = this.renderers[i];
			if (renderer.datasets === undefined) {
				return;
			}
			for (j = 0; j < renderer.datasets.length; j++) {
				var legend_label = renderer.legend_labels[j];
				var dataset = renderer.datasets[j];
				//legend_label.textContent = renderer.label + " " + dataset.x_min_v + " " + dataset.x_max_v + " " + (dataset.x_max_v < xaxisPosition) + " " + (xaxisPosition < dataset.x_min_v);
				//if (xaxisPosition < dataset.x_min_v || xaxisPosition > dataset.x_max_v) {
				if (dataset.x_max_v > xaxisPosition && dataset.x_min_v < xaxisPosition) {
					//legend_label.textContent = renderer.label + " " + "OOR";
					//legend_label.textContent = renderer.label + " _ " + (xaxisPosition / 1000);
					var dataIndex = SVGChartHelper.binarySearch(dataset.data, xaxisPosition);
					legend_label.textContent = renderer.label + " " + this.number_formatter(dataset.data[dataIndex][1], 4, '', '.', '', '', '-', ''); // + "  " + (xaxisPosition);
				} else {
					//legend_label.textContent = renderer.label + " " + (xaxisPosition / 1000);
				}
			}
		}
	};
	
	this.clear_selection = function() {
		$(this.selection_group).empty();
		this.selection_rect = null;
	};
	
	this.disable_selections = function() {
		this._selections_enabled = false;
	}
	
	this.enable_selections = function() {
		this._selections_enabled = true;
	}
	
	/** selecen must be a boolean value, bad things may happen otherwise **/
	this.selections_enabled = function(selecen) {
		this._selections_enabled = selecen;
	}
	
	var self = this;
	this.move_selection_to_destination_x = function(destinationX) {
		if (self.selection_rect === null || self.selection_rect === undefined) {
			self.selection_rect = self.svg.rect(self.selection_group, destinationX, self.geom.y - self.geom.height, 3, self.geom.height, 0, 0, { fill:'orange', fillOpacity:0.5 });
		} else {
			self.selection_rect.attributes['x'].value = destinationX;
			self.selection_rect.attributes['width'].value = 3;
		}
	}
	this.update_legend_with_selection_hover = function() {
		if (self.xaxis !== null && self.xaxis !== undefined) {
			var currpos = (parseInt(self.selection_rect.attributes['x'].value, 10) + 1) - self.geom.x;
			var pixelVal = (self.xaxis.max_v - self.xaxis.min_v) / self.geom.width;
			var xaxisPosition = Math.round(self.xaxis.min_v + currpos * pixelVal);
			var i;
			var j;
			for (i = 0; i < self.renderers.length; i++) {
				var renderer = self.renderers[i];
				if (renderer.datasets === undefined || renderer.datasets === null) {
					continue;
				}
				for (j = 0; j < renderer.datasets.length; j++) {
					var legend_label = renderer.legend_labels[j];
					var dataset = renderer.datasets[j];
					if (dataset.x_max_v > xaxisPosition && dataset.x_min_v < xaxisPosition) {
						var dataIndex = SVGChartHelper.binarySearch(dataset.data, xaxisPosition);
						legend_label.textContent = renderer.label + " " + self.number_formatter(dataset.data[dataIndex][1], 4, '', '.', '', '', '-', ''); // + "  " + (xaxisPosition);
					} else {
					}
				}
			}
		}
	}
	
	this.draw_axis = function(x, y, width, height) {
		var svg = this.svg;
		y = height + y;
		
		/* Ordering is important here! */
		var gridline_group = svg.group({stroke:'grey',strokeWidth:1,strokeOpacity:0.8,fill:'transparent'});
		var axis_group = svg.group();
		var inner_axis_group = svg.group({stroke:'white',strokeWidth:2,strokeOpacity:0.8,fill:'transparent'});
		var annotation_group = svg.group();
		var dataset_group = svg.group();
		var level_group = svg.group();
		var block_group = svg.group();
		var selection_group = svg.group();
		var legend_group = svg.group();
		var selection_handler_group = svg.group();
		
		// Draw axis
		var polyline = svg.polyline(inner_axis_group, [[x, y - height], [x, y], [x + width, y], [x + width, y - height]]);
		this.geom = new function() {
			this.x = x;
			this.y = y;
			this.width = width;
			this.height = height;
		}();
		
		this.selection_handler_rect = svg.rect(selection_handler_group, this.geom.x, this.geom.y - this.geom.height, this.geom.width, this.geom.height, 0, 0, { stroke:'transparent', fill:'transparent' });
		var self = this;
		this.selection_rect = null;
		self.selecting = false;
		this.selection_mousemove = function(eo) {
			var destinationX = eo.pageX - $(self.container).offset().left;  
			var destinationY = eo.pageY - $(self.container).offset().top;
			
			eo.preventDefault();
			
			if (self.selecting && (self.selection_rect !== null && self.selection_rect !== undefined)) {
				if (destinationX - self.selected_x < 0) {
					var x = self.selected_x;
					self.selection_rect.attributes['x'].value = destinationX;
					self.selection_rect.attributes['width'].value = x - destinationX; 
				} else {
					self.selection_rect.attributes['width'].value = destinationX - self.selection_rect.attributes['x'].value;
				}
			}
		};
		$(self.selection_handler_rect).mousemove(function(eo) {
			if (self.selecting) {
				return;
			}
			var destinationX = eo.pageX - $(self.container).offset().left - 1;
			var destinationY = eo.pageY - $(self.container).offset().top;
			if (self.selection_rect === null || self.selection_rect === undefined) {
				self.selection_rect = self.svg.rect(self.selection_group, destinationX, self.geom.y - self.geom.height, 3, self.geom.height, 0, 0, { fill:'orange', fillOpacity:0.5 });
			} else {
				self.selection_rect.attributes['x'].value = destinationX;
				self.selection_rect.attributes['width'].value = 3;
			}
			if (self.xaxis !== null && self.xaxis !== undefined) {
				var currpos = (parseInt(self.selection_rect.attributes['x'].value, 10) + 1) - self.geom.x;
				var pixelVal = (self.xaxis.max_v - self.xaxis.min_v) / self.geom.width;
				self.hover_callback(self, destinationX, destinationY, Math.round(self.xaxis.min_v + currpos * pixelVal));
			} else {
				self.hover_callback(self, destinationX, destinationY, null);
			}
		});
		$(this.selection_handler_rect).mousedown(function(eo) {
			// ignore middle and right clicks.
			// 2 is middle and 3 is right
			//console.log("mousedown " + self._selections_enabled);
			if (eo.which === 2 || (eo.which === 3 && self.allow_rightclick_selection === false) || self._selections_enabled === false) {
				return;
			}
			var destinationX = eo.pageX - $(self.container).offset().left - 3;
			var destinationY = eo.pageY - $(self.container).offset().top;
			
			eo.preventDefault();
			
			if (self.selection_rect === null || self.selection_rect === undefined) {
				self.selection_rect = self.svg.rect(self.selection_group, destinationX, self.geom.y - self.geom.height, 5, self.geom.height, 0, 0, { fill:'orange', fillOpacity:0.5 });
			} else {
				self.selection_rect.attributes['x'].value = destinationX;
				self.selection_rect.attributes['width'].value = 5;
			}
			self.selected_x = destinationX;
			self.selecting = true;
			self.selecting_which = eo.which;
			$(self.selection_handler_rect).on('mousemove.selection', self.selection_mousemove);
		});
		var finishSel = function(eo) {
			//if (eo.which === 3 && self.allow_rightclick_selection) {
			//	eo.preventDefault();
			//	eo.stopPropagation();
			//}
			if (self.selecting === true) {
				// selecting_which from the mouse down event (1 left, 2 middle, 3 right).
				self.selecting = false;
				$(this.selection_handler_rect).off('mousemove.selection');
				// Calculate the location of the selection if we have an xaxis.
				if (self.xaxis !== null) {
					// conversion from pixels to values on the x axis.
					var start = self.selection_rect.attributes['x'].value - self.geom.x;
					var end = start + parseFloat(self.selection_rect.attributes['width'].value);
					var pixelVal = (self.xaxis.max_v - self.xaxis.min_v) / self.geom.width;
					if (self.selected_callback !== null && self.selected_callback !== undefined) {
						self.selected_callback(self, Math.round(self.xaxis.min_v + start * pixelVal), Math.round(self.xaxis.min_v + end * pixelVal), eo);
					}
				} else {
					if (self.selected_callback !== null && self.selected_callback !== undefined) {
						self.selected_callback(self, null, null, eo);
					}
				}
			}
		};
		
		$(this.selection_handler_rect).mouseup(finishSel);
		$(this.selection_handler_rect).mouseleave(finishSel);
		
		this.gridline_group = gridline_group;
		this.axis_group = axis_group;
		this.selection_handler_group = selection_handler_group;
		this.block_group = block_group;
		this.annotation_group = annotation_group;
		this.level_group = level_group;
		this.selection_group = selection_group;
		this.dataset_group = dataset_group;
		this.legend_group = legend_group;
	};
	
	this.enable_contextmenu_select = function() {
		this.allow_rightclick_selection = true;
		$(this.container)[0].oncontextmenu = function(e) { e.preventDefault(); return false; }
		//$(this.container).on('contextmenu')
	};
	
	var internal_scaleExtent = function(domain) {
		var start = domain[0], stop = domain[domain.length - 1];
		return start < stop ? [ start, stop ] : [ stop, start ];
	};
	
	var internal_linearTickRange = function(domain, m) {
		if (m === null || m === undefined) m = 10;
		var extent = internal_scaleExtent(domain), span = extent[1] - extent[0], step = Math.pow(10, Math.floor(Math.log(span / m) / Math.LN10)), err = m / span * step;
		if (err <= 0.15) step *= 10; else if (err <= 0.35) step *= 5; else if (err <= 0.75) step *= 2;
		
		// option 1, the lowest value will "touch" the bottom axis
		//extent[0] = Math.ceil(extent[0] / step) * step;
		//extent[1] = Math.floor(extent[1] / step) * step + step * .5;
		
		// option 2
		// to include a bottom and a top nice value. e.g. step is 0.01 and top value is 0.075 then include 0.08
		// see also create linear axis ticks.
		extent[0] = Math.floor(extent[0] / step) * step;
		extent[1] = Math.ceil(extent[1] / step) * step;
		
		extent[2] = step;
		return extent;
	};
	
	var internal_scale_niceStep = function(step) {
		return {
			floor: function(x) {
				return Math.floor(x / step) * step;
			},
			ceil: function(x) {
				return Math.ceil(x / step) * step;
			}
		};
	};
	
	var internal_range_integerScale = function(x) {
		var k = 1;
		while (x * k % 1) k *= 10;
		return k;
	};
	
	this.make_axis_values = function(start, stop, step) {
		if (arguments.length < 3) {
			step = 1;
			if (arguments.length < 2) {
				stop = start;
				start = 0;
			}
		}
		if ((stop - start) / step === Infinity) throw new Error("infinite range");
		var range = [], k = internal_range_integerScale(Math.abs(step)), i = -1, j;
		start *= k;  stop *= k;  step *= k;
		var str_v;
		if (step < 0) {
			while ((j = start + step * ++i) > stop) {
				str_v = (j / k).toString();
				if (str_v.length > 9) {
					str_v = this.number_formatter(j / k, 3, '', '.', '', '', '-', '');
				}
				range.push([j / k, str_v]);
				}
		} else {
			while ((j = start + step * ++i) < stop) {
				str_v = (j / k).toString();
				if (str_v.length > 9) {
					str_v = this.number_formatter(j / k, 3, '', '.', '', '', '-', '');
				}
				range.push([j / k, str_v]);
			}
		}
		return range;
	};
	
	this.create_linear_axis_ticks = function(axis) {
		var noTicks = 5;
		var extent = internal_linearTickRange([axis.min_v, axis.max_v], noTicks);
		var niceCb = internal_scale_niceStep(extent[2]);
		axis.values = this.make_axis_values(niceCb.floor(extent[0]), niceCb.ceil(extent[1]), extent[2]);
		if (axis.inverted === true) {
			for (var i = 0; i < axis.values.length; i++) {
				axis.values[i][1] = -axis.values[i][1];
			}
			// little hack, we want to keep max_v the same as it was.
			// this means that the top area the graph is right on the maximum value
			// of the dataset...
			extent[1] = axis.max_v;
		}
		
		// rescale based on axis friendly values.
		// see also internal_linearTickRange
		axis.min_v = extent[0];
		axis.max_v = extent[1];
		return axis;
	};
	
	this.make_time_axis = function(axis) {
		// TODO make nice time axis values for the axis provided.
		// This has been delegated to a separate class... see below.
	};
	
	this.simple_linear_translator = function(min_v, max_v, pixelsz, value) {
		value = (value - min_v) / (max_v - min_v) * pixelsz;
		return value;
	};
	
	this.draw_x_values = function(axis) {
		var min_v = axis.min_v;
		var max_v = axis.max_v;
		var values = axis.values;
		var geom = this.geom;
		var svg = this.svg;
		var colour = axis.colour;
		var line_group = null;
		var text_group = null;
		var local_gridline_group = null;
		if (axis.draw_ticks) {
			line_group = svg.group(this.axis_group, {stroke:colour,strokeWidth:1});
		}
		if (axis.draw_gridlines) {
			local_gridline_group = svg.group(this.gridline_group);
		}
		if (axis.draw_text) {
			text_group = svg.group(this.axis_group, {fill:colour,textAnchor:'middle',fontFamily:'sans-serif',fontSize:10,zIndex:5});
		}
		for (var i = 0; i < values.length; i++) {
			var pos = this.simple_linear_translator(min_v, max_v, geom.width, values[i][0]);
			if (axis.draw_ticks) {
				var line = svg.line(line_group, geom.x + pos, geom.y, geom.x + pos, geom.y + 5);
			}
			if (axis.draw_gridlines) {
				svg.line(local_gridline_group, geom.x + pos, geom.y - geom.height, geom.x + pos, geom.y);
			}
			if (axis.draw_text) {
				var text = svg.createText();
				text.span(values[i][1]);
				var text_elm = svg.text(text_group, geom.x + pos, geom.y, text);
				$(text_elm).attr('y', geom.y + text_elm.getBoundingClientRect().height + 2);
			}
		}
		return [text_group, line_group, local_gridline_group];
	};
	
	this.draw_y_values = function(axis, index) {
		var values = axis.values;
		var geom = this.geom;
		var svg = this.svg;
		var draw_gridlines = axis.draw_gridlines;
		var local_gridline_group = null;
	
		var text_group = null;
		if (index === undefined) {
			index = 0;
		}
		if (index === 0 || index == 2) {
			text_group = svg.group(this.axis_group, {textAnchor:'end',fill:axis.colour,fontFamily:'sans-serif',fontSize:10,zIndex:5});
		}
		if (index == 1 || index == 3) {
			text_group = svg.group(this.axis_group, {textAnchor:'start',fill:axis.colour,fontFamily:'sans-serif',fontSize:10,zIndex:5});
			draw_gridlines = false;
		}
		if (index == 2) {
			draw_gridlines = false;
		}
		var line_group = svg.group(this.axis_group, {stroke:axis.colour,strokeWidth:1,fill:'transparent'});
		
		var tx = this.geom.x - 8;
		var lx = this.geom.x;
		var tick_width = -5;
		if (index == 1 || index == 3) {
			tick_width = 5;
			tx = this.geom.x + this.geom.width + 8;
			lx = this.geom.x + this.geom.width;
		}
		var maxwidth = 0;
		var text = null;
		if (draw_gridlines) {
			local_gridline_group = svg.group(this.gridline_group);
		}
		for (var i = 0; i < values.length; i ++) {
			var pos = this.simple_linear_translator(axis.min_v, axis.max_v, geom.height, values[i][0]);
			svg.line(line_group, lx + tick_width, geom.y - pos, lx, geom.y - pos);
			if (draw_gridlines) {
				svg.line(local_gridline_group, geom.x, geom.y - pos, geom.x + geom.width, geom.y - pos);
			}
			text = svg.createText();
			text.string(values[i][1]);
			var ticktext = svg.text(text_group, tx, geom.y - pos, text, {dy: '0.35em'});
			var bbox = ticktext.getBBox();
			if (bbox.width > maxwidth) {
				maxwidth = bbox.width;
			}
		}
		
		if (axis.label !== undefined && axis.label !== null) {
			text = svg.createText();
			text.string(axis.label);
			var yloc = geom.y - (geom.height/2);
			var xloc = geom.x - 50;
			var angle = 270;
			if (index == 1) {
				xloc = geom.x + geom.width + 50;
				angle = 90;
			}
			var axislabel = svg.text(text_group, xloc, yloc, text, {style:'font-size:15px',textAnchor:'middle', dy: '0.35em', transform:'rotate('+angle+','+xloc+','+yloc+')'});
		}
		return [text_group, line_group, local_gridline_group];
	};
	
	this.internal_drawCircles = function(line_group, circle_colour, points) {
		var svg = this.svg;
		for (var j = 0; j < points.length; j++) {
			var circle = svg.circle(line_group, points[j][0], points[j][1], 2.5, {
				fill:circle_colour, stroke:circle_colour, strokeWidth:1, opacity:0.75 });
		}
	};
	
	this.internal_drawPolyLine = function(line_group, circle_colour, points, polyLines) {
		var svg = this.svg;
		if (points.length >= 2) {
			polyLines.push(svg.polyline(line_group, points));
		}
	};
	
	this.internal_draw_level = function(xaxis, yaxis, level, meta) {
		if (level === null) { return; }
		var i_levelv = level.value;
		if (yaxis.inverted === true) { i_levelv = -level.value; }
		if (i_levelv > yaxis.max_v || i_levelv < yaxis.min_v) { return; }
		var loc_y = this.geom.y - this.simple_linear_translator(yaxis.min_v, yaxis.max_v, this.geom.height, i_levelv);
		var points = [ [this.geom.x, loc_y], [this.geom.x + this.geom.width, loc_y] ];
		//console.log(JSON.stringify(points) + " " + JSON.stringify(level));
		this.svg.polyline(this.level_group, points, {stroke:level.colour});
	};
	
	this.internal_draw_linechart_dataset = function(xaxis, yaxis, dataset, meta) {
		var svg = this.svg;
		var colour = meta.colour === undefined ? 'blue' : meta.colour;
		var line_group = svg.group(this.dataset_group, {stroke:colour,strokeWidth:1,fill:'transparent',id:'series'});
		var points = [];
		var polyLines = [];
		var circles = [];
		var i = 0;
		/* Skip any data points before the start of the specified x axis range */
		for (i = 0; i < dataset.length; i++) {
			if (xaxis.min_v > dataset[i][0]) {
				continue;
			} else {
				if (i > 0) {
					var a = this.simple_linear_translator(xaxis.min_v, xaxis.max_v, this.geom.width, dataset[i - 1][0]);
					var b = this.simple_linear_translator(xaxis.min_v, xaxis.max_v, this.geom.width, dataset[i][0]);
					var td = b - a;
					a = -a;
					var val = (dataset[i][1] - dataset[i - 1][1]) * (a/td) + dataset[i - 1][1];
					var point = [this.geom.x, this.geom.y - this.simple_linear_translator(yaxis.min_v, yaxis.max_v, this.geom.height, val)];
					points.push(point);
				}
				break;
			}
		}
		for (; i < dataset.length; i++) {
			/* Skip any after the end of the specified x axis range */
			if (xaxis.max_v < dataset[i][0]) {
				if (i > 0) {
					var a = this.simple_linear_translator(xaxis.min_v, xaxis.max_v, this.geom.width, dataset[i - 1][0]) - (this.geom.width);
					var b = this.simple_linear_translator(xaxis.min_v, xaxis.max_v, this.geom.width, dataset[i][0]) - (this.geom.width);
					var td = b - a;
					a = -a;
					var val = (dataset[i][1] - dataset[i - 1][1]) * (b/td) + dataset[i - 1][1];
					var point = [this.geom.x + this.geom.width, this.geom.y - this.simple_linear_translator(yaxis.min_v, yaxis.max_v, this.geom.height, val)];
					points.push(point);
				}
				break;
			}
			if (dataset[i][1] !== null && !isNaN(dataset[i][1])) {
				/* calculate y axis location */
				var point = [this.geom.x + this.simple_linear_translator(xaxis.min_v, xaxis.max_v, this.geom.width, dataset[i][0]),
					this.geom.y - this.simple_linear_translator(yaxis.min_v, yaxis.max_v, this.geom.height, dataset[i][1])];
				points.push(point);
			} else {
				if (this.draw_circles === false && points.length == 1) {
					// Draw a circle for this point?
					this.internal_drawCircles(line_group, colour, points);
				}
				this.internal_drawPolyLine(line_group, colour, points, polyLines);
				if (this.draw_circles) {
					this.internal_drawCircles(line_group, colour, points);
				}
				points = [];
			}
		}
		if (this.draw_circles == false && points.length == 1) {
			// Draw a circle for this point?
			this.internal_drawCircles(line_group, colour, points);
		}
		this.internal_drawPolyLine(line_group, colour, points, polyLines);
		if (this.draw_circles) {
			this.internal_drawCircles(line_group, colour, points);
		}
		return line_group;
	};
	
	this.internal_drawbar = function(a, b, c, mybarwidth, colour, inverted) {
		var height = b - c;
		var vloc = this.geom.y - c - height;
		if (height <= 0) {
			vloc = this.geom.y - c;
			height = c - b;
			if (height < 1) {
				height = 1;
				if (inverted !== true) {
					vloc = vloc - height;
				}
			}
		}
		if (vloc + height > this.geom.y) {
			height = this.geom.y - vloc;
		}
		this.svg.rect(this.dataset_group, a, vloc, mybarwidth, height, {fill:colour, fillOpacity:0.5, strokeWidth:1, stroke:colour});
	};
	
	// Required from meta: colour, interval
	this.internal_draw_barchart_dataset = function(xaxis, yaxis, dataset, meta) {
		var barwidth = this.simple_linear_translator(xaxis.min_v, xaxis.max_v, this.geom.width, xaxis.min_v + meta.interval);
		var colour = meta.colour;
		var svg = this.svg;
		var i = 0;
		var halfinterval = meta.interval / 2;
		
		// Base of the bar (this can be higher than the "top" of the bar, think of -ve values
		var barbase = 0.0;
		if (yaxis.inverted === true) {
			if (yaxis.max_v < 0.0) {
				barbase = yaxis.max_v;
			}
		} else {
			if (yaxis.min_v > 0.0) {
				barbase = yaxis.min_v;
			}
		}
		var c = this.simple_linear_translator(yaxis.min_v, yaxis.max_v, this.geom.height, barbase);
		
		/* Skip any data points before the start of the specified x axis range */
		for (i = 0; i < dataset.length; i++) {
			if (xaxis.min_v - (meta.interval / 2) > dataset[i][0]) {
				continue;
			} else if (dataset[i][1] !== null && !isNaN(dataset[i][1])) {
				// Draw first bar (special because we may make the width smaller
				var a = this.simple_linear_translator(xaxis.min_v, xaxis.max_v, this.geom.width, dataset[i][0] - halfinterval);
				var pointvalue = dataset[i][1];
				if (yaxis.inverted === true) { pointvalue = -pointvalue; }
				var b = this.simple_linear_translator(yaxis.min_v, yaxis.max_v, this.geom.height, pointvalue);
				a = a - barwidth / 2;
				a = a + this.geom.x;
				var mybarwidth = barwidth;
				if (a < this.geom.x) {
					mybarwidth = barwidth - (this.geom.x - a);
					a = this.geom.x;
				}
				// if this bar is going to overlap the end, stop it from doing so!
				if ((a + mybarwidth) > (this.geom.x + this.geom.width)) {
					mybarwidth = (this.geom.x + this.geom.width) - a;
					a = this.geom.x + this.geom.width - mybarwidth;
				}
				this.internal_drawbar(a, b, c, mybarwidth, colour, yaxis.inverted);
				break;
			}
		}
		i++;
		for (; i < dataset.length; i++) {
			if (dataset[i][1] !== null && !isNaN(dataset[i][1])) {
				var a = this.simple_linear_translator(xaxis.min_v, xaxis.max_v, this.geom.width, dataset[i][0] - halfinterval);
				var pointvalue = dataset[i][1];
				if (yaxis.inverted === true) { pointvalue = -pointvalue; }
				var b = this.simple_linear_translator(yaxis.min_v, yaxis.max_v, this.geom.height, pointvalue);
				a = a - barwidth / 2;
				a = a + this.geom.x;
				var mybarwidth = barwidth;
				
				// Keep the bar from overlapping the left side of the chart.
				if (a < this.geom.x) {
					mybarwidth = barwidth - (this.geom.x - a);
					a = this.geom.x;
				}
				
				// Keep the bar from overlapping the right side of the chart.
				if ((a + mybarwidth) > (this.geom.x + this.geom.width)) {
					mybarwidth = (this.geom.x + this.geom.width) - a;
					a = this.geom.x + this.geom.width - mybarwidth;
					this.internal_drawbar(a, b, c, mybarwidth, colour, yaxis.inverted);
					break;
				}
				this.internal_drawbar(a, b, c, mybarwidth, colour, yaxis.inverted);
			}
		}
	};
	
	// SEE ALSO remove_annotations();
	this.remove_chart_graphics = function() {
		$(this.gridline_group).empty();
		$(this.dataset_group).empty();
		$(this.axis_group).empty();
		$(this.legend_group).empty();
		$(this.level_group).empty();
		$(this.block_group).empty();
		$(this.annotation_group).empty();
		this.legend = undefined;
	}
	
	this.remove_datasets = function() {
		this.remove_chart_graphics();
		this.datasets = [];
		this.annotations = [];
	};
	
	function contains(a, obj) {
		for (var i = 0; i < a.length; i++) {
			if (a[i] === obj) {
				return true;
			}
		}
		return false;
	}
	
	this.add_legend = function(renderer, dataset) {
		// TODO: move this stuff to a create_legend function or something
		var svg = this.svg;
		var text;
		text = svg.createText();
		if (renderer.label === undefined) {
			renderer.label = "Dataset";
		}
		if (this.legend === undefined || this.legend === null) {
			this.legend = {};
			this.legend.labels = [];
			this.legend.svg = svg.svg(this.legend_group, this.geom.x + 10, this.geom.y - (this.geom.height - 10), 800, 200);
			this.legend.surrounding_box = svg.rect(this.legend.svg, 1, 1, 100, 20, { opacity:0.75, fill:"#444444" });
			this.legend.max_width = 100;
		}
		var legend = this.legend;
		text.string(renderer.label);
		var yoffs = 1;
		if (legend.labels.length > 0) {
			var bbox = legend.labels[legend.labels.length - 1].getBBox();
			yoffs = bbox.y + bbox.height;
		}
		var xoffs = 4;
		svg.circle(legend.svg, xoffs + 7, yoffs + 9, 5, { fill:renderer.colour });
		var mytext = svg.text(legend.svg, xoffs + 15, yoffs, text, { dy:"1em", fill:"white" });
		var bbox = mytext.getBBox();
		legend.surrounding_box.attributes['height'].value = yoffs + bbox.height;
		if (this.legend.max_width < bbox.width) {
			this.legend.max_width = bbox.width;
		}
		legend.surrounding_box.attributes['width'].value = this.legend.max_width + 15 + 5 + 60;
		this.legend.labels.push(mytext);
		return mytext;
	};
	
	this.renderers = [];
	this.add_renderer = function(renderer) {
		if (renderer.accepts === undefined) {
			renderer.accepts = function(dataset) {
				if (contains(renderer.ids, dataset.id)) {
					return true;
				}
				return false;
			}
		}
		if (renderer.type === undefined) {
			renderer.type = "line";
		}
		this.renderers.push(renderer);
	};
	this.can_render = function(dataset) {
		for (var i = 0; i < this.renderers.length; i++) {
			if (this.renderers[i].accepts(dataset)) {
				return true;
			}
		}
		return false;
	};
	this.render = function() {
		// TODO: Possble bug that will not allow finer (closer together) min and max.
		// TODO: fix it.
		for (var i = 0; i < this.renderers.length; i++) {
			var renderer = this.renderers[i];
			// empty the datasets
			renderer.datasets = [];
			renderer.legend_labels = [];
			for (var j = 0; j < this.datasets.length; j++) {
				var dataset = this.datasets[j];
				if (renderer.accepts(dataset)) {
					this.yaxes[renderer.yaxis_idx].calc_min_max(dataset);
				}
			}
		}
		
		try {
			this.create_linear_axis_ticks(this.yaxes[0]);
			this.draw_y_values(this.yaxes[0], 0);
			if (this.yaxes[1].max_v != -Number.MAX_VALUE) {
				this.create_linear_axis_ticks(this.yaxes[1]);
				this.draw_y_values(this.yaxes[1], 1);
			}
		} catch (error) {
			console.log("Error \"" + error + "\" in chart.render()");
		}
		
		if (this.xaxis !== undefined && this.xaxis !== null) {
			this.xaxis_parts = this.draw_x_values(this.xaxis);
		}
		
		var datasetsdrawn;
		for (var i = 0; i < this.renderers.length; i++) {
			var renderer = this.renderers[i];
			datasetsdrawn = 0;
			for (var j = 0; j < this.datasets.length; j++) {
				var dataset = this.datasets[j];
				if (renderer.accepts(dataset)) {
					if (dataset.data.length > 0) {
						datasetsdrawn ++;
						renderer.legend_labels.push(this.add_legend(renderer));
						renderer.datasets.push(dataset);
					}
					if (renderer.type == "line") {
						this.internal_draw_linechart_dataset(this.xaxis, this.yaxes[renderer.yaxis_idx], dataset.data, renderer);
					} else
					if (renderer.type == "bar") {
						this.internal_draw_barchart_dataset(this.xaxis, this.yaxes[renderer.yaxis_idx], dataset.data, renderer);
					}
				}
			}
		}
		
		for (var i = 0; i < this.renderers.length; i++) {
			var renderer = this.renderers[i];
			//console.log(JSON.stringify(renderer));
			if (renderer.levels !== undefined) {
				for (var j = 0; j < renderer.levels.length; j++) {
					var level = renderer.levels[j];
					//console.log(JSON.stringify(level));
					this.internal_draw_level(this.xaxis, this.yaxes[renderer.yaxis_idx], level, renderer);
				}
			}
		}
		
		// if no datasets were drawn on the graph, put a little message there saying so!
		if (datasetsdrawn === 0) {
			var svg = this.svg;
			var geom = this.geom;
			var text = svg.createText();
			text.string("No Data Available");
			var yloc = geom.y - (geom.height/2);
			var xloc = geom.x + (geom.width/2);
			var axislabel = svg.text(this.dataset_group, xloc, yloc, text, {style:'font-size:25px',textAnchor:'middle', dy: '0.35em', transform:'rotate('+0+','+xloc+','+yloc+')'});
		}
	};
	this.get_renderer_ids = function() {
		var ids = [];
		for (var i = 0; i < this.renderers.length; i++) {
			for (var j = 0; j < this.renderers[i].ids.length; j++) {
				ids.push(this.renderers[i].ids[j]);
			}
		}
		return ids;
	};
	
	this.datasets = [];
	this.add_dataset = function(dataset) {
		this.datasets.push(dataset);
	};
	
	// ==============================================================================================================================================
	// Blocks and Annotations
	
	// Could perhaps merge these two functions as we don't use blocks for anything else... though they could be used for weekends??
	// Draw a block and if it overlaps the start or the end truncate it so that it looks nice.
	this.add_block = function(xaxis, starting, ending, meta, group) {
		if (meta.color === undefined && meta.colour === undefined) { meta.colour = 'green'; }
		if (meta.color !== undefined) { meta.colour = meta.color; }
		if (meta.opacity === undefined) { meta.opacity = 0.5; }
		var startpx = this.simple_linear_translator(xaxis.min_v, xaxis.max_v, this.geom.width, starting);
		if (startpx < 0) {
			startpx = 0;
		}
		var widthpx = this.simple_linear_translator(xaxis.min_v, xaxis.max_v, this.geom.width, ending) - startpx;
		startpx += this.geom.x;
		if (group === undefined || group === null) {
			group = this.block_group;
		}
		if (startpx + widthpx > this.geom.x + this.geom.width) {
			widthpx = (this.geom.x + this.geom.width) - startpx;
		}
		var rect = this.svg.rect(group, startpx, this.geom.y - this.geom.height, widthpx, this.geom.height, 0, 0, { stroke:'transparent', fill:meta.colour, fillOpacity:meta.opacity });
		return rect;
	};
	
	this.annotations = [];
	this.annotations_changed_callback = null;
	this.annotations_display_changed_callback = null;
	
	this.__add_annotation = function(xaxis, annotation_meta) {
		var starting = annotation_meta.startingTimestamp;
		var ending = annotation_meta.endingTimestamp;
		
		if (annotation_meta.colour === undefined || annotation_meta.colour === undefined) {
			annotation_meta.colour = "green";
		}
		annotation_meta.block = this.add_block(xaxis, annotation_meta.startingTimestamp, annotation_meta.endingTimestamp, { colour: annotation_meta.colour, opacity: 0.25 }, this.annotation_group);
		
		if (!(annotation_meta.summary === undefined || annotation_meta.summary === null || annotation_meta.summary === "")) { 
			var text = this.svg.createText();
			text.string(annotation_meta.summary);
			
			var startpx = this.simple_linear_translator(xaxis.min_v, xaxis.max_v, this.geom.width, starting);
			// if the starting location is too early then don't fall into the axis label area.
			if (startpx < 0) {
				startpx = 0;
			}
			var widthpx = this.simple_linear_translator(xaxis.min_v, xaxis.max_v, this.geom.width, ending) - startpx;
			startpx += this.geom.x;
			
			var yloc = this.geom.y - (this.geom.height/2);
			var xloc = startpx;
			var angle = 270;
			var annotation_label = this.svg.text(this.annotation_group, xloc, yloc, text, {fill:"gray",style:'font-size:15px',textAnchor:'middle', dy: '1.35em', transform:'rotate('+angle+','+xloc+','+yloc+')'});
			annotation_meta.label = annotation_label;
		}
		
		/* very simple insertion sort */
		/** CAREFUL WITH THIS LOGIC... SEE THE RETURN STATEMENT!? **/
		for (var i = 0; i < this.annotations.length; i++) {
			if (this.annotations[i].startingTimestamp > annotation_meta.startingTimestamp) {
				this.annotations.splice(i, 0, annotation_meta);
				return annotation_meta;
			}
		}
		this.annotations.push(annotation_meta);
		return annotation_meta;
	};
	
	this.add_annotation_new = function(annotation_meta) {
		/* very simple insertion sort, could this be improved with a binary search to find the nearest location? */
		/** CAREFUL WITH THIS LOGIC... SEE THE RETURN STATEMENT!? **/
		for (var i = 0; i < this.annotations.length; i++) {
			if (this.annotations[i].startingTimestamp > annotation_meta.startingTimestamp) {
				this.annotations.splice(i, 0, annotation_meta);
				return annotation_meta;
			}
		}
		this.annotations.push(annotation_meta);
		return annotation_meta;
	};
	
	// generator should be a LetterAndNumberGenerator() object.
	this.display_annotations = function(xaxis, generator) {
		if (generator === undefined || generator === null) {
			generator = new LetterAndNumberGenerator();
		}
		for (var i = 0; i < this.annotations.length; i++) {
			var annotation_meta = this.annotations[i];
			
			annotation_meta.text = generator.generateIdentity();
			
			if (annotation_meta.block === null || annotation_meta.block === undefined) {
				var starting = annotation_meta.startingTimestamp;
				var ending = annotation_meta.endingTimestamp;
				
				if (annotation_meta.colour === undefined || annotation_meta.colour === undefined) {
					annotation_meta.colour = "green";
				}
				annotation_meta.block = this.add_block(xaxis, annotation_meta.startingTimestamp, annotation_meta.endingTimestamp, { colour: annotation_meta.colour, opacity: 0.25 }, this.annotation_group);
				
				var text = this.svg.createText();
				text.string(annotation_meta.text);
				
				var startpx = this.simple_linear_translator(xaxis.min_v, xaxis.max_v, this.geom.width, starting);
				// if the starting location is too early then don't fall into the axis label area.
				if (startpx < 0) {
					startpx = 0;
				}
				var widthpx = this.simple_linear_translator(xaxis.min_v, xaxis.max_v, this.geom.width, ending) - startpx;
				startpx += this.geom.x;
				
				var yloc = this.geom.y - (this.geom.height/2);
				var xloc = startpx;
				var angle = 270;
				var annotation_label = this.svg.text(this.annotation_group, xloc, yloc, text, {fill:"gray",style:'font-size:15px',textAnchor:'middle', dy: '1.35em', transform:'rotate('+angle+','+xloc+','+yloc+')'});
				annotation_meta.label = annotation_label;
			} else {
				// here we are going to simply change the letter in the svg text area... I hope!
				$(annotation_meta.label).text(annotation_meta.text);
			}
		}
		if (this.annotations_display_changed_callback !== null && this.annotations_display_changed_callback !== undefined) {
			this.annotations_display_changed_callback(this, this.annotations);
		}
	};
	
	this.remove_annotation = function(annotation_meta) {
		var generator = new LetterAndNumberGenerator();
		if (annotation_meta.label !== null && annotation_meta.label !== undefined) {
			$(annotation_meta.label).remove();
		}
		$(annotation_meta.block).remove();
		for (var i = 0; i < this.annotations.length; i++) {
			if (this.annotations[i] === annotation_meta) {
				this.annotations.splice(i, 1);
				i--;
			} else {
				var i_annotation_meta = this.annotations[i];
				i_annotation_meta.text = generator.generateIdentity();
				$(i_annotation_meta.label).text(i_annotation_meta.text);
			}
		}
		
		if (this.annotations_display_changed_callback !== null && this.annotations_display_changed_callback !== undefined) {
			this.annotations_display_changed_callback(this, this.annotations);
		}
	};
	
	this.remove_annotations = function(annotations) {
		if (annotations === undefined || annotations === this.annotations) {
			this.annotations = [];
			$(this.annotation_group).empty();
		} else {
			for (var i = 0; i < annotations.length; i++) {
				this.remove_annotation(annotations[i]);
			}
		}
		
		if (this.annotations_display_changed_callback !== null && this.annotations_display_changed_callback !== undefined) {
			this.annotations_display_changed_callback(this, this.annotations);
		}
	};
}

function SVGChartNiceTimes() {
	'use strict';
	this.months = [
			"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
		];

	var timeUnitSize = {
		"second": 1000,
		"minute": 60 * 1000,
		"hour": 60 * 60 * 1000,
		"day": 24 * 60 * 60 * 1000,
		"month": 30 * 24 * 60 * 60 * 1000,
		"quarter": 3 * 30 * 24 * 60 * 60 * 1000,
		"year": 365.2425 * 24 * 60 * 60 * 1000
	};

	this.baseSpec = [
		[1, "second"], [2, "second"], [5, "second"], [10, "second"],
		[30, "second"], 
		[1, "minute"], [2, "minute"], [5, "minute"], [10, "minute"],
		[30, "minute"], 
		[1, "hour"], [2, "hour"], [4, "hour"],
		[8, "hour"], [12, "hour"],
		[1, "day"], [2, "day"], [3, "day"],
		[0.25, "month"], [0.5, "month"], [1, "month"],
		[2, "month"], [3, "month"], [6, "month"],
		[1, "year"]
	];
	
	function floorInBase(n, base) {
		return base * Math.floor(n / base);
	}

	this.get_axis_values = function(begin, end, count) {
		var delta = (end - begin) / count;
		var spec = this.baseSpec;
		var minsize = 0;
		for (var i = 0; i < spec.length - 1; ++i) {
			if (delta < (spec[i][0] * timeUnitSize[spec[i][1]] + spec[i + 1][0] * timeUnitSize[spec[i + 1][1]]) / 2
				&& spec[i][0] * timeUnitSize[spec[i][1]] >= minsize) {
				break;
			}
		}
		var size = spec[i][0];
		var unit = spec[i][1];
		var step = size * timeUnitSize[unit];
		var ticks = [];
		var d = new Date(begin);
		d.setMilliseconds(0);
		if (step >= timeUnitSize.minute) {
			d.setUTCSeconds(0);
		}
		if (step >= timeUnitSize.hour) {
			d.setUTCMinutes(0);
		}
		if (step >= timeUnitSize.day) {
			d.setUTCHours(0);
		}
		if (step >= timeUnitSize.day * 4) {
			d.setUTCDate(1);
		}
		if (step >= timeUnitSize.month * 2) {
			d.setUTCMonth(floorInBase(d.getMonth(), 3));
		}
		if (step >= timeUnitSize.quarter * 2) {
			d.setUTCMonth(floorInBase(d.getMonth(), 6));
		}
		if (step >= timeUnitSize.year) {
			d.setUTCMonth(0);
		}
		var ts = d.getTime();
		while (ts < begin) {
			ts += step;
		}
		
		var begin_ts = new Date(begin);
		var end_ts = new Date(end);
		if (unit == 'second') {
			do {
				d = new Date(ts);
				var str;
				str = d.getUTCHours() + ":";
				str += d.getUTCMinutes() < 10 ? '0' + d.getUTCMinutes() : d.getUTCMinutes();
				str += '.';
				str += d.getUTCSeconds() < 10 ? '0' + d.getUTCSeconds() : d.getUTCSeconds();
				ticks.push([ ts, str ]);
				ts += step;
			} while (ts <= end);
		}
		if (unit == 'minute' || unit == 'hour') {
			do {
				d = new Date(ts);
				var str = d.getUTCMinutes() < 10 ? '0' + d.getUTCMinutes() : d.getUTCMinutes();
				ticks.push([ ts, d.getUTCHours() + ":" + str ]);
				ts += step;
			} while (ts <= end);
		}
		if (unit == 'day' || unit == 'month') { 
			do {
				d = new Date(ts);
				ticks.push([ ts, d.getUTCDate() + ' ' + this.months[d.getUTCMonth()] ]);
				ts += step;
			} while (ts <= end);
		}
		if (unit == 'year') {
			do {
				d = new Date(ts);
				ticks.push([ ts, d.getUTCFullYear() ]);
				ts += step;
			} while (ts <= end);
		}
		return ticks;
	};
}

function SVGFadeHelper(element) {
	'use strict';
	this.element = element;
	this.each_frame = function(ele, progress) {
		if (ele != null) {
			ele.setAttribute("stroke-opacity", progress);
			ele.setAttribute("fill-opacity", progress);
		}
	};
	this.done_cb = function(ele) {
		ele.remove();
	}
	var self = this;
	var prev_timestamp = null;
	var elapsed = 0;
	var duration = 500;
	var done = false;
	var frame_callback = function(timestamp) {
		if (prev_timestamp === null) {
			prev_timestamp = timestamp;
		}
		elapsed = timestamp - prev_timestamp;
		var opacity = 1.0 - (elapsed / duration);
		if (elapsed >= duration) {
			done = true;
			opacity = 0.0;
		}
		if (self.element != null) {
			if (self.element instanceof Array) {
				self.element.forEach(function(inner_element) {
					if (inner_element != null) {
						self.each_frame(inner_element, opacity);
					}
				});
			} else {
				self.each_frame(self.element, opacity);
			}
		}
		if (!done) {
			window.requestAnimationFrame(frame_callback);
		} else {
			if (self.element instanceof Array) {
				self.element.forEach(function(ele) { if (ele != null) { self.done_cb(ele); } });
			} else {
				if (self.element != null) { self.done_cb(self.element); }
			}
		}
	}
	this.play = function() {
		self.done = false;
		window.requestAnimationFrame(frame_callback);
	}
}

/*
(new SVGChartNiceTimes()).get_axis_values(1375459200000, 1376323440000, 10);
(new SVGChartNiceTimes()).get_axis_values(1375459200000, 1375500000000, 10);
(new SVGChartNiceTimes()).get_axis_values(1375459200000, 1378500000000, 10);
(new SVGChartNiceTimes()).get_axis_values(1375459200000, 1388500000000, 10);
*/
