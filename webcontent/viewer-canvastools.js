/**
 * @author Mikael
 */

(function(U) {

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
			var BLOCK_SIZE = 20;
			
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
		
		/*
		 * HTML5: Markup
		 */
		var el = document.createElement("canvas");
		if(el && el.getContext) {
			/*
			 * HTML Canvas 2D Context
			 */
			this.ctx = el.getContext("2d");
			this.width = el.width = width || imageEl.width;
			this.height = el.height = height || imageEl.height;
			
			imageEl.parentNode.insertBefore(el, imageEl.nextSibling);
			this._canvas = el;
			this._image = imageEl;
		} else {
			alert("Specified element is not a <canvas> element.");
		}
		
		this.disableRegionSelection();
		this.disableCoordSelection();
	};
	
	CanvasTools.prototype._getImagePosition = function() {
		if (!this._imagePos) {
			this._imagePos = { top: this._image.offsetTop, left: this._image.offsetLeft };
		}
		return this._imagePos;
	};
	
	CanvasTools.prototype.grayscale = function() {
		var region = {
			x : 0,
			y : 0,
			width : this.width,
			height : this.height
		}
		/*
		 * HTML Canvas 2D Context
		 */
		this.ctx.drawImage(this._image, region.x, region.y, region.width, region.height, region.x, region.y, region.width, region.height)
		this.ctx.putImageData(
				Filters.grayscale(this._getPixelData(region)),
				region.x, 
				region.y);
	};
	
	CanvasTools.prototype.applyInterlaceFilter = function(region) {
		region = this._createRegion(region);
		/*
		 * HTML Canvas 2D Context
		 */
		this.ctx.drawImage(this._image, region.x, region.y, region.width, region.height, region.x, region.y, region.width, region.height)
		this.ctx.putImageData(
				Filters.interlace(this._getPixelData(region)),
				region.x, 
				region.y);
	};
	CanvasTools.prototype.applyMosaicFilter = function(region) {
		region = this._createRegion(region);
		/*
		 * HTML Canvas 2D Context
		 */
		this.ctx.drawImage(this._image, region.x, region.y, region.width, region.height, region.x, region.y, region.width, region.height)
		this.ctx.putImageData(
				Filters.mosaic(this._getPixelData(region)),
				region.x, 
				region.y);
	};
	
	CanvasTools.prototype._getPixelData = function(region) {
		/*
		 * HTML Canvas 2D Context
		 */
		return this.ctx.getImageData(region.x || 0, region.y || 0, region.width || this.width, region.height || this.height);
	};

	CanvasTools.prototype.destroy = function() {
		this.ctx = null;
		this._canvas.parentNode.removeChild(this._canvas);
	};
	
	CanvasTools.prototype._getMouseCoord = function(e) {
		var mouseX, mouseY;
	    if (e.offsetX) {
	        mouseX = e.offsetX;
	        mouseY = e.offsetY;
	    }
	    else if (e.layerX) {
	        mouseX = e.layerX;
	        mouseY = e.layerY;
	    }
	    if (e.target.offsetLeft) {
			mouseX += e.target.offsetLeft;
			mouseY += e.target.offsetTop;
	    }
		return [mouseX, mouseY];
	};
	
	CanvasTools.prototype.onMouseDown = function(e) {
		this._isMouseDown = true;
		this._latestMouseDownCoord = this._getMouseCoord(e);
	};
	
	CanvasTools.prototype.onMouseUp = function(e) {
		this._onMouseUp(this._getMouseCoord(e));
	};
	CanvasTools.prototype._onMouseUp = function(coord) {
		var x = coord[0];
		var y = coord[1];
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
		this._onMouseOver(this._getMouseCoord(e));
	};
	CanvasTools.prototype._onMouseOver = function(coord) {
		var x = coord[0];
		var y = coord[1];
		if (this._isMouseDown && this.isRegionSelectionEnabled()) {
			
			console.log("start["+this._latestMouseDownCoord[0]+","+this._latestMouseDownCoord[1]+"] now["+x+","+y+"]");
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
				this._selectionMarker = U.createElement("div");
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
		/*
		 * HTML5: CSS class list API
		 */
		this._image.parentNode.parentNode.classList.add("selection-mode");
		this._onRegionSelectionCallback = onRegionSelectionCallback;
	};
	
	CanvasTools.prototype.disableRegionSelection = function() {
		this._isRegionSelectionEnabled = false;
		/*
		 * HTML5: CSS class list API
		 */
		this._image.parentNode.parentNode.classList.remove("selection-mode");
		this._onRegionSelectionCallback = null;
	};
	
	CanvasTools.prototype.isRegionSelectionEnabled = function() {
		return this._isRegionSelectionEnabled == true;
	};
	
	CanvasTools.prototype.enableCoordSelection = function(onCoordSelectionCallback) {
		this._isCoordSelectionEnabled = true;
		/*
		 * HTML5: CSS class list API
		 */
		this._image.parentNode.parentNode.classList.add("selection-mode");
		this._onCoordSelectionCallback = onCoordSelectionCallback;
	};
	
	CanvasTools.prototype.disableCoordSelection = function() {
		this._isCoordSelectionEnabled = false;
		/*
		 * HTML5: CSS class list API
		 */
		this._image.parentNode.parentNode.classList.remove("selection-mode");
		this._onCoordSelectionCallback = null;
	};
	
	CanvasTools.prototype.isCoordSelectionEnabled = function() {
		return this._isCoordSelectionEnabled == true;
	};
})(new Utils());
