/*
	bif.js
	2015-2019 Brad Murray
*/

var BIFReader = function(url) {
	this.biffile = url;
	this.idx = [];
	this.count = 0;
	this.multiplier = 0;
	this.xhr = false;
}

BIFReader.prototype = {
	a2hex: function(str) {
	  var arr = [];
	  for (var i = 0, l = str.length; i < l; i ++) {
		var hex = Number(str.charCodeAt(i)).toString(16);
		arr.push((hex.length < 2 ? "0" : "")+hex);
	  }
	  return arr.join('');
	},

	// really ugly, but works
	uint32le_to_number: function(str) {
		var str_be = str[3]+str[2]+str[1]+str[0];
		return parseInt("0x"+this.a2hex(str_be),16);
	},

	load: function(callback,progress) {
		this.xhr = new XMLHttpRequest();
		var self = this;

		this.xhr.onload = function(e) {
			self.fileblob = new Blob([self.xhr.response], {type: 'application/octet-stream'});
			self.loaded(self,callback);
		}

		if(callback) this.xhr.onerror = this.xhr.onabort = function() {
			callback.call(self, false);
		}

		if(progress) this.xhr.onprogress = function(evt) {
			if(evt.lengthComputable) {
				progress.call(self, (evt.loaded / evt.total).toFixed(3));
			}
		};

		this.xhr.open('GET', this.biffile, true);
		this.xhr.responseType = 'blob';

		this.xhr.send();
	},

	loaded: function(self,callback) {
		// bytes 0-7 bytes are the magic number
		// bytes 8-11 are the version currently 0
		// bytes 12-15 unit32 number of bif images
		// bytes 16-19 uint32 timestamp multiplier in ms... 0 = 1000ms
		// bytes 20-63 reserved
		// bif index - starts at 64... 1 for each frame:
		//		0-4 (64-67) = timestamp
		//		5-8 (68-71) = byte offset

		var fblob = self.fileblob;
		var r = new FileReader();
		var blob = fblob.slice(0, 20);
		r.onloadend = function(evt) {
			var bifmagic = self.a2hex(r.result.substr(0,8));
			if(bifmagic !== "894249460d0a1a0a") {
				console.log("Bad magic number on bif");
				callback.call(self, false);
				return false;
			}

			var bifversion = parseInt("0x"+self.a2hex(r.result.substr(8,4)),16);
			self.count = self.uint32le_to_number(r.result.substr(12,4));
			self.multiplier = self.uint32le_to_number(r.result.substr(16,4));

			// read index
			var blob = fblob.slice(64, 64+(8*self.count));
			r.onloadend = function(evt) {
				self.idx = [];
				var next = r.result[0];
				for(var i = 0; i < r.result.length; i+= 8) {
					// for our purposes assume the multiplier is accurate
					self.idx.push([self.uint32le_to_number(r.result.substr(i+4,4))]);
				}

				for(var i = 0; i < self.idx.length; i++) {
					if(i == self.idx.length - 1) var blob = fblob.slice(self.idx[i][0],fblob.size, "image/jpeg");
					else var blob = fblob.slice(self.idx[i][0], self.idx[i+1][0], "image/jpeg");
					self.idx[i].push(URL.createObjectURL(blob));
				}

				if(callback) callback.call(self, self.idx);
			}
			r.readAsBinaryString(blob);

		}
		r.readAsBinaryString(blob);
	},

	get: function(sec) {
		// positive values are in seconds, negative is percent (e.g. -0.5 = 50%);
		if(this.multiplier == 0 || this.idx.length == 0) return false;
		if(sec > 0) {
			var msec = sec*1000;
			var offset = Math.floor(msec / this.multiplier);
			if(offset > this.count) offset = this.count-1;
		}
		else {
			var offset = Math.floor(sec * this.count * -1);
		}
		return this.idx[offset][1];
	},

	cancel: function() {
		if(this.idx.length == 0) this.xhr.abort();
	},

	clean: function() {
		for(var i = 0; i < this.idx.length; i++) {
			URL.revokeObjectURL(this.idx[i][1]);
		}
		this.idx = [];
	},

	onError: function(e) {
		console.log('Error', e);
	}
}
