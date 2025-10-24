// Environment configuration
const isDevelopment = import.meta.env.DEV;
const useMock = true; // Mockを有効化

console.log('Environment:', {
  NODE_ENV: import.meta.env.MODE,
  REACT_APP_USE_MOCK: import.meta.env.VITE_USE_MOCK,
  useMock: useMock
});

export { useMock };
export default useMock;
