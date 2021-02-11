const winston = require('winston');


const logger = winston.createLogger({
    transports:[
        new winston.transports.File({
            level: 'info', 
            filename: 'logger-info.log',
            json: true,
            format: winston.format.combine(winston.format.timestamp(), winston.format.json())
        }),
        new winston.transports.File({
            level: 'error', 
            filename: 'logger-error.log',
            json: true,
            format: winston.format.combine(winston.format.timestamp(), winston.format.json())
        })
    ]
})

module.exports = logger;