const withTM = require('next-transpile-modules')(['three']);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, {buildId, dev, isServer, defaultLoaders, webpack}) => {
    // Note: we provide webpack above so you should not `require` it
    // Perform customizations to webpack config
    // config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /.*?\.node/ig }))
    if (isServer) {
      config.externals.push({
        '@rapidsai/core': '@rapidsai/core',
        '@rapidsai/cuda': '@rapidsai/cuda',
        '@rapidsai/webgl': '@rapidsai/webgl',
        '@rapidsai/deck.gl': '@rapidsai/deck.gl',
        '@rapidsai/rmm': '@rapidsai/rmm',
        '@rapidsai/cudf': '@rapidsai/cudf',
        'apache-arrow': 'apache-arrow'
      });
    }
    // console.log(require('util').inspect({ isServer, config }, false, Infinity, true));
    // Important: return the modified config
    return config;
  },
}

module.exports = [
  nextConfig,
  withTM()
]
