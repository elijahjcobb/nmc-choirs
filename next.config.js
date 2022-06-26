const withPWA  = require("next-pwa");
module.exports = withPWA({
 //...before
  pwa: {
    dest: "public",
    register: true,
    skipWaiting: true,
  },
  //...after
  reactStrictMode: true
});