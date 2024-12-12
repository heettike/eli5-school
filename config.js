// config.js
const config = {
    API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3003'
        : 'https://eli5-api.onrender.com'  // Your Render backend URL
};

export default config;