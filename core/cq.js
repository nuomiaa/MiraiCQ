"use strict";
const tools = require('../util/tools');
let chain = {}

module.exports = {
    music(kind, title, summary, jumpUrl, pictureUrl, musicUrl, brief) {// 音乐
        return [{
            type: 'MusicShare',
            kind: kind || 'NeteaseCloudMusic',
            summary: summary,
            jumpUrl: jumpUrl,
            pictureUrl: pictureUrl,
            musicUrl: musicUrl,
            brief: brief
        }];
    },

    voice(param) {// 语音 - 可传递 base64/path/url/id
        if (!param) {
            console.log('[日志] cq.voice 未传递有效参数');
            return [];
        }
        let param_ = {};
        if (tools.isBase64(param)) param_ = {base64: param};
        else if (param.indexOf('/')>-1) {
            if (param.indexOf('http')>-1) param_ = {url: param};
            else param_ = {path: param};
        } else param_ = {voiceId: param};
        return [{
            type: 'Voice',
            ...param_
        }];
    },

    image(param) {// 图片 - 可传递 base64/path/url/id
        if (!param) {
            console.log('[日志] cq.image 未传递有效参数');
            return '';
        }
        return '[图片,'+param+']'
    },

    poke(id) {// 戳一戳
        let name = 'Poke';// 戳一戳
        switch (id) {
            case 1:
                name = 'ShowLove';// 比心
                break;
            case 2:
                name = 'Like';// 点赞
                break;
            case 3:
                name = 'Heartbroken';// 心碎
                break;
            case 4:
                name = 'SixSixSix';// 666
                break;
            case 5:
                name = 'FangDaZhao';// 放大招
                break;
        }
        return [{
            type: 'Poke',
            name: name
        }];
    },

    face(id, name) {// 系统表情(face)
        return '[表情,'+id+','+name+']'
    },

    at(id, space) {// @某人(at)
        return '[@' + (id>-1?id:'all') + ']' + (space?' ':'')
    },

    escape(msg) {// 转义 - 将文本当中的[、]、\进行转义以防框架帐号误识文本为文本代码
        return msg
            .replace(/\\/g, '\u005c')
            .replace(/\[/g, '\u005b')
            .replace(/]/g, '\u005d')
            .replace(/,/g, '\u002c')
    },

    unescape(msg) {// 反转义 - 将经过转义的[、]、\反转义回来
        return msg
            .replace(/\u005c/g, '\\')
            .replace(/\u005b/g, '[')
            .replace(/\u005d/g, ']')
            .replace(/\u002c/g, ',')
    },

    parse(msg) {// 解析
        if (!msg) return [];
        const res = msg.split(/\[(.*?)]/);
        let chain = [];
        for (const text of res) {
            if (!text) continue;
            const m = text.split(',');
            const l = m.length-1;

            if (text.indexOf('@')===0) {
                const target = text.substr(1);
                if (target == 'all') chain.push({type: 'AtAll', target: 0});
                else chain.push({type: 'At', target: target});
            } else if (m[0]==='表情' && (l===1 || l===2)) {
                if (l===2) chain.push({type:'Face', faceId:parseInt(m[1])});
                else chain.push({type:'Face', faceId:parseInt(m[1]), name:m[2]});
            } else if (m[0]==='图片' && l===1) {
                let param_ = {};
                if (tools.isBase64(m[1])) param_ = {base64: m[1]};
                else if (m[1].indexOf('/')>-1) {
                    if (m[1].indexOf('http')>-1) param_ = {url: m[1]};
                    else param_ = {path: m[1]};
                } else param_ = {imageId: m[1]};
                chain.push({type:'Image', ...param_});
            } else {
                chain.push({type:'Plain', text:text});
            }
        }
        return chain;
    },

    stringify(messageChain) {// 字符串化
        let text = '';
        for (const msg of messageChain) {
            switch (msg.type) {
                case 'Plain':
                    text += msg.text;
                    break;
                case 'Image':
                    text += '[图片,'+msg.imageId+']';
                    chain[msg.imageId] = msg.url
                    break;
                case 'Face':
                    text += '[表情,'+msg.faceId+']';
                    break;
                case 'AtAll':
                    text += '[@all]';
                    break;
                case 'At':
                    text += '[@'+msg.target+']';
                    break;
            }
        }
        return text;
    },

    getImageUrl(imageId) {// 取图片链接
        return chain[imageId] || '';
    }
}