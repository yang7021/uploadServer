'use strict'

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  // const { router, controller, middleware } = app
  const { router, controller } = app
  // const jwt = middleware.jwt({ app })
  router.get('/', controller.home.index)

  // 验证码
  router.get('/captcha', controller.util.captcha)
  // 发送邮件
  router.get('/sendcode', controller.util.sendcode)
  // 上传文件
  router.post('/uploadfile', controller.util.uploadfile)
  // 合并文件
  router.post('/mergefile', controller.util.mergefile)
  // 查询文件是否上传，是否有切片上传
  router.post('/checkfile', controller.util.checkfile)

  // 普通上传
  router.post('/sumupload', controller.util.sumupload)


  // router.group({ name: 'user', prefix: '/user' }, router => {
  //   const { info, register, login, verify } = controller.user

  //   router.post('/register', register)
  //   router.post('/login', login)

  //   router.get('/info', jwt, info)

  //   router.get('/verify', verify)
  // })
}
