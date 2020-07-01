'use strict'
const svgCaptcha = require('svg-captcha')
const BaseController = require('./base')
const fse = require('fs-extra')
const path = require('path')

class UserController extends BaseController {
  async captcha() {
    const captcha = svgCaptcha.create({
      size: 4,
      fontSize: 50,
      width: 100,
      height: 40,
      noise: 3,
    })

    this.ctx.session.captcha = captcha.text

    this.ctx.response.type = 'image/svg+xml'

    this.ctx.body = captcha.data
  }
  async mergefile() {
    const { ext, size, hash } = this.ctx.request.body
    const filePath = path.resolve(this.config.UPLOAD_DIR, `${hash}.${ext}`)
    await this.ctx.service.tools.mergeFile(filePath, hash, size)
    this.success({
      url: this.config.downloadDomainName + `/${hash}.${ext}`,
    })
  }

  async uploadfile() {
    // 报错
    // if (Math.random() > 0.3) {
    //   return this.ctx.status = 500
    // }
    // public/hash文件夹/hash+index
    const { ctx } = this
    const { name, hash } = ctx.request.body

    // 上传的文件为空 直接回上传成功
    if (!name) {
      return this.message('切片上传成功')
    }
    const file = ctx.request.files[0]

    const chunkPath = path.resolve(this.config.UPLOAD_DIR, hash)

    // 目录是否存在
    if (!fse.existsSync(chunkPath)) {
      await fse.mkdir(chunkPath)
    }
    // 文件是否存在
    if (!fse.pathExistsSync(`${chunkPath}/${name}`)) {
      await fse.move(file.filepath, `${chunkPath}/${name}`)
    }

    this.message('切片上传成功')

  }
  // .DS_Strore 过滤隐藏文件
  async getUploadList(dirPath) {
    return fse.existsSync(dirPath)
      ? (await fse.readdir(dirPath)).filter(name => name[0] !== '.')
      : []
  }

  async checkfile() {
    const { ctx } = this
    const { ext, hash } = ctx.request.body
    const filePath = path.resolve(this.config.UPLOAD_DIR, `${hash}.${ext}`)
    let uploaded = false
    let uploadList = []
    if (fse.existsSync(filePath)) {
      // 文件存在
      uploaded = true
    } else {
      uploadList = await this.getUploadList(path.resolve(this.config.UPLOAD_DIR, hash))
    }

    this.success({
      uploaded,
      uploadList,
      url: this.config.downloadDomainName + `/${hash}.${ext}`,
    })
  }

  async sumupload() {
    const { ctx } = this

    const file = ctx.request.files[0]

    const filePath = path.resolve(this.config.UPLOAD_DIR, `${file.filename}`) // 文件最终存储的位置

    // if (!fse.existsSync(filePath)) {
    //   await fse.mkdir(filePath)
    // }

    // console.log(111, filePath, filePath)
    // console.log(111, filePath, fse.ensureFileSync(filePath))
    if (!fse.pathExistsSync(filePath)) {
      await fse.move(file.filepath, `${this.config.UPLOAD_DIR}/${file.filename}`)
    }

    this.success({
      url: this.config.downloadDomainName + `/${file.filename}`,
    })
  }

  async sendcode() {
    const { ctx } = this
    const email = ctx.query.email
    const code = Math.random().toString().slice(2, 6)
    console.log(email, code)
    ctx.session.emailcode = code

    const subject = '[小站验证码]'
    const text = ''
    const html = `<h2>验证码为</h2><br /><a href="http://baidu.com"><span>${code}</span></a>`

    const hasSend = await this.service.tools.sendMail(email, subject, text, html)
    if (hasSend) {
      this.message('发送成功')
    } else {
      this.error('发送失败')
    }
  }
}

module.exports = UserController
