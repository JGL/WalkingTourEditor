let latitude, longitude, theMap, liveLocationRedCircle;

latitude = 0; //latitude is north/south amount
longitude = 0; // longitude is east/west amount - prime meridian (0) is London, Longitude rewards - https://en.wikipedia.org/wiki/Longitude_rewards
let firstTime = true; //boolean state for first time run, hacky


let onMapClick = e => { // https://stackoverflow.com/questions/27977525/how-do-i-write-a-named-arrow-function-in-es2015
	e.target.flyTo(e.latlng);
}

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
		informationTag.innerHTML = `Geolocation not available, do you have location services enabled? <a href='https://support.apple.com/en-gb/HT207092'>Help for Apple iOS devices</a> / <a href='https://support.google.com/accounts/answer/3467281?hl=en'>Help for Google Android devices</a>. Geolocation required for this tour to function.`
		return false;
	}
}

async function geoLocate() {
	// console.log('Geolocating....');
	// Geolocates the user's browser
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
					theMap.flyTo([latitude, longitude], 17) //centre the view on the geolocation the first time we get a value
					firstTime = false;
				} else {
					liveLocationRedCircle.setLatLng([latitude, longitude]); //if it's already been created, then just update position and don't recentre the view...
				}
			} catch (error) {
				console.error(error);;
			}
		});
	}
}

function addSaveButtonAndWaypointDescription() {
	//adds a button to the DOM, IFF geolocation is available
	if (checkForGeolocation()) {
		const root = document.createElement("p");

		//make the form, way point label text field and label
		const waypointLabel = document.createElement("input");
		waypointLabel.type = "text";
		waypointLabel.id = "waypointLabel";
		let promptText = "type here first";
		waypointLabel.value = promptText;
		const waypointLabelHTMLLabel = document.createElement("label");
		waypointLabelHTMLLabel.setAttribute("for", "waypointLabel");
		waypointLabelHTMLLabel.innerHTML = "Waypoint label: ";

		root.appendChild(waypointLabelHTMLLabel); // put it into the DOM
		root.appendChild(waypointLabel); // put it into the DOM

		//make the button to add the label and location to the database
		const button = document.createElement("button");
		button.innerHTML = "Add waypoint";
		button.id = "addWaypointButton"
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

	const descriptionElement = document.createElement('p');
	descriptionElement.innerHTML = `Current waypoints: (drag <i class="
	fas fa-arrows-alt "></i> to reorder, click <i class="
	fas fa-trash "></i> to delete)`;
	waypoints.append(descriptionElement);

	if (!(tour.waypoints.length > 0)) {
		descriptionElement.innerHTML = "No waypoints! Please add some above.";
		return;
	}

	const divOfWaypoints = document.createElement('div');
	divOfWaypoints.id = "waypointsList";
	divOfWaypoints.classList.add("list-group"); // https://developer.mozilla.org/en-US/docs/Web/API/Element/classList
	divOfWaypoints.classList.add("col"); //Bootstrap CSS via https://getbootstrap.com/

	let i = 0; //counter for waypoint order

	for (waypoint of tour.waypoints) {
		const root = document.createElement('div');
		root.classList.add("list-group-item"); //Bootstrap CSS via https://getbootstrap.com/
		const handle = document.createElement('i');
		handle.classList.add("fas", "fa-arrows-alt", "handle"); // adding Fontawesome icon: https://fontawesome.com/icons/arrows-alt?style=solid
		const label = document.createElement('div');
		const geo = document.createElement('div');
		const date = document.createElement('div');
		const rubbish = document.createElement('i');
		rubbish.classList.add("fas", "fa-trash");

		rubbish.addEventListener('click', async event => {
			console.log(`Rubbish bin pressed!`);
			root.remove(); //removing the clicked waypoint, by deleting it from the DOM

			//console.log(divOfWaypoints); // this is the html div that we construct the edited tour from

			let editedTour = {
				"title": tour.title, //todo make the tour title editable, so this will likely be a conversion from the live dom to the json here
				"waypoints": [] //no waypoints as yet....
			};

			for (waypointDivision of divOfWaypoints.children) {
				let currentWaypoint = {
					"label": "",
					"latitude": 0,
					"longitude": 0,
					"timestamp": -1
				};

				// < div class="list-group-item" >
				// 	0th child element:<i class="fas fa-arrows-alt handle" aria - hidden = "true" > < /i>
				// 	1st child element:<div>Second</div >
				// 	2nd child element:<div> 51.6061598°, 0.0016259° < /div>
				// 	3rd child element:<div>06/08 / 2019, 19: 34: 24 < /div>
				//  4th child element:<i class="fas fa-trash" aria-hidden="true"></i >
				// < /div>

				// label is 1st child element
				currentWaypoint.label = waypointDivision.children[1].innerHTML; // horrible and fragile!

				// location is 2nd child element
				const tempLocationString = waypointDivision.children[2].innerHTML; // horrible and fragile!
				const splitLocationArray = tempLocationString.split(",");

				let tempLatitude = splitLocationArray[0]; // horrible and fragile!
				let tempLongitude = splitLocationArray[1]; // horrible and fragile!

				//getting rid of degree symbols and the like
				tempLatitude.trim();
				tempLatitude = tempLatitude.replace('°', '');
				tempLongitude.trim();
				tempLongitude = tempLongitude.replace('°', '');

				currentWaypoint.latitude = Number(tempLatitude);
				currentWaypoint.longitude = Number(tempLongitude);

				// timestamp is the 3rd child element
				//https://stackoverflow.com/questions/40768606/i-have-a-utc-string-and-i-want-to-convert-it-to-utc-date-object-in-javascript/40768745#40768745
				// problem is doing: Date(waypointDivision.children[3].innerHTML); messes up because it thinks it's a US date string, so the month and day are mixed up....
				// The html timestamp is 07/08/2019, 17:08:39
				// TODO fix this as I'm only remembering the seconds, the milliseconds aren't being displayed....
				// TODO perhaps its better just to rember the timestamp and only display formatted html instead of converting it?
				const tempDateTimeString = waypointDivision.children[3].innerHTML;

				const splitDateTimeString = tempLocationString.split(",");

				const tempDateString = splitDateTimeString[0];
				const tempTimeString = splitDateTimeString[1];

				const splitDateString = tempDateString.split("/");

				const tempDay = Number(splitDateString[0]);
				const tempMonth = Number(splitDateString[1]) - 1; //-1 as months are 0 addressed in Javascript
				const tempYear = Number(splitDateString[2]);

				const splitTimeString = tempTimeString.split(":");

				const tempHour = Number(splitTimeString[0]);
				const tempMinute = Number(splitTimeString[1]);
				const tempSecond = Number(splitTimeString[2]);

				const reconstructedTimetamp = new Date(tempYear, tempMonth, tempDay, tempHour, tempMinute, tempSecond);

				console.log(`Time stamp is ${reconstructedTimetamp}`);

				currentWaypoint.timestamp = reconstructedTimetamp;
				editedTour.waypoints.push(currentWaypoint);
			}

			// const options = {
			// 	method: 'POST',
			// 	headers: {
			// 		'Content-Type': 'application/json'
			// 	},
			// 	body: JSON.stringify(editedTour)
			// };
			// const response = await fetch('/tour', options);
			// const json = await response.json();
			// console.log(`Response from server: ${json}`);
			// displayTour(); //now we've edited the tour, and posted it to the server, refresh it
		});

		label.textContent = waypoint.label;
		geo.textContent = `${waypoint.latitude}°, ${waypoint.longitude}°`;
		const dateString = new Date(waypoint.timestamp).toLocaleString();
		date.textContent = dateString;

		root.append(handle, label, geo, date, rubbish);
		divOfWaypoints.append(root);

		const marker = L.marker([waypoint.latitude, waypoint.longitude]).addTo(theMap);
		marker.bindPopup(`Waypoint ${i+1}:${waypoint.label}`);
		i++;
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

addMapWithTiles();
geoLocate();
displayTour();
addSaveButtonAndWaypointDescription();
setInterval(geoLocate, 1000); //geolocate every 1000 milliseconds / second, an async function, so other things can happen too...