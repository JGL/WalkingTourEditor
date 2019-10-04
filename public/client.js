let latitude, longitude, theMap, liveLocationRedCircle, markersLayer;

latitude = 0; // latitude is north/south amount
longitude = 0; // longitude is east/west amount - prime meridian (0) is London, Longitude rewards - https://en.wikipedia.org/wiki/Longitude_rewards
let firstTime = true; //boolean state for first time run, hacky


let onMapClick = e => { // https://stackoverflow.com/questions/27977525/how-do-i-write-a-named-arrow-function-in-es2015
	e.target.flyTo(e.latlng);
};

function addMapWithTiles() {
	theMap = L.map('theMap').setView([latitude, longitude], 0); //start at zoom zero, before we have a geolocation
	const attribution =
		'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
	const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	const tiles = L.tileLayer(tileUrl, {
		attribution
	});
	tiles.addTo(theMap);

	theMap.on('click', onMapClick);

	markersLayer = new L.LayerGroup(); // NOTE: layer for all map markers created here, makes removal on refresh of the map much easier...see https://stackoverflow.com/questions/24318862/removing-all-data-markers-in-leaflet-map-before-calling-another-json
	// NOTE: We add the markersLayer to the map here. This way, the layer is only added once.
	markersLayer.addTo(theMap);
}

function checkForGeolocation() {
	if ('geolocation' in navigator) {
		if (firstTime) { // only log once, for performance sake
			console.log('geolocation available');
		}
		return true;
	} else {
		if (firstTime) { // only log once, for performance sake
			console.log('geolocation not available');
		}
		let informationTag = document.getElementById("geolocation");
		informationTag.innerHTML = `Geolocation not available, do you have location services enabled? <a href='https://support.apple.com/en-gb/HT207092'>Help for Apple iOS devices</a> / <a href='https://support.google.com/accounts/answer/3467281?hl=en'>Help for Google Android devices</a>. Geolocation required for this tour to function.`;
		return false;
	}
}

async function geoLocate() {
	// console.log('Geolocating....');
	// geolocates the user's browser
	if (checkForGeolocation()) {
		navigator.geolocation.getCurrentPosition(async position => {
			try {
				let informationTag = document.getElementById("geolocation");
				informationTag.innerHTML = `Live location is: Latitude: <span id="latitude"></span>&deg;, Longitude:
		<span id="longitude"></span>&deg;.`;

				latitude = position.coords.latitude;
				longitude = position.coords.longitude;
				document.getElementById('latitude').textContent = latitude;
				document.getElementById('longitude').textContent = longitude; //lon.toFixed(2)//to fixed reduces to 2 degrees of accuracy after decimal point

				if (firstTime) {
					//red circle for live location
					liveLocationRedCircle = L.circle([latitude, longitude], {
						color: 'red',
						fillColor: '#f03',
						fillOpacity: 0.5,
						radius: 21
					}).addTo(theMap);
					//theMap.setView([latitude, longitude], 17) //centre the view on the geolocation the first time we get a value
					theMap.flyTo([latitude, longitude], 17); //fly to the geolocation the first time we get a value
					firstTime = false;
				} else {
					liveLocationRedCircle.setLatLng([latitude, longitude]); //if it's already been created, then just update position and don't recentre the view...
				}
			} catch (error) {
				console.error(error);
			}
		});
	}
}

function addAddWaypointButton() {
	//adds an add waypoint button to the DOM, IFF geolocation is available
	if (checkForGeolocation()) {
		const root = document.createElement("p");

		//make the form, way point label text field and label
		const waypointLabel = document.createElement("input");
		waypointLabel.type = "text";
		waypointLabel.id = "waypointLabel";
		let promptText = "type here first";
		waypointLabel.value = promptText;
		const waypointLabelHTMLLabel = document.createElement("label");
		waypointLabelHTMLLabel.setAttribute("for", "waypointLabel"); //https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label
		waypointLabelHTMLLabel.innerHTML = "Waypoint label: ";

		root.appendChild(waypointLabelHTMLLabel); // put it into the DOM
		root.appendChild(waypointLabel); // put it into the DOM

		//make the button to add the label and location to the database
		const button = document.createElement("button");
		button.innerHTML = "Add waypoint";
		button.id = "addWaypointButton";
		button.disabled = true;

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

			const data = {
				label,
				latitude,
				longitude
			};
			const options = {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			};
			const response = await fetch('/waypoint', options);
			const json = await response.json();
			//console.log(`Response from server: ${json}`);
			displayTour(); //now we've added the new waypoint, refresh all of them
		});
	}
}

async function displayTour() {
	const response = await fetch('/tour');
	const tour = await response.json();

	let waypoints = document.getElementById("waypoints");

	while (waypoints.firstChild) { // make sure none of the  old information is there.... https://stackoverflow.com/questions/3955229/remove-all-child-elements-of-a-dom-node-in-javascript
		waypoints.removeChild(waypoints.firstChild);
	}
	//console.log(`Waypoints should be empty at this point.`);

	//remove all the previously added markers from the map, by clearing the layer we have previously created
	markersLayer.clearLayers();

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

	for (let waypoint of tour.waypoints) {
		const root = document.createElement('div');
		root.classList.add("list-group-item"); //bootstrap CSS via https://getbootstrap.com/

		const handleIcon = document.createElement('i');
		handleIcon.classList.add("fas", "fa-arrows-alt", "handle"); // adding Fontawesome icon: https://fontawesome.com/icons/arrows-alt?style=solid

		const label = document.createElement('div');
		label.classList.add("waypoint-label");
		const geo = document.createElement('div');
		geo.classList.add("waypoint-geo");
		const date = document.createElement('div');
		date.classList.add("waypoint-date");
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
		//const marker = L.marker([waypoint.latitude, waypoint.longitude]).addTo(theMap);
		const marker = L.marker([waypoint.latitude, waypoint.longitude]);
		marker.bindPopup(`Waypoint ${currentWaypointIndex + 1}:${waypoint.label}`);
		markersLayer.addLayer(marker);

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
			root.remove(); //removing the clicked waypoint, by deleting it from the DOM

			console.log(divOfWaypoints.children); // this is the html div that we construct the edited tour from

			let editedTour = {
				"title": tour.title, //todo make the tour title editable, so this will likely be a conversion from the live dom to the json here
				"waypoints": [] //no waypoints as yet....
			};

			for (let waypointDivision of divOfWaypoints.children) {
				let currentWaypoint = {
					"label": "",
					"latitude": 0,
					"longitude": 0,
					"timestamp": -1
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

				editedTour.waypoints.push(currentWaypoint);
			}

			console.log(`The edited tour is ${JSON.stringify(editedTour)}`);

			const options = {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(editedTour)
			};
			const response = await fetch('/tour', options);
			const jsonResponseFromServer = await response.json();
			console.log(`Response from server, after editing tour: ${JSON.stringify(jsonResponseFromServer)}`);
			displayTour(); //now we've edited the tour, and posted it to the server, refresh it
		});

		root.append(handleIcon, label, geo, date, rubbishIcon, hiddenLatitude, hiddenLongitude, hiddenTimestamp);
		divOfWaypoints.append(root);

		currentWaypointIndex++; //
	}

	waypoints.append(divOfWaypoints);

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
		const divForSave = document.createElement("div");
		divForSave.id = "saveTour";
		divForSave.textContent = "Click save icon to save tour.";
		const saveIcon = document.createElement('i'); //adding rubbish icon
		saveIcon.classList.add("fas", "fa-save");
		saveIcon.id = "saveTourButton";
		divForSave.appendChild(saveIcon);

		//add the newly created divForSave node to the document
		let save = document.getElementById("saveTour");
		save.appendChild(divForSave); //adding all the new DOM above to the html page at the correct place

		saveIcon.addEventListener('click', async event => {
			console.log("Should save now!");
			//TODO - save it properly? should refresh too for safety?
		});

	}
}

addMapWithTiles();
geoLocate();
displayTour();
addAddWaypointButton();
addSaveTourButton();
setInterval(geoLocate, 1000); //geolocate every 1000 milliseconds / second, an async function, so other things can happen too...