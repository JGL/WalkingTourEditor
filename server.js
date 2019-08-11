const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

// File System for loading the list of words
let fs = require('fs');

app.listen(port, () => {
	console.log(`Starting server at ${port}`);
});
app.use(express.static('public'));
app.use(express.json()) // for parsing application/json - need this to be able to parse the body of a json file from the request object

// Our "database" (in addition to what is in the AFINN-111 list)
// is "additional.json", check first to see if it exists
let tour;
let filename = 'tour.json';
let exists = fs.existsSync(filename);

if (exists) {
	// Read the file
	console.log('Loading walking tour');
	var txt = fs.readFileSync(filename, 'utf8');
	// Parse it  back to object
	tour = JSON.parse(txt);
} else {
	// Otherwise start with example tour
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
	let data = request.body;
	console.log(`The data is ${JSON.stringify(data)}`);
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
	let timestamp = Date.now();
	data.timestamp = timestamp;

	// Put it in the tour
	tour.waypoints.push(data);

	// Write a file each time we get a new word
	// This is kind of silly but it works
	const json = JSON.stringify(tour, null, 2);
	fs.writeFile(filename, json, 'utf8', postFinished);

	function postFinished(err) {
		console.log(`Post finished saving tour with filename: ${filename}.`);
		// Don't send anything back until everything is done
		response.json(data);
	}
});

app.post('/tour', (request, response) => {
	let data = request.body;
	console.log(`The data is ${JSON.stringify(data)}`);
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
	// let timestamp = Date.now();
	// data.timestamp = timestamp;

	// // Put it in the tour
	// tour.waypoints.push(data);

	// // Write a file each time we get a new word
	// // This is kind of silly but it works
	// const json = JSON.stringify(tour, null, 2);
	// fs.writeFile(filename, json, 'utf8', postFinished);

	// function postFinished(err) {
	// 	console.log(`Post finished saving tour with filename: ${filename}.`);
	// 	// Don't send anything back until everything is done
	// 	response.json(data);
	// }
	response.json(data);
});

app.get('/tour', (request, response) => {
	console.log(`The tour is ${JSON.stringify(tour)}`);
	response.json(tour);
});

// A route for adding a new waypoint with a label, latitude and longitude
// TODO MAKE THIS WORK, LOOK AT THE CODING TRAIN
// https://www.youtube.com/watch?v=P-Upi9TMrBk&list=PLRqwX-V7Uu6YrbSJBg32eTzUU50E2B8Ch&index=39&t=0s
app.get('/add/:label/:latitude/:longitude', addWaypoint);

// Handle that route
function addWaypoint(request, response) {
	// label, latitude and longitude
	const label = request.params.label;
	// Make sure it's not a string by accident
	const latitude = Number(request.params.latitude);
	const longitude = Number(request.params.longitude);
	const timestamp = Date.now();

	// Put it in the tour
	tour.waypoints.push({
		"label": label,
		"latitude": latitude,
		"longitude": longitude,
		"timestamp": timestamp
	});

	// Let the request know it's all set
	const reply = {
		status: 'success',
		label: word,
		latitude: latitude,
		longitude: longitude,
		timestamp: timestamp
	};
	console.log('Adding waypoint: ' + JSON.stringify(reply));

	// Write a file each time we get a new word
	// This is kind of silly but it works
	const json = JSON.stringify(tour, null, 2);
	fs.writeFile(filename, json, 'utf8', finished);

	function finished(err) {
		console.log(`Finished saving tour with filename: ${filename}.`);
		// Don't send anything back until everything is done
		response.send(reply);
	}
}