The configuration/layout of each slideshow is stored in a JSON structure like this:

var slideshow = {
	title: "Demo Slideshow",
	slides: [
		{
			url: "slides/MS_110208_2819.JPG",
			title: "Visiting the archipelago",
			transition: "fade",
			annotations: [
				{
					type: "comment",
					author: "Anonymous Guest",
					text: "This is a nice picture. I like the colours!"
				},
				{
					type: "speechballoon",
					author: "Mother",
					coord: [123, 84],
					text: "What is this in the background?"
				},
				{
					type: "stamp",
					author: "Mother",
					coord: [98, 318],
					size: [200, 200],
					shape: "star"
				},
				{
					type: "mosaic",
					author: "A Secret Agent",
					coord: [465,23],
					size: [64,64]
				}
			],
			
		}
	]
};
