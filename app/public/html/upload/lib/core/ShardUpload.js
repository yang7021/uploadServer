'use strict';

import '../helpers/spark-md5.min.js'

function ShardUpload(data) {
  this.config = data.config
  this.chunks = []
  this.methods = data.methods || {}
}

// 文件分片
ShardUpload.prototype.createFileChunk = function (file, size = this.config.CHUNK_SIZE) {
  const chunks = []
  let cur = 0
  while (cur < file.size) {
    chunks.push({
      index: cur,
      file: file.slice(cur, cur + size),
    })
    cur += size
  }
  this.chunks = chunks
  this.methods['chunkAfter'] && this.methods['chunkAfter'].call(this)
  return this
}


// 抽样计算hash
ShardUpload.prototype.calculateHashSample = function () {
  // 布隆过滤器，判断一个数据存在与否
  // 1个G的文件，抽样后5M以内
  // hash一样，文件不一定一样
  return new Promise(resolve => {
    const spark = new SparkMD5.ArrayBuffer()
    const reader = new FileReader()

    const file = this.file
    const size = file.size
    const offset = 2 * 1024 * 1024
    // 第一个2M 最后一个区块数据全要
    // 中间的，取前后中各2个字节
    let chunks = [file.slice(0, offset)]

    let cur = offset

    while (cur < size) {
      if (cur + offset >= size) {
        // chunks.push(file.slice(cur, cur + offset))
        chunks.push(file)
      } else {
        // 区块中间
        const mid = cur + offset / 2
        // 区块最后
        const end = cur + offset
        chunks.push(file.slice(cur, cur + 2))
        chunks.push(file.slice(mid, mid + 2))
        chunks.push(file.slice(end - 2, end))
      }
      cur += offset
    }
    // 中间的， 取前中后各2个字节
    reader.readAsArrayBuffer(new Blob(chunks))
    reader.onload = e => {
      spark.append(e.target.result)
      this.hashProgress = 100
      resolve(spark.end())
    }
  })
}

// 1.上传文件
ShardUpload.prototype.uploadFile = async function (file, fn) {
  console.log(this)
  // return new Promise(async resolve => {
    if (file) {
      this.file = file
    }
    // 分片
    this.createFileChunk(file)
  
    // 计算hash
    const hash = await this.calculateHashSample()
    // console.log('抽样计算', hash)
    this.hash = hash
  
  
    // 问一下后端，文件是否上传过，如果没有，是否有存在的切片
    // {
    //   data: {
    //     uploaded: Boolean,
    //     uploadList: [区块名]
    //   }
    // }
    let data = await this.config.ajax.post(this.config.checkfile, {
      hash,
      ext: this.file.name.split('.').pop()
    })
    // 让使用者判断是否继续
      fn.call(this, data, async uploadList => {
      if(!(toString.call(uploadList) === '[object Array]')){
        throw new Error('uploadList必须是数组')
      }
      this.chunks = this.chunks.map((chunk, index) => {
        // 切片的名字 hash + index
        const name = hash + '-' + index
        return {
          hash,
          name,
          index,
          chunk: chunk.file,
          // 设置进度条，已经上传的设为100
          // progress: uploadList.indexOf(name) > 0 ? 100 : 0,
          progress: uploadList.indexOf(name) > -1 ? 100 : 0
        }
      })
      return await this.uploadChunks(uploadList)
    })
    
    // resolve({
    //   data,
    //   next: async uploadList => {
    //     this.chunks = this.chunks.map((chunk, index) => {
    //       // 切片的名字 hash + index
    //       const name = hash + '-' + index
    //       return {
    //         hash,
    //         name,
    //         index,
    //         chunk: chunk.file,
    //         // 设置进度条，已经上传的设为100
    //         progress: uploadList.indexOf(name) > -1 ? 100 : 0,
    //       }
    //     })
    //     return await this.uploadChunks(uploadList)
    //   }
    // })
  // })
}

// ShardUpload.prototype.next = async function (uploadList) {
//   this.chunks = this.chunks.map((chunk, index) => {
//     // 切片的名字 hash + index
//     const name = this.hash + '-' + index
//     return {
//       hash: this.hash,
//       name,
//       index,
//       chunk: chunk.file,
//       // 设置进度条，已经上传的设为100
//       progress: uploadList.indexOf(name) > -1 ? 100 : 0,
//     }
//   })
//   return await this.uploadChunks(uploadList)
// }

// 上传区块
ShardUpload.prototype.uploadChunks = async function (uploadList = []) {
  const request = this.chunks
    .filter(chunk => uploadList.indexOf(chunk.name) === -1)
    .map((chunk, index) => {
      // 转成promise
      const form = new FormData()
      form.append('chunk', chunk.chunk)
      form.append('hash', chunk.hash)
      form.append('name', chunk.name)
      return { form, index: chunk.index, error: 0, ext: this.file.name.split('.').pop() }
    })
  // 如果文件只有一个区块且上传但由于网络问题合并请求失败，处理的办法
  await this.sendRequest(request)

  // 合并区块
  return await this.mergeRequest()
}

// 发送区块
ShardUpload.prototype.sendRequest = async function (chunks, limit = 3) {
  // 待上传的区块列表为空发送一个不带参数的上传文件请求
  if(!chunks.length) {
    return await this.config.ajax.post(this.config.uploadfile)
  }
  return new Promise((resolve, reject) => {
    const len = chunks.length
    let count = 0
    let isStop = false
    const start = async () => {
      if (isStop) return
      const task = chunks.shift()
      if (task) {
        const { form, index } = task

        try {
          await this.config.ajax.post(this.config.uploadfile, form, {
            onUploadProgress: progress => {
              // 不是整体的进度条了，而是每个区块有自己的进度条，整体的进度条需要计算
              this.chunks[index].progress = Number(((progress.loaded / progress.total) * 100).toFixed(2))
              this.methods['chunkProgress'] && this.methods['chunkProgress'].call(this, index)
            }
          })
          if (count === len - 1) {
            // 最后一个任务 完成
            resolve()
          } else {
            count++
            // 启动下一个
            start()
          }
        } catch (e) {
          this.chunks[index].progress = -1
          if (task.error < 3) {
            task.error++
            chunks.unshift(task)
            start()
          } else {
            // 错误三次
            isStop = true
            reject()
          }
        }
      }
    }
    while (limit > 0) {
      // 启动limit个任务
      // 模拟一下延迟
      setTimeout(() => {
        start()
      }, Math.random() * 200)
      // start()
      limit -= 1
    }
  })
}

// 合并区块请求
ShardUpload.prototype.mergeRequest = async function () {
  return await this.config.ajax.post(this.config.mergefile, {
    ext: this.file.name.split('.').pop(),
    size: this.config.CHUNK_SIZE,
    hash: this.hash
  })
}

// module.exports = ShardUpload

export default ShardUpload
