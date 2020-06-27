'use strict'

// 解析token的中间件，也可以用egg-jwt,

// const jwt = require('jsonwebtoken')

// eslint-disable-next-line no-unused-vars
module.exports = ({ app }) => {
  return async function verify(ctx, next) {

    await next()
    return
    // if (!ctx.request.header.authorization) {
    //   ctx.body = {
    //     code: -1,
    //     message: '用户没有登录',
    //   }
    //   return
    // }

    // const token = ctx.request.header.authorization.replace('Bearer ', '')
    // try {
    //   const ret = await jwt.verify(token, app.config.jwt.secret)
    //   console.log('ret=>', ret)
    //   ctx.state.email = ret.email
    //   ctx.state.userid = ret.email
    //   await next()
    // } catch (e) {
    //   if (e.name === 'TokenExpiredError') {
    //     ctx.body = {
    //       code: -666,
    //       message: '登录过期',
    //     }
    //   } else {
    //     ctx.body = {
    //       code: -1,
    //       message: '用户信息出错',
    //     }
    //   }
    // }
  }
}
