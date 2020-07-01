'use strict';

// let ShardUpload = require('../shardUpload')
// let defaults = require('../defaults')

import ShardUpload from './core/ShardUpload.js'
import defaults from './defaults.js'
import utils from './utils.js'

function createInstance(data) {
    const context = new ShardUpload(data)


    let instance = context;

    // utils.extend(instance, data.methods, context);

    // Copy axios.prototype to instance
    utils.extend(instance, ShardUpload.prototype, context);

    // // Copy context to instance
    utils.extend(instance, context);



    return instance;
}

var shardUpload = createInstance(defaults);

shardUpload.create = function create(instanceConfig) {
    return createInstance(Object.assign(defaults, instanceConfig));
  };


// module.exports = shardUpload

export default shardUpload
