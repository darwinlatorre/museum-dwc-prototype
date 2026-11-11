// Destino del servidor CLI, nunca configuración enviada al navegador.
const target = process.env.API_PROXY_TARGET || 'http://localhost:8080';

module.exports = {
  '^/api(?:/|$)': {
    target,
    changeOrigin: true,
    // Alinear Origin con Host evita un cruce de orígenes artificial en Spring.
    headers: { Origin: new URL(target).origin },
  },
};
