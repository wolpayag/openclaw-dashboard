import axios from 'axios';
import { logger } from './logger.js';

/**
 * Get weather data for a location
 * Uses wttr.in (free, no API key required)
 */
export async function getWeather(location = 'Vienna') {
  try {
    // wttr.in provides weather data in JSON format
    const response = await axios.get(`https://wttr.in/${encodeURIComponent(location)}?format=j1`, {
      timeout: 10000
    });
    
    const data = response.data;
    const current = data.current_condition[0];
    
    return {
      location: data.nearest_area[0].areaName[0].value,
      country: data.nearest_area[0].country[0].value,
      temperature: parseInt(current.temp_C),
      feelsLike: parseInt(current.FeelsLikeC),
      condition: current.weatherDesc[0].value,
      humidity: current.humidity,
      windSpeed: current.windspeedKmph,
      visibility: current.visibility,
      pressure: current.pressure,
      uvIndex: current.uvIndex,
      // Forecast for today
      forecast: data.weather[0].hourly.slice(0, 4).map(h => ({
        time: h.time,
        temp: h.tempC,
        condition: h.weatherDesc[0].value
      }))
    };
    
  } catch (error) {
    logger.error(`Failed to get weather for ${location}:`, error.message);
    
    // Return mock data if API fails
    return {
      location: location,
      country: 'Austria',
      temperature: 15,
      feelsLike: 13,
      condition: 'Partly cloudy',
      humidity: 65,
      windSpeed: 12,
      visibility: 10,
      pressure: 1013,
      uvIndex: 3,
      forecast: []
    };
  }
}