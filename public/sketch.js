let lat, lon, theMap;

function geoLocate() {
  // Geolocates the user's browser
  if ('geolocation' in navigator) {
    console.log('geolocation available');
    navigator.geolocation.getCurrentPosition(async position => {
      try {
        let informationTag = document.getElementById("geolocation");
        informationTag.innerHTML = `Your location is: Latitude: <span id="latitude"></span>&deg;, Longitude:
        <span id="longitude"></span>&deg;.`;

        lat = position.coords.latitude;
        lon = position.coords.longitude;
        document.getElementById('latitude').textContent = lat.toFixed(2);
        document.getElementById('longitude').textContent = lon.toFixed(2);

        theMap = L.map('theMap').setView([lat, lon], 15);
        const attribution =
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
        const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        const tiles = L.tileLayer(tileUrl, {
          attribution
        });
        tiles.addTo(theMap);
        const marker = L.marker([lat, lon]).addTo(theMap);

        //add the button to submit this information to the database, this is safe as know geolocation is available
        addButton();
        displayPreviousLocations();
      } catch (error) {
        console.error(error);;
      }
    });
  } else {
    console.log('geolocation not available');
    let informationTag = document.getElementById("geolocation");
    informationTag.innerHTML = `Geolocation not available, do you have location services enabled? <a href='https://support.apple.com/en-gb/HT207092'>Help for Apple iOS devices</a> / <a href='https://support.google.com/accounts/answer/3467281?hl=en'>Help for Google Android devices</a>.`
  }
}

function addButton() {
  //adds a button to the DOM, IFF geolocation is available

  const root = document.createElement('p');
  const button = document.createElement("button");
  button.innerHTML = "Add my current location";
  root.append(button);

  const geolocationDIV = document.getElementById("geolocation");
  geolocationDIV.append(root);

  button.addEventListener('click', async event => {
    const data = {
      lat,
      lon
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
  });
}

async function displayPreviousLocations() {
  const response = await fetch('/api');
  const data = await response.json();
  const previousLocations = document.getElementById("previousLocations");

  const descriptionElement = document.createElement('p');
  descriptionElement.innerHTML = "Previously added locations:";
  previousLocations.append(descriptionElement);

  const listOfPreviousLocations = document.createElement('ol');
  previousLocations.append(listOfPreviousLocations);

  for (item of data) {
    const root = document.createElement('li');
    const geo = document.createElement('div');
    const date = document.createElement('div');

    geo.textContent = `${item.lat}°, ${item.lon}°`;
    const dateString = new Date(item.timestamp).toLocaleString();
    date.textContent = dateString;

    root.append(geo, date);
    listOfPreviousLocations.append(root);

    const marker = L.marker([item.lat, item.lon]).addTo(theMap);
  }
}

geoLocate();