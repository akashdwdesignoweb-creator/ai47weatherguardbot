import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface WeatherData {
  temp: number;
  feelsLike: number;
  description: string;
  humidity: number;
  windSpeed: number;
  city: string;
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  constructor(private configService: ConfigService) {}

  async getWeather(location: string): Promise<WeatherData> {
    const apiKey = this.configService.get<string>('OPENWEATHER_API_KEY');

    // If OpenWeatherMap API key is provided, use it
    if (apiKey && apiKey.trim() !== '' && !apiKey.includes('YOUR_OPENWEATHER_API_KEY')) {
      try {
        return await this.getOpenWeatherMap(location, apiKey);
      } catch (err) {
        this.logger.error(`OpenWeatherMap failed for "${location}". Trying Open-Meteo...`, err);
      }
    }

    // Default to Open-Meteo (Zero Key required - Live Weather)
    try {
      return await this.getOpenMeteo(location);
    } catch (err) {
      this.logger.error(`Open-Meteo failed for "${location}". Falling back to simulated weather.`, err);
      return this.generateSimulatedWeather(location);
    }
  }

  private async getOpenMeteo(location: string): Promise<WeatherData> {
    // 1. Geocode city name to lat/lon coordinates
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
    const geoRes = await fetch(geoUrl);
    
    if (!geoRes.ok) {
      throw new Error(`Geocoding API returned status: ${geoRes.status}`);
    }

    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) {
      throw new Error(`Location "${location}" not found by Geocoding API`);
    }

    const { latitude, longitude, name } = geoData.results[0];

    // 2. Fetch current weather from Open-Meteo Forecast API
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`;
    const weatherRes = await fetch(weatherUrl);

    if (!weatherRes.ok) {
      throw new Error(`Open-Meteo weather API returned status: ${weatherRes.status}`);
    }

    const weatherData = await weatherRes.json();
    const current = weatherData.current;

    return {
      temp: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.temperature_2m - 0.5), // Estimate feels like
      description: this.mapWmoCode(current.weather_code),
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      city: name,
    };
  }

  private async getOpenWeatherMap(location: string, apiKey: string): Promise<WeatherData> {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`OpenWeatherMap returned status: ${response.status}`);
    }

    const data = await response.json();
    return {
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      description: data.weather[0]?.description || 'clear sky',
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      city: data.name,
    };
  }

  private mapWmoCode(code: number): string {
    switch (code) {
      case 0: return 'clear sky';
      case 1: return 'mainly clear';
      case 2: return 'partly cloudy';
      case 3: return 'overcast';
      case 45: case 48: return 'foggy';
      case 51: case 53: case 55: return 'drizzle';
      case 61: case 63: case 65: return 'rainy';
      case 71: case 73: case 75: return 'snowy';
      case 80: case 81: case 82: return 'rain showers';
      case 95: case 96: case 99: return 'thunderstorm';
      default: return 'clear sky';
    }
  }

  private generateSimulatedWeather(location: string): WeatherData {
    const conditions = ['clear sky', 'scattered clouds', 'broken clouds', 'light rain', 'moderate rain', 'thunderstorm', 'mist'];
    const idx = Math.abs(location.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % conditions.length;
    const temp = 15 + (idx * 3) - (Math.random() * 4);
    
    return {
      temp: Math.round(temp),
      feelsLike: Math.round(temp - 1),
      description: conditions[idx],
      humidity: 50 + (idx * 5),
      windSpeed: 2.5 + idx,
      city: location,
    };
  }
}
