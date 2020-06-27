'use strict'

const md5 = require('md5')
const jwt = require('jsonwebtoken')
const BaseController = require('./base')

const HashSalt = 'GGGuoyanGGG'
const createRule = {
  email: { type: 'email' },
  nickname: { type: 'string' },
  password: { type: 'string' },
  captcha: { type: 'string' },
}

class UserController extends BaseController {
  async login() {
    const { app, ctx } = this
    const { email, password, captcha, emailcode } = ctx.request.body
    if (captcha.toUpperCase() !== ctx.session.captcha.toUpperCase()) {
      return this.error('验证码错误')
    }
    if (emailcode !== ctx.session.emailcode) {
      return this.error('邮箱验证码错误')
    }

    const user = await ctx.model.User.findOne({
      email,
      password: md5(password + HashSalt),
    })
    if (!user) {
      return this.error('用户名密码错误')
    }
    // 用户的信息加密成token 返回
    const token = jwt.sign({
      _id: user._id,
      email,
    }, app.config.jwt.secret, {
      expiresIn: '24h',
    })

    this.success({ token, email, nickname: user.nickname })
  }

  async register() {
    const { ctx } = this
    try {
      ctx.validate(createRule)
    } catch (e) {
      return this.error('参数效验失败', -1, e.errors)
    }

    const { email, password, captcha, nickname } = ctx.request.body

    if (captcha.toUpperCase() !== ctx.session.captcha.toUpperCase()) {
      return this.error('验证码错误')
    }
    // 邮箱是不是重复了
    if (await this.checkEmail(email)) {
      this.error('邮箱重复啦')
    } else {
      const ret = await ctx.model.User.create({
        email,
        nickname,
        password: md5(password + HashSalt),
      })

      if (ret._id) {
        this.message('注册成功')
      }
    }
    // this.success({ name: 'kkb' })
  }

  async checkEmail(email) {
    console.log(124, email)
    const ret = await this.ctx.model.User.findOne({ email })
    console.log('ret', ret)
    return ret
  }

  async verify() {
    // 效验用户名是否存在
  }

  async info() {
    const { ctx } = this
    // 从token中取邮箱
    // 有的接口需要从token中取，有些不需要
    const { email } = ctx.state
    const user = await this.checkEmail(email)
    console.log(1231231)
    this.success(user)
  }
}

module.exports = UserController
