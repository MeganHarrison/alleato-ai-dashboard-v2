import { MyDataPart } from "@/lib/message-type";

const getWeatherStyles = (weather: string | undefined) => {
  if (!weather) return "from-gray-400 to-gray-600";

  switch (weather.toLowerCase()) {
    case "sunny":
      return "from-yellow-400 to-orange-500";
    case "cloudy":
      return "from-gray-400 to-gray-600";
    case "rainy":
      return "from-blue-600 to-indigo-700";
    case "snowy":
      return "from-blue-200 to-blue-400";
    case "windy":
      return "from-teal-400 to-cyan-600";
    default:
      return "from-blue-400 to-blue-600";
  }
};

const getWeatherEmoji = (weather: string | undefined) => {
  if (!weather) return "⏳";

  switch (weather.toLowerCase()) {
    case "sunny":
      return "☀️";
    case "cloudy":
      return "☁️";
    case "rainy":
      return "🌧️";
    case "snowy":
      return "❄️";
    case "windy":
      return "💨";
    default:
      return "🌤️";
  }
};

const getTextColors = (weather: string | undefined) => {
  if (!weather) return { primary: "text-white", secondary: "text-gray-200" };

  switch (weather.toLowerCase()) {
    case "sunny":
      return { primary: "text-white", secondary: "text-yellow-100" };
    case "cloudy":
      return { primary: "text-white", secondary: "text-gray-200" };
    case "rainy":
      return { primary: "text-white", secondary: "text-blue-100" };
    case "snowy":
      return { primary: "text-gray-800", secondary: "text-gray-600" };
    case "windy":
      return { primary: "text-white", secondary: "text-teal-100" };
    default:
      return { primary: "text-white", secondary: "text-blue-100" };
  }
};

// use MyDataPart so you can update the schema once and it trickles
export const Weather = ({ data }: { data: MyDataPart["weather"] }) => {
  const weatherStyle = getWeatherStyles(data.weather);
  const weatherEmoji = getWeatherEmoji(data.weather);
  const textColors = getTextColors(data.weather);

  // Check if any data is still loading
  const isLoading = data.loading;

  return (
    <div
      className={`bg-gradient-to-br ${weatherStyle} rounded-2xl p-6 shadow-lg w-full transition-all duration-500 ease-in-out ${isLoading ? "animate-pulse" : ""}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${textColors.primary}`}>
            {data.location !== undefined ? data.location : "Loading..."}
          </h3>
          <p className={`text-sm capitalize ${textColors.secondary}`}>
            {data.weather !== undefined ? data.weather : "Loading..."}
          </p>
        </div>
        <div className="text-right flex items-center gap-3">
          <div className="text-2xl">{weatherEmoji}</div>
          <div className={`text-3xl font-light ${textColors.primary}`}>
            {data.temperature !== undefined ? `${data.temperature}°` : "..."}
          </div>
        </div>
      </div>
    </div>
  );
};
