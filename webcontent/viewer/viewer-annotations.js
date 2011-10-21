/**
 * @author Mikael
 */

(function(U) {

	CommentAnnotation = function (text, author) {
		this.text = text;
		this.author = author;
	}
	BalloonAnnotation = function (text, author, coord) {
		this.text = text;
		this.author = author;
		this.coord = coord;
	}
	MosaicAnnotation = function (text, author, region) {
		this.text = text;
		this.author = author;
		this.region = region;
	}
	StampAnnotation = function (text, author, region, shape) {
		this.text = text;
		this.author = author;
		this.region = region;
		this.shape = shape;
	}

})(new Utils());
