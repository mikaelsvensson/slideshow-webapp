/**
 * @author Mikael
 */

(function($) {

	ImageCollection = function() {
		this._list = [];
	};
	
	ImageCollection.prototype.addImage = function(url, thumbnailUrl, width, height) {
		var obj = {
			"url": url, 
			"thumbnailUrl": thumbnailUrl, 
			"width": width, 
			"height": height
		};
		if (!this.contains(url)) {
			this._list.push(obj);
		}
	};
	
	ImageCollection.prototype.getList = function() {
		return this._list;
	};
	
	ImageCollection.prototype.contains = function(url) {
		return this.get(url) != null;
	};
	
	ImageCollection.prototype.get = function(url) {
		for (var i in this._list)
		{
			if (this._list[i].url == url) {
				return this._list[i];
			}
		}
		return null;
	}

})(jQuery);
