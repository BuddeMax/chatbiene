module.exports = {
  devServer: {
    https: true, // Aktiviert HTTPS für den Entwicklungsserver
    allowedHosts: "all", // Erlaubt alle Hosts für Entwicklungszwecke
    proxy: {
      '/socket.io': {
        target: 'https://localhost:3000', // Ziel-URL für WebSocket-Proxy
        ws: true, // WebSocket-Anfragen werden weitergeleitet
        changeOrigin: true, // Setzt den Origin-Header des Proxys
        secure: false, // Für Entwicklungszwecke bei selbstsignierten Zertifikaten
      },
      '/sockjs-node': {
        target: 'https://localhost:3000', // Ziel-URL für SockJS-Proxy
        ws: false, // Kein WebSocket-Proxy, sondern HTTP-Proxy
        changeOrigin: true, // Setzt den Origin-Header des Proxys
        secure: false, // Für Entwicklungszwecke bei selbstsignierten Zertifikaten
      },
      '/api': {
        target: 'https://localhost:3000', // Ziel-URL für API-Proxy
        changeOrigin: true, // Setzt den Origin-Header des Proxys
        secure: false, // Für Entwicklungszwecke bei selbstsignierten Zertifikaten
      },
    },
  },
};
