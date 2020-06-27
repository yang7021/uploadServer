'use strict'

const { Service } = require('egg')
const path = require('path')
const nodemailer = require('nodemailer')
const fse = require('fs-extra')

const userEmail = '1097085674@qq.com'
const transporter = nodemailer.createTransport({
  service: 'QQ',
  secureConnection: true,
  auth: {
    user: userEmail,
    // pass: '1097085674gy',
    // pass: '...raise182',
    pass: 'doidvwtasabzbaeb',
  },
})

class ToolService extends Service {
  async mergeFile(filePath, fielHash, size) {
    // 块的目录
    const chunkDir = path.resolve(this.config.UPLOAD_DIR, fielHash)

    // 从目录读取所有块的路径
    let chunksPath = await fse.readdir(chunkDir)
    // 排序
    chunksPath.sort((a, b) => a.split('-')[1] - b.split('-')[1])
    // 所有块的地址
    chunksPath = chunksPath.map(cp => path.resolve(chunkDir, cp))

    await this.mergeChunks(chunksPath, filePath, size)
  }

  async mergeChunks(files, dest, size) {

    const pipStream = (filePath, writableStream) => new Promise(resolve => {
      // 创建一个可读流
      const readStream = fse.createReadStream(filePath)
      readStream.on('end', () => {
        // 区块读完 删除区块
        fse.unlinkSync(filePath)
        resolve(1)
      })

      // 可读流 => 可写流
      readStream.pipe(writableStream)
    })

    const message = await Promise.all(
      files.map((file, index) => pipStream(file, fse.createWriteStream(dest, {
        start: index * size,
        end: (index + 1) * size,
      })))
    )
    // 处理异常
    // 文件合并完 删除目录
    console.log(58, message)
  }

  async sendMail(email, subject, text, html) {
    const mailOptions = {
      from: userEmail,
      cc: userEmail,
      to: email,
      subject,
      text,
      html,
    }
    try {
      await transporter.sendMail(mailOptions)
      return true
    } catch (e) {
      console.log('email error', e)
      return false
    }
  }
}

module.exports = ToolService
