The configuration/layout of each slideshow is stored in a JSON structure like this:

var slideshow = {
	name: "Demo Slideshow",
	slides: [
		{
			uri: "slides/MS_110208_2819.JPG",
			title: "Visiting the archipelago",
			transition: "fade",
			effects: [
				{
					type: "interlaced",
					color: [255, 0, 0, 0.5]
				}
			],
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
				}
			],
			
		}
	]
};
