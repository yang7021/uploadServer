/* eslint valid-jsdoc: "off" */

'use strict'

const path = require('path')

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {}

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1590986919752_2445'

  config.multipart = {
    mode: 'file',
    whitelist: () => true,
    fileSize: 100 * 1024 * 1024,
  }
  config.UPLOAD_DIR = path.resolve(__dirname, '..', 'app/public/files')

  // add your middleware config here
  config.middleware = []

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
    downloadDomainName: 'http://182.92.109.46:7001/public/files',
  }

  config.cors = {
    // origin: '*', // 允许所有跨域访问，注释掉则允许 白名单 访问
    credentials: true, // 允许跨域请求携带cookies
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH',
  }

  return {
    ...config,
    ...userConfig,
    security: {
      csrf: {
        enable: false, // 前后端分离，post请求不方便携带_csrf
        ignoreJSON: true,
      },
      domainWhiteList: [ 'http://localhost:8080', 'http://127.0.0.1:8080' ], // 配置白名单
    },
    mongoose: {
      url: 'mongodb://upload:upload456234%40%40!!%23%24%40@182.92.109.46:27017/?authSource=upload',
      option: {},
    },
    jwt: {
      secret: '!kakkkk123!@!@!@;',
    },
  }
}
