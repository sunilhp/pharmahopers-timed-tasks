const axios = require('axios')
const SMS_API_URL = require('./../constants').SMS_API_URL

const send = async (mobile, templateId, params) => {
    let param;
    if (Array.isArray(params))
        param = params.join('::')
    else
        param = params

    let url = SMS_API_URL
    url = url.replace('{{template}}', templateId).replace('{{mobile}}', mobile).replace('{{param}}', param)
    try {
        await axios.get(url)
    } catch (e) {
        console.log('error while sending sms: ' + e.message)
    }
}

module.exports = { send }