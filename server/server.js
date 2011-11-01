var fs = require("fs");
var http = require("http");
var nodestatic = require("node-static");
var socketio = require("socket.io");

var CLIENT_ROOT = "../client/";

var clients = {};

var staticRoot = new nodestatic.Server(CLIENT_ROOT, { cache: 0, customContentTypes: { "manifest": "text/cache-manifest" } } );
var staticContentServer = http.createServer(function (req, res) {
	req.addListener("end", function () {
		staticRoot.serve(req, res);
	});
}).listen(80);

var logClients = function()
{
	for (var id in clients) {
		console.log("Client " + id);
		console.log("  Name:                   " + clients[id].name);
		console.log("  Is slideshow presenter: " + (clients[id].slideshow ? "Yes" : "No"));
	}
}
var broadcastUserList = function(socket) {
	var clientList = [];
	for (var id in clients) {
		clientList.push(clients[id].name ? clients[id].name : "Anonymous User");
	}
	socket.broadcast.emit("userlist-updated", clientList);
};

var slideshowEnd = function (socket) {
	var clientInfo = clients["client" + socket.id];
	if (clientInfo && clientInfo.slideshow) {
		console.log("slideshow-end");
		logClients();
		
		for (var i in clientInfo.slideshow.viewers) {
			clientInfo.slideshow.viewers[i].emit("slideshow-ended");
		}
		
		delete clientInfo.slideshow;
		logClients();
		
		socket.broadcast.emit("slideshowlist-update", getSlideshowList());
	}
};

var getSlideshowList = function () {
	var slideshowList = [];
	for (var id in clients) {
		if (clients[id].slideshow) {
			slideshowList.push( { "id": clients[id].socket.id, "title": clients[id].slideshow.model.title ? clients[id].slideshow.model.title : "Untitled Slideshow" } );
		}
	}
	return slideshowList;	
};

var broadcastSlideshowList = function(socket) {
	socket.broadcast.emit("slideshowlist-update", getSlideshowList());
};

var webSocketServer = socketio.listen(8080);
webSocketServer.sockets.on("connection", function (socket) {
	
	clients["client" + socket.id] = { "socket": socket };
	
	socket.on("disconnect", function () {
		console.log("Someone left the group. Sad.");
		
		slideshowEnd(socket);
		
		delete clients["client" + socket.id];
		
		broadcastUserList(socket);
	});
	
	socket.on("image-list", function (responseCallback) {
	    
	    var scanDir = function (path, result) {
	        var ROOT = CLIENT_ROOT + "/";
	        var THUMBNAIL_FILE_SUFFIX = "_resize.jpg";
	        var files = fs.readdirSync(ROOT + path);
//	        console.log(files);
	        for (var i=0; i < files.length; i++) {
	            
	            var file = files[i];
	            
	            var stat = fs.statSync(ROOT + path + "/" + file);
	            
	            if (stat.isDirectory()) {
	                scanDir(path + "/" + file, result);
	            } else {
	                var lcName = file.toLowerCase();
	                
	                if (lcName.indexOf(THUMBNAIL_FILE_SUFFIX) == -1 && lcName.substr(lcName.length-4) == ".jpg") {
	                    var fileObj = {
	                            url: path + "/" + file
	                    };
	                    var thumbFile = file.substr(0, file.length-4) + THUMBNAIL_FILE_SUFFIX;
	                    if (fs.statSync(ROOT + path + "/" + thumbFile).isFile()) {
	                        fileObj.thumbnailUrl = path + "/" + thumbFile;
	                        
	                    }
	                    result.push(fileObj);
	                }
	            }
	            
	        }
	    };
	    
	    var r = [];
	    scanDir("slides", r);
	    responseCallback(r);
	});
	socket.on("login", function (data) {
		console.log(data.name + " has logged in.");
		
		clients["client" + socket.id].name = data.name;
		
		broadcastUserList(socket);
	});
	socket.on("slideshow-join", function (id, responseCallback) {
		console.log("Client " + socket.id + " wants to join the presentation managed by " + id);
		
		clients["client" + id].slideshow.viewers.push(socket);
		
		logClients();
		
		responseCallback(
				clients["client" + id].slideshow.model, 
				clients["client" + id].slideshow.currentIndex,
				id);
	});
	
	socket.on("slideshow-leave", function (id) {
		console.log("Client " + socket.id + " wants to leave the presentation managed by " + id);
		if (clients["client" + id] && clients["client" + id].slideshow) {
			var slideshow = clients["client" + id].slideshow;
			for (var i in slideshow.viewers) {
				if (slideshow.viewers[i] == socket) {
					slideshow.viewers.splice(i, 1);
					break;
				}
			}
		} else {
			console.log("Could not find slideshow for client 'client" + id + "'.");
		}
		
		logClients();
	});
	
	
	socket.on("slideshow-start", function (slideshowModel, currentIndex) {
		console.log("Client " + socket.id + " started a presentation.");
		logClients();
		clients["client" + socket.id].slideshow = { viewers: [], model: slideshowModel, currentIndex: currentIndex};
		
		socket.broadcast.emit("slideshowlist-update", getSlideshowList());
	});
	
	socket.on("slideshowlist-get", function (responseCallback) {
		responseCallback(getSlideshowList());
	});
	
	socket.on("slideshow-gotoslide", function (slideIndex) {
		clients["client" + socket.id].slideshow.currentIndex = slideIndex;
		
		for (var i in clients["client" + socket.id].slideshow.viewers) {
			clients["client" + socket.id].slideshow.viewers[i].emit("slideshow-gotoslide", slideIndex);
		}
	});
	
	socket.on("slideshow-addannotation-request", function (id, slideIndex, annotation) {
		if (clients["client" + id] && clients["client" + id].slideshow) {
			console.log("Sending annotation creation request to " + id);
			clients["client" + id].socket.emit("slideshow-addannotation-request", slideIndex, annotation);
		}
		logClients();
		
	});
	socket.on("slide-update", function (slideIndex, slide) {
		if (clients["client" + socket.id] && clients["client" + socket.id].slideshow) {
			clients["client" + socket.id].slideshow.model.slides[slideIndex] = slide;
			for (var i in clients["client" + socket.id].slideshow.viewers) {
				clients["client" + socket.id].slideshow.viewers[i].emit("slide-update", slideIndex, slide);
			}
		}
	});
	
	socket.on("slideshow-end", function () {
		slideshowEnd(socket);
	});
});
