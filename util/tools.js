"use strict";

module.exports = {
    isBase64(str) {
        if(str === '' || str.trim() === '') return false;
        try{
            return btoa(atob(str)) == str;
        } catch(err) {
            return false;
        }
    },

    permission(str) {
        if (str === 'OWNER') {
            return 2;
        } else if (str === 'ADMINISTRATOR') {
            return 1;
        } else {
            return 0;
        }
    }
}