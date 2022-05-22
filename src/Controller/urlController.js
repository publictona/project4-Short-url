//Importing redis & shortid packages
const shortid = require('shortid')
const redis = require("redis");

const { promisify } = require("util");

//Importing the urlModel
const URLModel = require("../Models/urlModel")

//Connect to redis
const redisClient = redis.createClient(
    11661,
    "redis-11661.c264.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("iMjFghO9YxeFGXEXtQKj9a28slHgzQ7j", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);


//Creating a validation function
const isValid = function (value) {
    if (typeof (value) === undefined || typeof (value) === null) {
        return false
    }
    if (typeof (value) === "string" && (value).trim().length > 0) {
        return true
    }
}

// =================Creating post api for Urlshorten function=================================================================================//


const URLshorten = async (req, res) => {
    try {
        const baseUrl = 'http://localhost:3000'
        const data = req.body
        const { longUrl } = data
        if (Object.keys(data) == 0) {
            return res.status(400).send({ status: false, message: "Please provide Long URL" })
        }

        if (!isValid(longUrl)) {
            return res.status(400).send({ status: false, message: "Please provide  the value of long URL" })
        }

        //Checking if user entered a valid URL or not

        const validUrl = /^(http(s)?:\/\/)[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/
        if (!validUrl.test(longUrl)) {
            return res.status(400).send({ status: false, message: "Please enter  valid format longUrl" })
        }

        const urlShortGenerated = shortid.generate()
        const urlCode = urlShortGenerated.trim().toLowerCase()

        let url = await URLModel.findOne({ longUrl }).select({ longUrl: 1, shortUrl: 1, urlCode: 1, _id: 0 })

        if (url) {
            res.status(200).send({ status: true, data: url })
        }

        else {
            const shortUrl = baseUrl + '/' + urlCode

            data['shortUrl'] = shortUrl
            data['urlCode'] = urlCode

            const urlData = await URLModel.create(data)
            await SET_ASYNC(`${urlData}`, JSON.stringify(urlData))
            return res.status(201).send({ status: true, data: urlData })
        }
    }
    catch (error) {
        console.log(error)
        res.status(500).send({ status: false, message: error.message })
    }
}

//==========================##Get api Redirection==============================================================================================//


const redirection = async (req, res) => {
    try {

        const { urlCode } = req.params
        let validUrl = shortid.isValid(urlCode)
        if (!validUrl) {

            return res.status(400).send({ status: false, msg: 'please provide valid urlcode' })
        }
        let cahcedUrlData = await GET_ASYNC(`${urlCode}`)
        let data = JSON.parse(cahcedUrlData)

        if (cahcedUrlData) {
            res.status(302).redirect(data.longUrl)
        }

        else {
            const url = await URLModel.findOne({ urlCode: urlCode })

            if (!url) {
                return res.status(404).send({ status: false, message: "No URL with this code found" })
            }
            else {
                return res.status(302).redirect(url.longUrl)
            }
        }
    }
    catch (error) {
        console.log(error)
        res.status(500).send({ status: false, message: error.message })
    }
}

//************************************************************EXPORTING****************************************************************************************************/

module.exports = { URLshorten, redirection }


