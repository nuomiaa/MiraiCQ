# MiraiCQ

MiraiCQ 是一个基于 MiraiCQ-API 开发的 NodeJS QQ机器人框架

使用了方便的 CQ 代码: [图片,xxxxx] [表情,123]



## 安装
```shell
npm install miraicq
```



## 示例
### 简单
```js
const { Bot, cq } = require('./Bot');
(async () => {
    const bot = new Bot(
        'ws://localhost:8080',     // WebSocket地址
        '验证密钥',                 // API验证密钥
        10000                     // 机器人QQ号
    );
    
    // 创建会话
    await bot.open();

    // 群消息
    bot.on('GroupMessage', async function (data) {
        /* data:
        msg                    消息内容
        time                   时间
        messageId              消息ID
        from                   来源
        - id                     成员QQ号
        - name                   成员昵称
        - permission             成员权限 - 0:成员; 1:管理员; 2:群主;
        - specialTitle           专属街头
        - joinTimestamp          入群时间戳
        - muteTimeRemaining      禁言剩余时间(秒)
        - lastSpeakTimestamp     最后发言时间戳
        - group                  来源群
          - id                     群号
          - name                   群名称
          - permission             机器人权限 - 0:成员; 1:管理员; 2:群主;
        */

        // 回复消息
        //await data.reply('你发送了消息: ' + data.msg);

        // 发送语音消息 - 可传递 base64/path/url/id
        //await bot.sendGroupMessage(data.from.group.id, cq.voice('https://pic.ibaotu.com/17/97/19/75C888piCxWf.mp3'));

        // 回复图片消息 - 可传递 base64/path/url/id
        //await data.reply(cq.image('{ECE1E74B-4DB0-256E-BC54-71A43F9D2BDA}.jpg') + '\n Hi~ o(*￣▽￣*)ブ\n' + cq.at(data.from.id, true) + '欢迎使用 MiraiCQ ' + cq.face(175));
    });

    // 好友消息
    bot.on('FriendMessage', async function (data) {
        /* data:
        msg                    消息内容
        time                   时间
        messageId              消息ID
        from                   来源
        - id                     好友QQ号
        - name                   好友昵称
        - remark                 好友备注
        */

        // 回复消息
        //await data.reply('你发送了消息: ' + data.msg);
    });
})
```

### 完整
完整示例请查看: [demo.js](https://github.com/nuomiaa/MiraiCQ/blob/master/demo.js)