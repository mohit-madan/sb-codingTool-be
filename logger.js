const winston = require('winston');

// ./Logs${new Date().toLocaleDateString()}/coding-main-backend${new Date().toLocaleDateString()}${new Date().toLocaleTimeString()}.log
const logger = winston.createLogger({
    transports:[
        new winston.transports.File({
            level: 'info', 
            filename: `coding-main-backend-info.log`,
            json: true,
            format: winston.format.combine(winston.format.timestamp(), winston.format.json())
        }),
        new winston.transports.File({
            level: 'error', 
            filename: `coding-main-backend-err.log`,
            json: true,
            format: winston.format.combine(winston.format.timestamp(), winston.format.json())
        })
    ]
})

module.exports = logger;