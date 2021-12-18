const { Bot, cq } = require('./Bot');

(async () => {
    const bot = new Bot('ws://localhost:8080', 'YABuA6rluJNc5VI6oeUokj5GXOvdjBoY', 2672635131);

    await bot.open();

    console.log(await bot.getGroupConfig(929911672))

    bot.on('GroupMessage', async function (data) {
        if (data.from.group.id === 929911672) {
            //console.log(data)
            const ret = await data.reply('test')
            console.log(await bot.setEssence(ret.messageId))



        }
    });


    bot.on('FriendMessage', async function (data) {
        if (data.from.id === 510600087) {
            //cq.parse(data.msg)
            //console.log(data)
            //console.log(await data.reply('测试：' + data.msg));
        }
    });

    bot.on('NewFriendRequestEvent', async function (data) {
        console.log(data)
        console.log(await data.reject())
    });

})();

