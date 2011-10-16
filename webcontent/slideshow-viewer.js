/**
 * @author Mikael
 */

(function($) {

	var DND_TRANSFERDATA_TEXTPLAIN = "text/plain";
	var DND_TYPE_MOVE = "MOVE";
	var DND_TYPE_ADD = "ADD";

	var URL_TO_SLIDE_TITLE_PATTERN = /\/?(\w+)\.\w{2,5}$/;
	SlideshowViewer = function(slideshowModel, imageCollection, slideImageId,  prevButtonId, nextButtonId, annotationButtonsContainerId, closeButtonId, commentsListId) {
		this._currentSlideIndex = -1;
		this._model = slideshowModel;
		this._imageCollection = imageCollection;
		this._slideImage = $("#" + slideImageId)
		this._prevButton = $("#" + prevButtonId);
		this._nextButton = $("#" + nextButtonId);
		this._annotationButtonsContainer = $("#" + annotationButtonsContainerId);
		this._closeButton = $("#" + closeButtonId);
		this._commentsList = $("#" + commentsListId);
		this._canvasTools = null;
		
		this._currentSlideContainer = $("#viewer-slide-container");
	};

	SlideshowViewer.prototype.init = function() {
		this._initSlide();
		this._initSlideButtons();
		this._initNavigationButtons();
	};

	SlideshowViewer.prototype._onCloseButtonClick = function(e) {
		e.data.hide();
	};
	SlideshowViewer.prototype._onNextButtonClick = function(e) {
		e.data.gotoNextSlide();
	};
	SlideshowViewer.prototype._onPrevButtonClick = function(e) {
		e.data.gotoPreviousSlide();
	};

	SlideshowViewer.prototype.hide = function() {
		document.body.classList.remove("mode-viewer");
		document.body.classList.add("mode-designer");
	};
	SlideshowViewer.prototype.show = function(initialSlideIndex) {
		document.body.classList.add("mode-viewer");
		document.body.classList.remove("mode-designer");
		
		if(initialSlideIndex >= 0) {
			this.gotoSlide(initialSlideIndex);
		};
	};
	SlideshowViewer.prototype.gotoSlide = function(slideIndex) {
		if (slideIndex >= 0 && slideIndex < this._model.slides.length)
		{
			this._currentSlideIndex = slideIndex;
			
			var slideData = this._model.slides[this._currentSlideIndex];
			var imageData = this._imageCollection.get(slideData.url);
			
			var prevSlideContainer = $(this._currentSlideContainer.children()[0]);
			prevSlideContainer.remove();
			
			var img = new Image(imageData.width, imageData.height);
			$(img).load(this, function (e) {
				
				
				var slideContainer = $(document.createElement("div"));
				
				$(this).unbind("load").appendTo(slideContainer);
				
				var canvasTools = new CanvasTools(this);
				slideContainer.mousedown(canvasTools, canvasTools.onMouseDown);
				slideContainer.mousemove(canvasTools, canvasTools.onMouseOver);
				slideContainer.mouseup(canvasTools, canvasTools.onMouseUp);
				
				e.data._canvasTools = canvasTools;
				
				e.data._currentSlideContainer.append(slideContainer);
				
				e.data._loadAnnotations();
				/*
				setTimeout(function() {
					slideContainer.classList.toggle("visible");
				}, 100);
				*/
			}).attr("src", slideData.url);
			
			if (slideData.effects && slideData.effects.length > 0) {
				
			}
			/*
			if (this._canvasTools) {
				this._canvasTools.destroy();
			}
			*/
		}
	};

	SlideshowViewer.prototype.gotoNextSlide = function() {
		this.gotoSlide(this._currentSlideIndex + 1);
	};
	SlideshowViewer.prototype.gotoPreviousSlide = function() {
		this.gotoSlide(this._currentSlideIndex - 1);
	};
	
	SlideshowViewer.prototype._onAddCommentButtonClick = function(e) {
		var self = e.data;
		var text = prompt("Din kommentar:");
		self.addComment(text);
	};
	SlideshowViewer.prototype._onAddMosaicButtonClick = function(e) {
		var self = e.data;
		self.addMosaic();
	};
	SlideshowViewer.prototype._onAddBalloonButtonClick = function(e) {
		var self = e.data;
		self.addBalloon();
	};
	SlideshowViewer.prototype._onAddStampButtonClick = function(e) {
		var self = e.data;
		self.addStamp();
	};
	
	SlideshowViewer.prototype.addComment = function(text) {
		this._addAnnotation(new CommentAnnotation(text, "Anonymous"));
	};
	SlideshowViewer.prototype.addMosaic = function() {
		this._canvasTools.enableRegionSelection( { fn: function (region) {
			this._addAnnotation(new MosaicAnnotation("", "Anonymous", region));
			this._canvasTools.disableRegionSelection();
		}, scope: this } );
	};
	SlideshowViewer.prototype.addBalloon = function() {
		this._canvasTools.enableCoordSelection( { fn: function (coord) {
			var text = prompt("Din kommentar:");
			this._addAnnotation(new BalloonAnnotation(text, "Anonymous", coord));
			this._canvasTools.disableCoordSelection();
		}, scope: this } );
	};
	SlideshowViewer.prototype.addStamp = function(text) {
		this._canvasTools.enableRegionSelection( { fn: function (region) {
			this._addAnnotation(new StampAnnotation("", "Anonymous", region));
			this._canvasTools.disableRegionSelection();
		}, scope: this } );
	};
	
	SlideshowViewer.prototype._addAnnotation = function(annotation) {
		var annotations = this._model.slides[this._currentSlideIndex].annotations;
		if (!annotations) {
			annotations = [];
			this._model.slides[this._currentSlideIndex].annotations = annotations;
		}
		annotations.push(annotation);
		this._loadAnnotations();
	};
	
	SlideshowViewer.prototype._loadCommentAnnotation = function(annotation) {
		var li = $(document.createElement("li")).text(annotation.text);
		this._commentsList.append(li);
	};
	
	SlideshowViewer.prototype._loadMosaicAnnotation = function(annotation) {
		this._canvasTools.applyMosaicFilter(annotation.region);
	};
	
	SlideshowViewer.prototype._loadBalloonAnnotation = function(annotation) {
		var balloon = document.createElement("blockquote");
		balloon.style.left = annotation.coord.x + "px";
		balloon.style.top = annotation.coord.y + "px";
		var balloonText = document.createElement("span");
		balloonText.innerHTML = annotation.text;
		balloon.appendChild(balloonText);
		this._currentSlideContainer.children()[0].appendChild(balloon);
	};
	
	SlideshowViewer.prototype._loadStampAnnotation = function(annotation) {
		this._canvasTools.addSvgCircle(annotation.region);
	};
	
	SlideshowViewer.prototype._loadAnnotation = function(annotation) {
		if (annotation instanceof CommentAnnotation) {
			this._loadCommentAnnotation(annotation);
		} else if (annotation instanceof BalloonAnnotation) {
			this._loadBalloonAnnotation(annotation);
		} else if (annotation instanceof MosaicAnnotation) {
			this._loadMosaicAnnotation(annotation);
		} else if (annotation instanceof StampAnnotation) {
			this._loadStampAnnotation(annotation);
		}
	};
	
	SlideshowViewer.prototype._loadAnnotations = function(annotation) {
		var annotations = this._model.slides[this._currentSlideIndex].annotations;
		
		this._commentsList.children().remove();
		
		if (annotations && annotations.length > 0) {
			for (var i=0; i < annotations.length; i++) {
				this._loadAnnotation(annotations[i]);
			}
		}
	};
	
	SlideshowViewer.prototype._initSlide = function() {
	};

	SlideshowViewer.prototype._initSlideButtons = function() {
		this._annotationButtonsContainer.append(
			$(document.createElement("a")).attr("href", "javascript:void(0);").text("Kommentera").click(this, this._onAddCommentButtonClick),
			$(document.createElement("a")).attr("href", "javascript:void(0);").text("Censurera").click(this, this._onAddMosaicButtonClick),
			$(document.createElement("a")).attr("href", "javascript:void(0);").text("Pratbubbla").click(this, this._onAddBalloonButtonClick),
			$(document.createElement("a")).attr("href", "javascript:void(0);").text("Stämpla").click(this, this._onAddStampButtonClick)
			);
	};

	SlideshowViewer.prototype._initNavigationButtons = function() {
		this._closeButton.click(this, this._onCloseButtonClick);
		this._prevButton.click(this, this._onPrevButtonClick);
		this._nextButton.click(this, this._onNextButtonClick);
	};

	SlideshowViewer.prototype.getModel = function() {
		return this._model;
	};
})(jQuery);
