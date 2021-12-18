"use strict";

module.exports = async (ws, syncId) => {
    return new Promise((callback) => {
        ws.on('message', function message(data) {
            const json = JSON.parse(data.toString())
            if (json.syncId == syncId) callback(json.data)
        })
    })
};