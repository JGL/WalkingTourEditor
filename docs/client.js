// Below is drawing code from https://joeyklee.github.io/geosandbox/hello-drawing-tool.html#section7

let drawnItems, drawControl;

// Below is code from clientInformation.js of the node based walking tour editor
let latitude,
  longitude,
  theMap,
  liveLocationCircle,
  currentLocationCircle,
  waypointMarkersLayer;

latitude = 0; // latitude is north/south amount
longitude = 0; // longitude is east/west amount - prime meridian (0) is London, Longitude rewards - https://en.wikipedia.org/wiki/Longitude_rewards
let firstTimeLiveLocation = true; //boolean state for first time run, hacky
let firstTimeClickedLocation = true; //ditto as above!!!

function displayGeolocationError() {
  let informationTag = document.getElementById("currentLocation");
  informationTag.innerHTML = `<b>Error</b> - geolocation not available, do you have location services enabled?<br/><a href='https://support.apple.com/en-gb/HT207092'>Help for Apple iOS devices</a>.<br/><a href='https://support.google.com/accounts/answer/3467281?hl=en'>Help for Google Android devices</a>.<br/>Geolocation is <b>required</b> to be able to find yourself on the map automatically.`;
}

function checkForGeolocation() {
  if ("geolocation" in navigator) {
    if (firstTimeLiveLocation) {
      // only log once, for performance sake
      console.log("geolocation available");
    }
    return true;
  } else {
    if (firstTimeLiveLocation) {
      // only log once, for performance sake
      console.log("geolocation not available");
    }
    displayGeolocationError();
    return false;
  }
}

let onMapClick = (e) => {
  // https://stackoverflow.com/questions/27977525/how-do-i-write-a-named-arrow-function-in-es2015
  e.target.flyTo(e.latlng);
  let informationTag = document.getElementById("currentLocation");
  informationTag.innerHTML = `Clicked location is: Latitude: <span id="latitude"></span>&deg;, Longitude:
		<span id="longitude"></span>&deg;.`;
  latitude = e.latlng.lat;
  longitude = e.latlng.lng;
  document.getElementById("latitude").textContent = latitude;
  document.getElementById("longitude").textContent = longitude; //lon.toFixed(2)//to fixed reduces to 2 degrees of accuracy after

  if (firstTimeClickedLocation) {
    //blue circle for clicked location
    currentLocationCircle = L.circle([latitude, longitude], {
      color: "blue",
      fillColor: "#03f",
      fillOpacity: 0.5,
      radius: 10,
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
  document.getElementById("latitude").textContent = latitude;
  document.getElementById("longitude").textContent = longitude; //lon.toFixed(2)//to fixed reduces to 2 degrees of accuracy after decimal point

  if (firstTimeLiveLocation) {
    //red circle for live location
    liveLocationCircle = L.circle([latitude, longitude], {
      color: "red",
      fillColor: "#f03",
      fillOpacity: 0.5,
      radius: radius,
    }).addTo(theMap);

    firstTimeLiveLocation = false;
  } else {
    liveLocationCircle.setLatLng([latitude, longitude]); //if it's already been created, then just update position and don't recentre the view...
  }

  L.marker(e.latlng)
    .addTo(theMap)
    .bindPopup("You are within " + radius + " metres of this point")
    .openPopup();
}

function onLocationError(e) {
  displayGeolocationError();
  alert(e.message);
  return false;
}

function findWhereIAm() {
  theMap.locate({
    setView: true,
    maxZoom: 16,
  });
}

function addMapWithTilesAndGeolocateButton() {
  theMap = L.map("theMap").fitWorld(); //show the whole world before we get a geolocation...

  const attribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const tiles = L.tileLayer(tileUrl, {
    attribution,
  });
  tiles.addTo(theMap);

  // NOTE: layer for all map markers created here, makes removal on refresh of the map much easier...see https://stackoverflow.com/questions/24318862/removing-all-data-markers-in-leaflet-map-before-calling-another-json
  waypointMarkersLayer = new L.LayerGroup();
  // NOTE: We add the markersLayer to the map here. This way, the layer is only added once.
  waypointMarkersLayer.addTo(theMap);

  //add the relevant interaction events to the map
  theMap.on("click", onMapClick);
  theMap.on("locationfound", onLocationFound);
  theMap.on("locationerror", onLocationError);

  //disable scroll wheel zoom, taken from https://joeyklee.github.io/geosandbox/hello-drawing-tool.html#section7
  theMap.scrollWheelZoom.disable();

  // Below is from https://joeyklee.github.io/geosandbox/hello-drawing-tool.html#section7

  // Initialise the FeatureGroup to store editable layers
  drawnItems = new L.FeatureGroup();
  theMap.addLayer(drawnItems);

  // Initialise the draw control and pass it the FeatureGroup of editable layers
  drawControl = new L.Control.Draw({
    edit: {
      featureGroup: drawnItems,
    },
  });
  theMap.addControl(drawControl);

  // and keep the drawn items on the map
  theMap.on("draw:created", function (e) {
    var type = e.layerType,
      layer = e.layer;

    if (type === "marker") {
      layer.bindPopup("A popup!");
    }

    drawnItems.addLayer(layer);
  });

  // when a key is pressed, fire an event
  theMap.on("keypress", function (e) {
    var keyPressed = e.originalEvent.key;
    console.log("the key pressed is: ", keyPressed);

    if (keyPressed == "S") {
      downloadJson(drawnItems, "drawnItems.geojson");
    }
  });

  //add a button to below the map, that allows users to update their live position when they click it
  const root = document.getElementById("geolocation");
  const button = document.createElement("button");
  button.innerHTML = "Press to locate yourself!";
  button.id = "geolocateButton";

  root.appendChild(button);

  button.addEventListener("click", (event) => {
    findWhereIAm();
  });

  //try to geolocate...
  findWhereIAm();
}

// Below is from https://joeyklee.github.io/geosandbox/hello-drawing-tool.html#section7

// function to download items
function downloadJson(item, outputName) {
  var text = JSON.stringify(item.toGeoJSON());
  var blob = new Blob([text], {
    type: "text/plain;charset=utf-8",
  });
  saveAs(blob, outputName);
}

//actually set up the page, the map with geolocate button, the tour, the add waypoint button and the saving button
checkForGeolocation();
addMapWithTilesAndGeolocateButton();
// geoLocate(); //commented out as I'm now using leafletjs geolocation
// displayTour();
// addAddWaypointButton();
// addSaveTourButton();
// setInterval(geoLocate, 1000); //geolocate every 1000 milliseconds / 1  second, an async function, so other things can happen too... // geolocating is now taken care of by the user clicking to geolocate..
