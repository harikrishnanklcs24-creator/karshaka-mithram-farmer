import { useState } from "react";
import { Search, MapPin, CloudRain, Sun, Wind, Droplets, Thermometer, Calendar } from "lucide-react";
import { toast } from "sonner";

const API_KEY = "5d7a43e894886aeb84d6a938606395b2";

const AdminWeather = () => {
    const [city, setCity] = useState("");
    const [currentWeather, setCurrentWeather] = useState<any>(null);
    const [forecast, setForecast] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchWeather = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!city.trim()) return;

        setLoading(true);
        try {
            // Fetch Current Weather
            const currentRes = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
            );

            if (!currentRes.ok) throw new Error("City not found");
            const currentData = await currentRes.json();
            setCurrentWeather(currentData);

            // Fetch 5-day Forecast
            const forecastRes = await fetch(
                `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`
            );
            const forecastData = await forecastRes.json();

            // Filter to get one reading per day (around noon)
            const dailyForecast = forecastData.list.filter((reading: any) =>
                reading.dt_txt.includes("12:00:00")
            ).slice(0, 5);

            setForecast(dailyForecast);
            toast.success(`Weather fetched for ${currentData.name}`);
        } catch (error) {
            toast.error("Failed to fetch weather data. Please check the city name.");
            setCurrentWeather(null);
            setForecast([]);
        } finally {
            setLoading(false);
        }
    };

    const getAdvice = (main: string, temp: number) => {
        if (main === "Rain") return "Heavy rain expected. Ensure drainage channels are clear. Delay spraying pesticides.";
        if (main === "Clear" && temp > 30) return "High temperature. Increase irrigation frequency for sensitive crops.";
        if (main === "Clouds") return "Moderate conditions. Good for general field work.";
        return "Monitor local conditions closely.";
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Weather Prediction</h1>
                    <p className="text-slate-500 mt-1">Check forecasts for any location</p>
                </div>
            </div>

            {/* Search Section */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <form onSubmit={fetchWeather} className="flex gap-4">
                    <div className="relative flex-1">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Enter city or district name..."
                            className="w-full pl-12 h-14 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-primary text-white px-8 h-14 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50"
                    >
                        {loading ? "Searching..." : <><Search className="h-5 w-5" /> Search</>}
                    </button>
                </form>
            </div>

            {currentWeather && (
                <div className="space-y-8 animate-slide-up">
                    {/* Current Weather Card */}
                    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                            <div className="text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-2 text-blue-200 font-bold mb-2">
                                    <MapPin className="h-5 w-5" />
                                    {currentWeather.name}, {currentWeather.sys.country}
                                </div>
                                <h2 className="text-7xl font-black mb-4">{Math.round(currentWeather.main.temp)}°</h2>
                                <p className="text-2xl font-medium opacity-90 capitalize">{currentWeather.weather[0].description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 w-32">
                                    <Wind className="h-5 w-5 text-blue-200 mb-2" />
                                    <p className="text-xs text-blue-200">Wind</p>
                                    <p className="font-bold text-lg">{currentWeather.wind.speed} km/h</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 w-32">
                                    <Droplets className="h-5 w-5 text-blue-200 mb-2" />
                                    <p className="text-xs text-blue-200">Humidity</p>
                                    <p className="font-bold text-lg">{currentWeather.main.humidity}%</p>
                                </div>
                            </div>
                        </div>
                        <CloudRain className="absolute -right-10 -bottom-10 h-64 w-64 text-white opacity-10" />
                    </div>

                    {/* AI Advisory */}
                    <div className="bg-emerald-50 rounded-[2rem] p-6 border border-emerald-100 flex items-start gap-4">
                        <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                            <Sun className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-emerald-800 text-lg mb-1">Agricultural Advisory</h3>
                            <p className="text-emerald-700">
                                {getAdvice(currentWeather.weather[0].main, currentWeather.main.temp)}
                            </p>
                        </div>
                    </div>

                    {/* 5-Day Forecast Grid */}
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-slate-400" />
                            5-Day Forecast
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            {forecast.map((day) => (
                                <div key={day.dt} className="bg-white p-4 rounded-2xl border border-slate-100 text-center hover:border-blue-200 transition-all group">
                                    <p className="text-sm font-bold text-slate-500 mb-2">
                                        {new Date(day.dt * 1000).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                                    </p>
                                    <div className="h-10 w-10 mx-auto my-2 bg-blue-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                        {day.weather[0].main === "Rain" ? (
                                            <CloudRain className="h-5 w-5 text-blue-600" />
                                        ) : day.weather[0].main === "Clouds" ? (
                                            <Wind className="h-5 w-5 text-slate-500" />
                                        ) : (
                                            <Sun className="h-5 w-5 text-orange-500" />
                                        )}
                                    </div>
                                    <p className="text-2xl font-black text-slate-800">{Math.round(day.main.temp)}°</p>
                                    <p className="text-xs text-slate-400 mt-1 capitalize">{day.weather[0].main}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminWeather;
