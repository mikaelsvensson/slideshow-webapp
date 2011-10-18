/**
 * @author Mikael
 */

(function($) {

	var Filters = {
		/*
		 * Credits: http://www.html5rocks.com/en/tutorials/canvas/imagefilters/
		 */
		grayscale : function(pixelData) {
			var d = pixelData.data;
			for(var i = 0; i < d.length; i += 4) {
				var r = d[i];
				var g = d[i + 1];
				var b = d[i + 2];
				// CIE luminance for the RGB
				// The human eye is bad at seeing red and blue, so we de-emphasize them.
				var v = 0.2126 * r + 0.7152 * g + 0.0722 * b;
				d[i] = d[i + 1] = d[i + 2] = v
			}
			return pixelData;
		},
		interlace : function(pixelData) {
			var d = pixelData.data;
			var width = pixelData.width;
			for(var i = 0; i < d.length; i += 4) {
				var r = d[i];
				var g = d[i + 1];
				var b = d[i + 2];
				
				var x = Math.floor((i/4) % width);
				var y = Math.floor((i/4) / width);
				
				if (y % 2 == 0)
				{
					var v = 0.2126 * r + 0.7152 * g + 0.0722 * b;
					v *= 0.5;
					d[i] = d[i + 1] = d[i + 2] = v
				}
			}
			return pixelData;
		},
		mosaic : function(pixelData) {
			var d = pixelData.data;
			var width = pixelData.width;
			var height = pixelData.height;
			var BLOCK_SIZE = 10;
			
			for (var x = 0; x < width; x += BLOCK_SIZE) {
				for (var y = 0; y < height; y += BLOCK_SIZE) {
					
					var currentBlockWidth = Math.min(BLOCK_SIZE, width - x);
					var currentBlockHeight = Math.min(BLOCK_SIZE, height - y);
					
					var averageR = 0;
					var averageG = 0;
					var averageB = 0;
					for (var dx = 0; dx < currentBlockWidth; dx++) {
						for (var dy = 0; dy < currentBlockHeight; dy++) {
							var pixelIndex = (x + dx) + ((y + dy)*width);
							averageR += d[pixelIndex * 4];
							averageG += d[pixelIndex * 4 + 1];
							averageB += d[pixelIndex * 4 + 2];
						}
					}
					averageR /= (currentBlockWidth * currentBlockHeight);
					averageG /= (currentBlockWidth * currentBlockHeight);
					averageB /= (currentBlockWidth * currentBlockHeight);
					for (var dx = 0; dx < currentBlockWidth; dx++) {
						for (var dy = 0; dy < currentBlockHeight; dy++) {
							var pixelIndex = (x + dx) + ((y + dy)*width);
							d[pixelIndex * 4] = averageR;
							d[pixelIndex * 4 + 1] = averageG;
							d[pixelIndex * 4 + 2] = averageB;
						}
					}
				}
			}
			return pixelData;
		}
	}
	
	CanvasTools = function(imageEl, width, height) {
		
		this.disableRegionSelection();
		this.disableCoordSelection();
		
		var el = document.createElement("canvas");
		if(el && el.getContext) {
			this.ctx = el.getContext("2d");
			this.width = el.width = width || imageEl.width;
			this.height = el.height = height || imageEl.height;

			$(el).insertAfter(imageEl);
			this._canvas = el;
			this._image = imageEl;
		} else {
			alert("Specified element is not a <canvas> element.");
		}
	};
	
	CanvasTools.prototype._getImagePosition = function() {
		if (!this._imagePos) {
			this._imagePos = $(this._image).offset();
		}
		return this._imagePos;
	};
	
	CanvasTools.prototype.addSvgCircle = function(region) {
		var x = region.x + (region.width / 2);
		var y = region.y + (region.height / 2);
		var r = Math.max(region.height, region.width) / 2;
		var svgSource = [
				'<svg xmlns="http://www.w3.org/2000/svg" version="1.1">',
				  '<circle cx="', x, '" cy="', y, '" r="', r, '" style="fill:yellow;stroke:purple;stroke-width:2"/>',
				'</svg>'
				].join("");
		$(svgSource).appendTo(this._canvas.parentNode);
	};
	
	CanvasTools.prototype.grayscale = function() {
		var region = {
			x : 0,
			y : 0,
			width : this.width,
			height : this.height
		}
		this.ctx.drawImage(this._image, region.x, region.y, region.width, region.height, region.x, region.y, region.width, region.height)
		this.ctx.putImageData(
				Filters.grayscale(this._getPixelData(region)),
				region.x, 
				region.y);
	};
	
	CanvasTools.prototype.applyInterlaceFilter = function(region) {
		region = this._createRegion(region);
		this.ctx.drawImage(this._image, region.x, region.y, region.width, region.height, region.x, region.y, region.width, region.height)
		this.ctx.putImageData(
				Filters.interlace(this._getPixelData(region)),
				region.x, 
				region.y);
	};
	CanvasTools.prototype.applyMosaicFilter = function(region) {
		region = this._createRegion(region);
		this.ctx.drawImage(this._image, region.x, region.y, region.width, region.height, region.x, region.y, region.width, region.height)
		this.ctx.putImageData(
				Filters.mosaic(this._getPixelData(region)),
				region.x, 
				region.y);
	};
	
	CanvasTools.prototype._getPixelData = function(region) {
		return this.ctx.getImageData(region.x || 0, region.y || 0, region.width || this.width, region.height || this.height);
	};

	CanvasTools.prototype.destroy = function() {
		this.ctx = null;
		this._canvas.parentNode.removeChild(this._canvas);
	};
	
	CanvasTools.prototype.onMouseDown = function(e) {
		var self = e.data;
		var pos = e.data._getImagePosition();
		self._isMouseDown = true;
		self._latestMouseDownCoord = [e.clientX - pos.left + this.scrollLeft, e.clientY - pos.top + this.scrollTop];
	};
	
	CanvasTools.prototype.onMouseUp = function(e) {
		var pos = e.data._getImagePosition();
		e.data._onMouseUp(e.clientX - pos.left + this.scrollLeft, e.clientY - pos.top + this.scrollTop);
	};
	CanvasTools.prototype._onMouseUp = function(x, y) {
		if (this._isMouseDown && this.isRegionSelectionEnabled()) {
			if (this._selection) {
				if (this._onRegionSelectionCallback) {
					this._onRegionSelectionCallback.fn.call(this._onRegionSelectionCallback.scope || this, this._selection);
				}
				this._selectionMarker.parentNode.removeChild(this._selectionMarker);
				this._selectionMarker = null;
			} 
		} else {
			
		}
		if (this.isCoordSelectionEnabled()) {
			if (this._onCoordSelectionCallback) {
				this._onCoordSelectionCallback.fn.call(this._onCoordSelectionCallback.scope || this, { x: x, y: y } );
			}
		}
		this._isMouseDown = false;
	};
	
	CanvasTools.prototype.onMouseOver = function(e) {
		var pos = e.data._getImagePosition();
		var self = e.data._onMouseOver(e.clientX - pos.left + this.scrollLeft, e.clientY - pos.top + this.scrollTop);
		console.log("client["+e.clientX+","+e.clientY+"]");
	};
	CanvasTools.prototype._onMouseOver = function(x, y) {
		if (this._isMouseDown && this.isRegionSelectionEnabled()) {
			
			console.log("start["+this._latestMouseDownCoord[0]+","+this._latestMouseDownCoord[1]+" now["+x+","+y+"]");
			var regionX1 = Math.min(this._latestMouseDownCoord[0], x);
			var regionY1 = Math.min(this._latestMouseDownCoord[1], y);
			var regionX2 = Math.max(this._latestMouseDownCoord[0], x);
			var regionY2 = Math.max(this._latestMouseDownCoord[1], y);
			var region = {
				x: regionX1,
				y: regionY1,
				width: regionX2 - regionX1,
				height:  regionY2 - regionY1
			};
			this._selection = region;
			if (!this._selectionMarker) {
				this._selectionMarker = document.createElement("div");
				this._selectionMarker.className = "selection";
				this._image.parentNode.appendChild(this._selectionMarker);
			}
			this._selectionMarker.style.left = this._selection.x + "px";
			this._selectionMarker.style.top = this._selection.y + "px";
			this._selectionMarker.style.width = this._selection.width + "px";
			this._selectionMarker.style.height = this._selection.height + "px";
			console.log(this._selection);
		} else {
			
		}
	};

	CanvasTools.prototype._createRegion = function(base) {
		var region = {
			x: base.x || 0,
			y: base.y || 0,
			width: base.width || this.width,
			height: base.height || this.height
		}
		return region;
	};

	CanvasTools.prototype.getSelection = function() {
		return this._selection;
	};
	
	CanvasTools.prototype.enableRegionSelection = function(onRegionSelectionCallback) {
		this._isRegionSelectionEnabled = true;
		this._onRegionSelectionCallback = onRegionSelectionCallback;
	};
	
	CanvasTools.prototype.disableRegionSelection = function() {
		this._isRegionSelectionEnabled = false;
		this._onRegionSelectionCallback = null;
	};
	
	CanvasTools.prototype.isRegionSelectionEnabled = function() {
		return this._isRegionSelectionEnabled == true;
	};
	
	CanvasTools.prototype.enableCoordSelection = function(onCoordSelectionCallback) {
		this._isCoordSelectionEnabled = true;
		this._onCoordSelectionCallback = onCoordSelectionCallback;
	};
	
	CanvasTools.prototype.disableCoordSelection = function() {
		this._isCoordSelectionEnabled = false;
		this._onCoordSelectionCallback = null;
	};
	
	CanvasTools.prototype.isCoordSelectionEnabled = function() {
		return this._isCoordSelectionEnabled == true;
	};
})(jQuery);
