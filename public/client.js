let latitude, longitude, theMap, liveLocationCircle, currentLocationCircle, waypointMarkersLayer;

latitude = 0; // latitude is north/south amount
longitude = 0; // longitude is east/west amount - prime meridian (0) is London, Longitude rewards - https://en.wikipedia.org/wiki/Longitude_rewards
let firstTimeLiveLocation = true; //boolean state for first time run, hacky
let firstTimeClickedLocation = true; //ditto as above!!!

function displayGeolocationError() {
	let informationTag = document.getElementById("currentLocation");
	informationTag.innerHTML = `<b>Error</b> - geolocation not available, do you have location services enabled?<br/><a href='https://support.apple.com/en-gb/HT207092'>Help for Apple iOS devices</a>.<br/><a href='https://support.google.com/accounts/answer/3467281?hl=en'>Help for Google Android devices</a>.<br/>Geolocation is <b>required</b> to be able to find yourself on the map automatically.`;
}

function checkForGeolocation() {
	if ('geolocation' in navigator) {
		if (firstTimeLiveLocation) { // only log once, for performance sake
			console.log('geolocation available');
		}
		return true;
	} else {
		if (firstTimeLiveLocation) { // only log once, for performance sake
			console.log('geolocation not available');
		}
		displayGeolocationError();
		return false;
	}
}

let onMapClick = e => { // https://stackoverflow.com/questions/27977525/how-do-i-write-a-named-arrow-function-in-es2015
	e.target.flyTo(e.latlng);
	let informationTag = document.getElementById("currentLocation");
	informationTag.innerHTML = `Clicked location is: Latitude: <span id="latitude"></span>&deg;, Longitude:
		<span id="longitude"></span>&deg;.`;
	latitude = e.latlng.lat;
	longitude = e.latlng.lng;
	document.getElementById('latitude').textContent = latitude;
	document.getElementById('longitude').textContent = longitude; //lon.toFixed(2)//to fixed reduces to 2 degrees of accuracy after 

	if (firstTimeClickedLocation) {
		//red circle for live location
		currentLocationCircle = L.circle([latitude, longitude], {
			color: 'blue',
			fillColor: '#03f',
			fillOpacity: 0.5,
			radius: 10
		}).addTo(theMap);

		firstTimeClickedLocation = false;
	} else {
		currentLocationCircle.setLatLng([latitude, longitude]); //if it's already been created, then just update position and don't recentre the view...
	}
};

function onLocationFound(e) {
	var radius = e.accuracy;

	let informationTag = document.getElementById("currentLocation");
	informationTag.innerHTML = `Live location is: Latitude: <span id="latitude"></span>&deg;, Longitude:
		<span id="longitude"></span>&deg;.`;

	latitude = e.latlng.lat;
	longitude = e.latlng.lng;
	document.getElementById('latitude').textContent = latitude;
	document.getElementById('longitude').textContent = longitude; //lon.toFixed(2)//to fixed reduces to 2 degrees of accuracy after decimal point

	if (firstTimeLiveLocation) {
		//red circle for live location
		liveLocationCircle = L.circle([latitude, longitude], {
			color: 'red',
			fillColor: '#f03',
			fillOpacity: 0.5,
			radius: radius
		}).addTo(theMap);

		firstTimeLiveLocation = false;
	} else {
		liveLocationCircle.setLatLng([latitude, longitude]); //if it's already been created, then just update position and don't recentre the view...
	}

	L.marker(e.latlng).addTo(theMap).bindPopup("You are within " + radius + " metres of this point").openPopup();
}

function onLocationError(e) {
	displayGeolocationError();
	alert(e.message);
	return false;
}

function findWhereIAm() {
	theMap.locate({
		setView: true,
		maxZoom: 16
	});
}

function addMapWithTilesAndGeolocateButton() {
	theMap = L.map('theMap').fitWorld(); //show the whole world before we get a geolocation...

	const attribution =
		'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
	const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	const tiles = L.tileLayer(tileUrl, {
		attribution
	});
	tiles.addTo(theMap);

	// NOTE: layer for all map markers created here, makes removal on refresh of the map much easier...see https://stackoverflow.com/questions/24318862/removing-all-data-markers-in-leaflet-map-before-calling-another-json
	waypointMarkersLayer = new L.LayerGroup();
	// NOTE: We add the markersLayer to the map here. This way, the layer is only added once.
	waypointMarkersLayer.addTo(theMap);

	//add the relevant interaction events to the map
	theMap.on('click', onMapClick);
	theMap.on('locationfound', onLocationFound);
	theMap.on('locationerror', onLocationError);

	//add a button to below the map, that allows users to update their live position when they click it
	const root = document.getElementById("geolocation");
	const button = document.createElement("button");
	button.innerHTML = "Press to locate yourself!";
	button.id = "geolocateButton";

	root.appendChild(button);

	button.addEventListener('click', event => {
		findWhereIAm();
	});

	//try to geolocate...
	findWhereIAm();
}

// async function geoLocate() { // commented out as I'm now using the leaflet JS functionality...
// 	// console.log('Geolocating....');
// 	// geolocates the user's browser
// 	if (checkForGeolocation()) {
// 		navigator.geolocation.getCurrentPosition(async position => {
// 			try {
// 				let informationTag = document.getElementById("geolocation");
// 				informationTag.innerHTML = `Live location is: Latitude: <span id="latitude"></span>&deg;, Longitude:
// 		<span id="longitude"></span>&deg;.`;

// 				latitude = position.coords.latitude;
// 				longitude = position.coords.longitude;
// 				document.getElementById('latitude').textContent = latitude;
// 				document.getElementById('longitude').textContent = longitude; //lon.toFixed(2)//to fixed reduces to 2 degrees of accuracy after decimal point

// 				if (firstTime) {
// 					//red circle for live location
// 					liveLocationRedCircle = L.circle([latitude, longitude], {
// 						color: 'red',
// 						fillColor: '#f03',
// 						fillOpacity: 0.5,
// 						radius: 21
// 					}).addTo(theMap);
// 					//theMap.setView([latitude, longitude], 17) //centre the view on the geolocation the first time we get a value
// 					theMap.flyTo([latitude, longitude], 17); //fly to the geolocation the first time we get a value
// 					firstTime = false;
// 				} else {
// 					liveLocationRedCircle.setLatLng([latitude, longitude]); //if it's already been created, then just update position and don't recentre the view...
// 				}
// 			} catch (error) {
// 				console.error(error);
// 			}
// 		});
// 	}
// }

function addAddWaypointButton() {
	//adds an add waypoint button to the DOM, IFF geolocation is available
	if (checkForGeolocation()) {
		const root = document.createElement("p");

		//make the form, waypoint label text field and label
		const waypointLabel = document.createElement("input");
		waypointLabel.type = "text";
		waypointLabel.id = "waypointLabel";
		waypointLabel.size = 42;
		let promptText = "type here first";
		waypointLabel.value = promptText;
		const waypointLabelHTMLLabel = document.createElement("label");
		waypointLabelHTMLLabel.setAttribute("for", "waypointLabel"); //https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label
		waypointLabelHTMLLabel.innerHTML = "Waypoint label: ";

		root.appendChild(document.createElement("br"));
		root.appendChild(waypointLabelHTMLLabel); // put it into the DOM
		root.appendChild(waypointLabel); // put it into the DOM

		//make the waypoint multimedia URL  field and label
		const waypointMultimedia = document.createElement("input");
		waypointMultimedia.type = "url"; // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/url
		waypointMultimedia.id = "waypointMultimedia";
		waypointMultimedia.size = 88;
		waypointMultimedia.value = "https://reasons.to/content/0-2009/1-brighton/1-speakers/0-joel-gethin-lewis/joel-gethin-lewis.jpg";
		const waypointMultimediaHTMLLabel = document.createElement("label");
		waypointMultimediaHTMLLabel.setAttribute("for", "waypointMultimedia");
		waypointMultimediaHTMLLabel.innerHTML = "Waypoint multimedia URL: ";

		root.appendChild(document.createElement("br"));
		root.appendChild(waypointMultimediaHTMLLabel); // put it into the DOM
		root.appendChild(waypointMultimedia); // put it into the DOM

		//make the waypoint range number field and label
		const waypointRange = document.createElement("input");
		waypointRange.type = "number"; //https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/number
		waypointRange.id = "waypointRange";
		waypointRange.min = 1;
		waypointRange.max = 100;
		waypointRange.value = 42;
		const waypointRangeHTMLLabel = document.createElement("label");
		waypointRangeHTMLLabel.setAttribute("for", "waypointRange");
		waypointRangeHTMLLabel.innerHTML = "Waypoint range (in whole metres):";

		root.appendChild(document.createElement("br"));
		root.appendChild(waypointRangeHTMLLabel); // put it into the DOM
		root.appendChild(waypointRange); // put it into the DOM

		//make the button to add the label and location to the database
		const button = document.createElement("button");
		button.innerHTML = "Add waypoint";
		button.id = "addWaypointButton";
		button.disabled = true;

		root.appendChild(document.createElement("br"));
		root.appendChild(button);

		//add the newly created root node to the document
		const buttonAndLabelDiv = document.getElementById("addWaypoint");
		buttonAndLabelDiv.appendChild(root);

		// https://itnext.io/https-medium-com-joshstudley-form-field-validation-with-html-and-a-little-javascript-1bda6a4a4c8c
		waypointLabel.addEventListener('keyup', event => {
			const isValidLabel = (event.srcElement.value.length > 0) && (event.srcElement.value != promptText); //only checking if any text is added at the moment

			if (isValidLabel) {
				button.disabled = false;
			} else {
				button.disabled = true;
			}
		});

		button.addEventListener('click', async event => {
			let label = document.getElementById("waypointLabel").value;
			let multimedia = document.getElementById("waypointMultimedia").value; //TODO: make this safe - need to escape the text to make sure nothing malicious in the URL - not much validation happing atm - https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/url
			let range = Number(document.getElementById("waypointRange").value);

			const data = {
				label,
				latitude,
				longitude,
				multimedia,
				range
			};
			const options = {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			};
			const response = await fetch('/waypoint', options);
			const someJson = await response.json();
			//console.log(`Response from server: ${someJson}`);
			displayTour(); //now we've added the new waypoint, refresh all of them
		});
	}
}

async function getClientSideTour() {
	// console.log(`Inside getClientSideTour function`);

	const response = await fetch('/tour');
	const serverTour = await response.json();
	console.log(`serverTour at the start of getClientSideTour is ${JSON.stringify(serverTour)}`);

	let waypointsList = document.getElementById("waypointsList");

	let liveTour = {
		"title": serverTour.title, //todo make the tour title editable, so this will likely be a conversion from the live dom to the json here
		"waypoints": [] //no waypoints as yet....
	};

	for (let waypointDivision of waypointsList.children) {
		let currentWaypoint = {
			"label": "",
			"latitude": 0,
			"longitude": 0,
			"timestamp": -1,
			"multimedia": "",
			"range": -1
		};

		//currently the structure:
		// < div class="list-group-item" >
		// 	0th child element: < i class = \"fas fa-arrows-alt handle\" aria-hidden=\"true\"></i>
		// 	1st child element: < div class = \"waypoint-label\">Second</div>
		// 	2nd child element: < div class = \"waypoint-geo\">51.6061598°, 0.0016259°</div>
		// 	3rd child element: < div class = \"waypoint-date\">8/6/2019, 7:34:24 PM</div>
		// 	4th child element: < i class = \"fas fa-trash\" aria-hidden=\"true\"></i >
		// 	5th child element: < div class = \"waypoint-latitude-hidden\" hidden=\"\">51.6061598</div>
		// 	6th child element: < div class = \"waypoint-longitude-hidden\" hidden=\"\">0.0016259</div>
		// 7th child element: < div class= \"waypoint-timestamp-hidden\" hidden=\"\">1565116464662</div>
		// < /div>

		//but lets at least try to select the relevant element, rather than doing direct array access a la:
		//currentWaypoint.label = waypointDivision.children[1].innerHTML; // horrible and fragile, below method is better

		currentWaypoint.label = waypointDivision.querySelector('div.waypoint-label').innerHTML; //https://developer.mozilla.org/en-US/docs/Web/API/Element/querySelector / https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector
		//important that these are numbers, not text
		currentWaypoint.latitude = Number(waypointDivision.querySelector('div.waypoint-latitude-hidden').innerHTML);
		currentWaypoint.longitude = Number(waypointDivision.querySelector('div.waypoint-longitude-hidden').innerHTML);
		currentWaypoint.timestamp = Number(waypointDivision.querySelector('div.waypoint-timestamp-hidden').innerHTML);
		currentWaypoint.multimedia = waypointDivision.querySelector('div.waypoint-multimedia').innerHTML;
		currentWaypoint.range = Number(waypointDivision.querySelector('div.waypoint-range').innerHTML);

		liveTour.waypoints.push(currentWaypoint);
	}

	// console.log(`The live tour is ${JSON.stringify(liveTour)}`);
	return liveTour;
}

async function saveTour(newTour) {
	// console.log(`Inside saveTour function`);
	const options = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(newTour)
	};
	const response = await fetch('/tour', options);
	const jsonResponseFromServer = await response.json();
	// console.log(`Response from server, after editing tour: ${JSON.stringify(jsonResponseFromServer)}`);
}

async function displayTour() {
	// console.log(`Inside displayTour function`);
	const response = await fetch('/tour');
	const tour = await response.json();

	// console.log(`displayTour: The tour from the server is ${JSON.stringify(tour)}`);

	let waypoints = document.getElementById("waypoints");

	while (waypoints.firstChild) { // make sure none of the  old information is there.... https://stackoverflow.com/questions/3955229/remove-all-child-elements-of-a-dom-node-in-javascript
		waypoints.removeChild(waypoints.firstChild);
	}
	//console.log(`Waypoints should be empty at this point.`);

	//remove all the previously added markers from the map, by clearing the layer we have previously created
	waypointMarkersLayer.clearLayers();

	const descriptionElement = document.createElement('p');
	descriptionElement.innerHTML = `Current waypoints: (drag <i class="
	fas fa-arrows-alt "></i> to reorder, click <i class="
	fas fa-trash "></i> to delete)`;
	waypoints.append(descriptionElement);

	if (!tour.waypoints.length) {
		descriptionElement.innerHTML = "No waypoints! Please add some above.";
		return;
	}

	const divOfWaypoints = document.createElement('div');
	divOfWaypoints.id = "waypointsList";
	divOfWaypoints.classList.add("list-group"); // https://developer.mozilla.org/en-US/docs/Web/API/Element/classList
	divOfWaypoints.classList.add("col"); //bootstrap CSS via https://getbootstrap.com/

	let currentWaypointIndex = 0; //counter for waypoint order

	const pointList = [];

	for (let waypoint of tour.waypoints) {
		const root = document.createElement('div');
		root.classList.add("list-group-item"); //bootstrap CSS via https://getbootstrap.com/

		const handleIcon = document.createElement('i');
		handleIcon.classList.add("fas", "fa-arrows-alt", "handle"); // adding Fontawesome icon: https://fontawesome.com/icons/arrows-alt?style=solid

		const label = document.createElement('div');
		label.classList.add("waypoint-label");
		const date = document.createElement('div');
		date.classList.add("waypoint-date");
		const geo = document.createElement('div');
		geo.classList.add("waypoint-geo");
		const multimedia = document.createElement('div');
		multimedia.classList.add("waypoint-multimedia");
		const range = document.createElement('div');
		range.classList.add("waypoint-range");
		const rubbishIcon = document.createElement('i'); //adding rubbish icon
		rubbishIcon.classList.add("fas", "fa-trash");
		const hiddenLatitude = document.createElement('div');
		hiddenLatitude.classList.add("waypoint-latitude-hidden");
		const hiddenLongitude = document.createElement('div');
		hiddenLongitude.classList.add("waypoint-longitude-hidden");
		const hiddenTimestamp = document.createElement('div');
		hiddenTimestamp.classList.add("waypoint-timestamp-hidden");

		//set the content of visible UI elements
		label.textContent = waypoint.label;
		geo.textContent = `${waypoint.latitude}°, ${waypoint.longitude}°`;
		const dateString = new Date(waypoint.timestamp).toLocaleString();
		date.textContent = dateString;
		multimedia.textContent = waypoint.multimedia;
		range.textContent = waypoint.range;
		//const marker = L.marker([waypoint.latitude, waypoint.longitude]).addTo(theMap);
		const marker = L.marker([waypoint.latitude, waypoint.longitude]);
		marker.bindPopup(`Waypoint ${currentWaypointIndex + 1}:${waypoint.label}`);
		waypointMarkersLayer.addLayer(marker);

		//set the content of hidden UI elements, avoids horrible and insecure de-formating of strings from html
		hiddenLatitude.textContent = waypoint.latitude;
		hiddenLongitude.textContent = waypoint.longitude;
		hiddenTimestamp.textContent = waypoint.timestamp;
		//now make them hidden - https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/hidden
		hiddenLatitude.hidden = true;
		hiddenLongitude.hidden = true;
		hiddenTimestamp.hidden = true;

		//set up the click event interaction for the rubbish icon
		rubbishIcon.addEventListener('click', async event => {
			console.log(`Rubbish bin pressed!`);
			let userConfirmed = confirm("Are you sure you want to delete this waypoint?");

			if (userConfirmed) {
				root.remove(); //removing the clicked waypoint, by deleting it from the DOM

				let editedTour = await getClientSideTour(); //have to AWAIT this, as we need getClientSideTour to finish before we continue with the below...
				console.log(`rubbishIcon: The edited tour is ${JSON.stringify(editedTour)}`);
				saveTour(editedTour);
				displayTour(); //now we've edited the tour, and posted it to the server, refresh it
			}
		});

		root.append(handleIcon, label, date, geo, multimedia, range, rubbishIcon, hiddenLatitude, hiddenLongitude, hiddenTimestamp);
		divOfWaypoints.append(root);

		pointList.push([waypoint.latitude, waypoint.longitude]); // this list is used to make the poly line for the map....

		currentWaypointIndex++;
	}

	waypoints.append(divOfWaypoints);

	// now make a path of all the waypoints in order, using:
	// https://github.com/CodingTrain/Intro-to-Data-APIs-JS/blob/source/module3/the_weather_here_exercises/public/checkins/logs.js
	// polyline from leaflet.js
	// Add a line path
	const polyLine = new L.Polyline(pointList, {
		color: 'purple',
		weight: 3,
		opacity: 1,
		smoothFactor: 1
	});
	waypointMarkersLayer.addLayer(polyLine); // adding to the markers layer for easy deletion/reconstruction...

	//now style and interaction it using SortableJS
	//https://sortablejs.github.io/Sortable/

	var el = document.getElementById('waypointsList');
	var sortable = new Sortable(el, {
		handle: '.handle', // handle's class
		animation: 150
	});
}

function addSaveTourButton() {
	//adds a save tour button to the DOM, IFF geolocation is available
	if (checkForGeolocation()) {
		let saveTag = document.getElementById("saveTour");
		saveTag.innerHTML = "Click disk/save icon to save tour: ";
		const saveIcon = document.createElement('i'); //adding rubbish icon
		saveIcon.classList.add("fas", "fa-save");
		saveIcon.id = "saveTourButton";
		saveTag.appendChild(saveIcon);

		saveIcon.addEventListener('click', async event => {
			// console.log("About to call get live tour from within saveIcon event listener...!");
			let editedTour = await getClientSideTour();
			// console.log(`The edited tour is ${JSON.stringify(editedTour)}`);
			saveTour(editedTour);
			displayTour(); //now we've edited the tour, and posted it to the server, refresh it
		});

	}
}

//actually set up the page, the map with geolocate button, the tour, the add waypoint button and the saving button
checkForGeolocation();
addMapWithTilesAndGeolocateButton();
// geoLocate(); //commented out as I'm now using leafletjs geolocation
displayTour();
addAddWaypointButton();
addSaveTourButton();
// setInterval(geoLocate, 1000); //geolocate every 1000 milliseconds / 1  second, an async function, so other things can happen too... // geolocating is now taken care of by the user clicking to geolocate..
