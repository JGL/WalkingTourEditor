const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

// File System for loading the list of words
let fs = require('fs');

app.listen(port, () => {
	console.log(`Starting server at ${port}`);
});
app.use(express.static('public'));
// for parsing application/json - need this to be able to parse the body of a json file from the request object
app.use(express.json());

// our "database" is "tour.json", check first to see if it exists
let tour;
let filename = 'tour.json';
let exists = fs.existsSync(filename);

if (exists) {
	// read the file
	console.log('Loading walking tour on server startup');
	var txt = fs.readFileSync(filename, 'utf8');
	// Parse it  back to object
	tour = JSON.parse(txt);
} else {
	// otherwise start with example tour
	console.log('No walking tour found, populating example tour, with title "Highams Park"');
	tour = {
		"title": "Highams Park",
		"waypoints": [{
			"label": "First",
			"latitude": 51.6061853,
			"longitude": 0.0016033,
			"timestamp": 1565106843993
		}, {
			"label": "Second",
			"latitude": 51.6061598,
			"longitude": 0.0016259,
			"timestamp": 1565116464662
		}]
	};
}

app.post('/waypoint', (request, response) => {
	console.log(`Trying to post additional waypoint to tour...`);
	let newWaypoint = request.body;
	// console.log(`The new waypoint is ${JSON.stringify(newWaypoint)}`);
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
	let timestamp = Date.now();
	newWaypoint.timestamp = timestamp;

	// put it in the tour
	tour.waypoints.push(newWaypoint);

	// write a file each time we get a new word, this is kind of silly but it works sez Daniel Shiffman
	const json = JSON.stringify(tour, null, 2);
	fs.writeFileSync(filename, json, 'utf8'); //writing in a sync way, bad practice in general as it blocks, https://www.daveeddy.com/2013/03/26/synchronous-file-io-in-nodejs/
	response.json(tour);

	// doing this in a sync way now - to make sure the data gets written before being sent back, so below is redundant
	// fs.writeFile(filename, json, 'utf8', postFinished);
	// function postFinished(err) {
	// 	console.log(`Post adding waypoint to tour with filename: ${filename}.`);
	// 	// Don't send anything back until everything is done
	// 	response.json(data);
	// }
});

app.post('/tour', (request, response) => {
	console.log(`Trying to post edit tour...`);
	let newTour = request.body;
	// console.log(`The new tour is ${JSON.stringify(newTour)}`);
	tour = newTour; //MUST overwrite old tour, or it will live in memory forever, like the undead

	const json = JSON.stringify(newTour, null, 2);
	fs.writeFileSync(filename, json, 'utf8');
	response.json(newTour);
});

app.get('/tour', (request, response) => {
	console.log(`Trying to get tour...`);
	// console.log(`The tour is ${JSON.stringify(tour)}`);
	response.json(tour);
});

// a route for adding a new waypoint with a label, latitude and longitude
// TODO: implement, see coding train example:
// https://www.youtube.com/watch?v=P-Upi9TMrBk&list=PLRqwX-V7Uu6YrbSJBg32eTzUU50E2B8Ch&index=39&t=0s
// app.get('/add/:label/:latitude/:longitude', addWaypoint);

// // handle that route
// function addWaypoint(request, response) {
// 	// label, latitude and longitude
// 	const label = request.params.label;
// 	// Make sure it's not a string by accident
// 	const latitude = Number(request.params.latitude);
// 	const longitude = Number(request.params.longitude);
// 	const timestamp = Date.now();

// 	// put it in the tour
// 	tour.waypoints.push({
// 		"label": label,
// 		"latitude": latitude,
// 		"longitude": longitude,
// 		"timestamp": timestamp
// 	});

// 	// let the request know it's all set
// 	const reply = {
// 		status: 'success',
// 		label: word,
// 		latitude: latitude,
// 		longitude: longitude,
// 		timestamp: timestamp
// 	};
// 	console.log('Adding waypoint: ' + JSON.stringify(reply));

// 	const json = JSON.stringify(tour, null, 2);
// 	fs.writeFile(filename, json, 'utf8', finished);

// 	function finished(err) {
// 		console.log(`Finished saving tour with filename: ${filename}.`);
// 		// don't send anything back until everything is done
// 		response.send(reply);
// 	}
// }