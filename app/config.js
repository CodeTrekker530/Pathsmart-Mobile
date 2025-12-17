// Configuration for API endpoints
// Change based on environment

const ENV = {
  dev: {
    apiUrl: "http://192.168.68.114:5000",
  },
  prod: {
    apiUrl: "https://your-domain.com:5000", // Change this to your production server
  },
};

// Determine environment
const getEnvVars = () => {
  // In development, use local IP
  // In production, use your deployed server
  // You can set __DEV__ or use Expo Constants to detect environment
  return __DEV__ ? ENV.dev : ENV.prod;
};

const Config = getEnvVars();

export default Config;
