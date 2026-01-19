// Functions to convert simple range inputs from users to numbers used by the computer

var SimpleRangeFunctions = new function() {
	// convert a string like this: XXX.XX-XXX.XX, or XXX.XX - XXX.XX
	// Will also handle -ve values, -XXX.XX--XXX.XX is valid, so is -XXX.XX - -XXX.XX but ---XXX.XX is not.
	this.convertFromString = function(rangeStr) {
		if (rangeStr == null || rangeStr.indexOf('-') === -1) {
			return null;
		}
		var offset = 0;
		var sepidx = 0;
		if (rangeStr.indexOf('-') === 0) {
			offset = 1;
		}
		sepidx = rangeStr.indexOf('-', offset);
		if (sepidx == -1 || sepidx == 0) {
			return null;
		}
		var ary = [ rangeStr.substr(0, sepidx), rangeStr.substr(sepidx + 1) ];
		ary[0] = ary[0].trim();
		ary[1] = ary[1].trim();
		var retVal = [ parseFloat(ary[0]), parseFloat(ary[1]) ];
		if (isNaN(retVal[0]) || isNaN(retVal[1])) {
			return null;
		}
		return retVal;
	};
	
	this.parseDateRange = function(dateRangeStr) {
		var parts = dateRangeStr.split(" - ");
		if (parts.length != 2) { return null; }
		var st = moment.utc(parts[0], 'YYYY-MM-DD HH:mm:ss').valueOf();
		var en = moment.utc(parts[1], 'YYYY-MM-DD HH:mm:ss').valueOf();
		if (isNaN(st) || isNaN(en)) {
			res = null;
		} else {
			var res = [ st, en ];
		}
		return res;
	};
	
	this.formatDateRange = function(start, end) {
		start = 0+start;
		end = 0+end;
		return moment.utc(start).format('YYYY-MM-DD HH:mm:ss') + ' - ' + moment.utc(end).format('YYYY-MM-DD HH:mm:ss');
	};
}
