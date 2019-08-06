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
				informationTag.innerHTML = `New waypoint location is: Latitude: <span id="latitude"></span>&deg;, Longitude:
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

		//make the form, way point description text field and label
		const description = document.createElement("input");
		description.type = "text";
		description.id = "waypointDescription";
		description.value = "type here first";
		const descriptionLabel = document.createElement("label");
		descriptionLabel.setAttribute("for", "waypointDescription");
		descriptionLabel.innerHTML = "Waypoint label: ";

		root.appendChild(descriptionLabel); // put it into the DOM
		root.appendChild(description); // put it into the DOM

		//make the button to add the description and location to the database
		const button = document.createElement("button");
		button.innerHTML = "Add waypoint";
		button.id = "submitWaypointButton"
		button.disabled = true;

		root.appendChild(button);

		//add the newly created root node to the document
		const buttonAndDescriptionDiv = document.getElementById("addWaypoint");
		buttonAndDescriptionDiv.appendChild(root);

		// https://itnext.io/https-medium-com-joshstudley-form-field-validation-with-html-and-a-little-javascript-1bda6a4a4c8c
		description.addEventListener('keyup', event => {

			const isValidDescription = (event.srcElement.value.length > 0) && (event.srcElement.value != "type here first"); //only checking if any text is added at the moment

			if (isValidDescription) {
				button.disabled = false;
			} else {
				button.disabled = true;
			}
		});

		button.addEventListener('click', async event => {
			let waypointDescription = document.getElementById("waypointDescription").value;

			const data = {
				waypointDescription,
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
			const response = await fetch('/api', options);
			const json = await response.json();
			//console.log(`Response from server: ${json}`);
			displayWaypoints(); //now we've added the new waypoint, refresh all of them
		});
	}
}

async function displayWaypoints() {
	const response = await fetch('/api');
	const data = await response.json();
	let waypoints = document.getElementById("waypoints");

	while (waypoints.firstChild) { // make sure none of the  old information is there.... https://stackoverflow.com/questions/3955229/remove-all-child-elements-of-a-dom-node-in-javascript
		waypoints.removeChild(waypoints.firstChild);
	}

	const descriptionElement = document.createElement('p');
	descriptionElement.innerHTML = "Current waypoints: (drag to reorder, or drag away to delete)";
	waypoints.append(descriptionElement);

	if (!(data.length > 0)) {
		descriptionElement.innerHTML = "No waypoints! Please add some above.";
		return;
	}

	const listOfPreviousLocations = document.createElement('ol');

	let i = 1 //counter for waypoint order

	for (item of data) {
		const root = document.createElement('li');
		const textDescription = document.createElement('div');
		const geo = document.createElement('div');
		const date = document.createElement('div');

		textDescription.textContent = item.waypointDescription;
		geo.textContent = `${item.latitude}°, ${item.longitude}°`;
		const dateString = new Date(item.timestamp).toLocaleString();
		date.textContent = dateString;

		root.append(textDescription, geo, date);
		listOfPreviousLocations.append(root);

		const marker = L.marker([item.latitude, item.longitude]).addTo(theMap);
		marker.bindPopup(`Waypoint ${i}:${item.waypointDescription}`);
		i++;
	}

	waypoints.append(listOfPreviousLocations);

	//now style and interaction it using SortableJS
	//https://sortablejs.github.io/Sortable/
	//var example1 = document.getElementById('example1');

	// Example 1 - Simple list and https://github.com/SortableJS/Sortable/tree/master/plugins/OnSpill
	new Sortable(listOfPreviousLocations, {
		animation: 150,
		removeOnSpill: true, // Enable plugin
		//Called when item is spilled
		onSpill: function(/**Event*/evt) {
			evt.item // The spilled item
		}
	});
}

addMapWithTiles();
geoLocate();
displayWaypoints();
addSaveButtonAndWaypointDescription();
setInterval(geoLocate, 1000); //geolocate every 1000 milliseconds / second, an async function, so other things can happen too...