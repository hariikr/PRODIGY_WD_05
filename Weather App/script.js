const API_KEY = '10d57ff4b24db383baa81294cefefe68';
let currentUnit = 'C';
let currentWeatherData = null;

async function getWeather(lat = null, lon = null) {
    const locationInput = document.getElementById('location-input');
    const weatherInfo = document.getElementById('weather-info');
    const forecast = document.getElementById('forecast');
    const errorMessage = document.getElementById('error-message');
    const lastUpdated = document.getElementById('last-updated');
    const location = locationInput.value;

    let url;
    if (lat && lon) {
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
    } else if (!location) {
        errorMessage.textContent = 'Please enter a location';
        weatherInfo.innerHTML = '';
        forecast.innerHTML = '';
        return;
    } else {
        url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=metric&appid=${API_KEY}`;
    }

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Weather data not found');
    
        }

        const data = await response.json();
        currentWeatherData = data;

        updateWeatherDisplay();
        getForecast(data.coord.lat, data.coord.lon);

        lastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
        updateBackground(data.weather[0].main);

    } catch (error) {
        weatherInfo.innerHTML = '';
        weatherInfo.classList.remove('visible');
        forecast.innerHTML = '';
        errorMessage.textContent = error.message;
    }
}

function updateWeatherDisplay() {
    const weatherInfo = document.getElementById('weather-info');
    const data = currentWeatherData;

    const weatherIcon = getWeatherIcon(data.weather[0].icon);
    const temperature = currentUnit === 'C' ? Math.round(data.main.temp) : Math.round((data.main.temp * 9/5) + 32);
    
    weatherInfo.innerHTML = `
        <div class="weather-icon">${weatherIcon}</div>
        <div class="temperature">${temperature}°${currentUnit}</div>
        <div class="description">${data.weather[0].description}</div>
        <div class="location">${data.name}, ${data.sys.country}</div>
        <div class="details">
            <div class="detail-item">
                <span class="detail-label">Humidity</span>
                <span class="detail-value">${data.main.humidity}%</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Wind</span>
                <span class="detail-value">${data.wind.speed} m/s</span>
            </div>
        </div>
    `;
    weatherInfo.classList.add('visible');
}

async function getForecast(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Forecast data not found');
        
        const data = await response.json();
        updateForecastDisplay(data.list);
    } catch (error) {
        console.error('Error fetching forecast:', error);
    }
}

function updateForecastDisplay(forecastData) {
    const forecast = document.getElementById('forecast');
    forecast.innerHTML = '';

    const dailyData = forecastData.filter((item, index) => index % 8 === 0).slice(1, 6);

    dailyData.forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const icon = getWeatherIcon(day.weather[0].icon);
        const temp = currentUnit === 'C' ? Math.round(day.main.temp) : Math.round((day.main.temp * 9/5) + 32);

        forecast.innerHTML += `
            <div class="forecast-item">
                <div class="forecast-day">${dayName}</div>
                <div class="forecast-icon">${icon}</div>
                <div class="forecast-temp">${temp}°${currentUnit}</div>
            </div>
        `;
    });
}

function toggleUnit(unit) {
    if (currentUnit !== unit) {
        currentUnit = unit;
        document.getElementById('celsius').classList.toggle('active');
        document.getElementById('fahrenheit').classList.toggle('active');
        if (currentWeatherData) {
            updateWeatherDisplay();
            getForecast(currentWeatherData.coord.lat, currentWeatherData.coord.lon);
        }
    }
}

function getLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => getWeather(position.coords.latitude, position.coords.longitude),
            error => console.error('Error getting location:', error)
        );
    } else {
        console.error('Geolocation is not supported by this browser.');
    }
}

function updateBackground(weatherCondition) {
    const body = document.body;
    const timeOfDay = new Date().getHours() > 6 && new Date().getHours() < 20 ? 'day' : 'night';
    let backgroundColor;

    switch(weatherCondition.toLowerCase()) {
        case 'clear':
            backgroundColor = timeOfDay === 'day' ? '#1a4f7a' : '#0c2135';
            break;
        case 'clouds':
            backgroundColor = '#2c3e50';
            break;
        case 'rain':
        case 'drizzle':
            backgroundColor = '#34495e';
            break;
        case 'thunderstorm':
            backgroundColor = '#2c3e50';
            break;
        case 'snow':
            backgroundColor = '#34495e';
            break;
        default:
            backgroundColor = '#1a1a2e';
    }

    body.style.background = backgroundColor;
}

function getWeatherIcon(iconCode) {
    const iconMap = {
        '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '☁️',
        '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️',
        '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️',
        '11d': '⛈️', '11n': '⛈️', '13d': '❄️', '13n': '❄️',
        '50d': '🌫️', '50n': '🌫️'
    };
    return iconMap[iconCode] || '🌡️';
}