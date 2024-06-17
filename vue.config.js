module.exports = {
  devServer: {
    allowedHosts: "all",
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
      '/sockjs-node': {
        target: 'http://localhost:3000',
        ws: false,
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
    },
  },
};
