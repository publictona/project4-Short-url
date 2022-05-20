const shortid = require("shortid")
const urlModel = require("../models/urlModel")
const validUrl = require('valid-url')
const redis = require("redis");
const { promisify } = require("util");

//Connect to redis
const redisClient = redis.createClient(
    13190,
    "redis-13190.c301.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("gkiOIPkytPI3ADi14jHMSWkZEo2J5TDG", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

// creatation of URL
const createUrl = async function (req, res) {
    try {
        const { longUrl } = req.body;
        const baseUrl = "http://localhost:3000";
        //===================================================Url validation==============================================================================================================
       
        const validUrls = (value) => {
            if (!(/(ftp|http|https|FTP|HTTP|HTTPS):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/.test(value.trim()))) {
                return false
            }
            return true
        }
        if (!req.body) {
            return res.status(400).send({ Status: false, Message: "request body is empty for createshortUr" })
        }

        if (!longUrl) {
            return res.status(400).send({ Status: false, Message: "Url Is Required for request plz Enter" })
        }

        if (!validUrls(baseUrl)) {
            return res.status(400).send({ status: false, Message: "invalid Base Url" });
        }

        if (!validUrls(longUrl)) {
            return res.status(400).send({ status: false, Message: "Invalid Long Url link" });
        }


        //----------------------------------------------------------------------------------------------------------------------------------------------
        //creation of urlCode
        const urlCode = shortid.generate();
        if (validUrl.isUri(longUrl)) {
            try {
                if (!longUrl) {

                    return res.status(400).send({ status: false, longUrl: url })
                } else {
                    

                    const shortUrl = baseUrl + '/' + urlCode
                    const data = { longUrl: longUrl, shortUrl: shortUrl, urlCode: urlCode.toLowerCase() };
                    let url = await urlModel.create(data)
                    await SET_ASYNC(`${url}`, JSON.stringify(url))
                    return res.status(201).send({ status: true, message: "success", data: data })

                }
            } catch (err) {
                res.status(500).send({ Status: false, msg: "Error", error: err.message })
            }
        } else {
            return res.status(400).send({ status: false, message: "invalid long url" })
        }

    } catch (err) {
        return res.status(500).send(err.message)
    }

}

//**************************************************************getUrl-API*********************************************************************//



const getUrl = async (req, res) => {
    try{
        let cahcedUrlData = await GET_ASYNC(`${req.params.urlCode}`)
        if(cahcedUrlData)
            // res.status(200).send({status: true, message: "Data from REDIS ->", longUrl: JSON.parse(cahcedUrlData)})
            res.redirect(JSON.parse(cahcedUrlData))
        else{
            let findUrl = await urlModel.findOne({urlCode: req.params.urlCode})
            if(!findUrl)
                return res.status(404).send({status: false, message: 'URL not found.'})
            await SET_ASYNC(`${req.params.urlCode}`, JSON.stringify(findUrl.longUrl))
            // res.status(200).send({status: true, message: "Data from DB ->", data: findUrl.longUrl})
            res.redirect(findUrl.longUrl)
        }
    }catch(err){
        res.status(500).send({status: false, message: err.message})
    }
}

//======================================================Exporting============================================================================//

module.exports.createUrl = createUrl
module.exports.getUrl = getUrl

