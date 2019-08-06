let latitude, longitude, theMap, liveLocationRedCircle;

latitude = 0; //latitude is north/south amount
longitude = 0; // longitude is east/west amount - prime meridian (0) is London, Longitude rewards - https://en.wikipedia.org/wiki/Longitude_rewards
let firstTime = true; //boolean state for first time run, hacky

function onMapClick(e) {
	//alert("You clicked the map at " + e.latlng);
	theMap.setLatLng(e.latlng);
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
	console.log('Geolocating....');
	// Geolocates the user's browser
	if (checkForGeolocation()) {
		navigator.geolocation.getCurrentPosition(async position => {
			try {
				let informationTag = document.getElementById("geolocation");
				informationTag.innerHTML = `Your location is: Latitude: <span id="latitude"></span>&deg;, Longitude:
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
					theMap.setView([latitude, longitude], 17) //centre the view on the geolocation the first time we get a value
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

function addSaveButton() {
	//adds a button to the DOM, IFF geolocation is available
	if (checkForGeolocation()) {
		const root = document.createElement('p');
		const button = document.createElement("button");
		button.innerHTML = "Save current location to walking tour";
		root.append(button);

		const saveButtonDiv = document.getElementById("saveButton");
		saveButtonDiv.append(root);

		button.addEventListener('click', async event => {
			const data = {
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
			displayPreviousLocations(); //now we've added the new point, refresh the walking tour locations
		});
	}
}

async function displayPreviousLocations() {
	const response = await fetch('/api');
	const data = await response.json();
	let waypoints = document.getElementById("waypoints");

	while (waypoints.firstChild) { // make sure none of the  old information is there.... https://stackoverflow.com/questions/3955229/remove-all-child-elements-of-a-dom-node-in-javascript
		waypoints.removeChild(waypoints.firstChild);
	}

	const descriptionElement = document.createElement('p');
	descriptionElement.innerHTML = "Walking tour waypoints:";
	waypoints.append(descriptionElement);

	if (!(data.length > 0)) {
		descriptionElement.innerHTML = "No previously added waypoints! Please add some above.";
		return;
	}

	const listOfPreviousLocations = document.createElement('ol');

	for (item of data) {
		const root = document.createElement('li');
		const geo = document.createElement('div');
		const date = document.createElement('div');

		geo.textContent = `${item.latitude}°, ${item.longitude}°`;
		const dateString = new Date(item.timestamp).toLocaleString();
		date.textContent = dateString;

		root.append(geo, date);
		listOfPreviousLocations.append(root);

		const marker = L.marker([item.latitude, item.longitude]).addTo(theMap);
	}

	waypoints.append(listOfPreviousLocations);
}

addMapWithTiles();
geoLocate();
displayPreviousLocations();
addSaveButton();
setInterval(geoLocate, 1000); //geolocate every 1000 milliseconds / second