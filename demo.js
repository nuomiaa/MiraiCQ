const { Bot, cq } = require('./Bot');
(async () => {
    const bot = new Bot(
        'ws://localhost:8080',
        '验证密钥',
        10000
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

        if (data.msg === '禁言我') {
            await bot.muteMember(data.from.group.id, data.from.id, 30)// 禁言 30 秒
        } else if (data.msg === '全体禁言') {
            await bot.muteAll(data.from.group.id)
        } else if (data.msg === '解除全体禁言') {
            await bot.unmuteAll(data.from.group.id)
        } else if (data.msg === '设置精华') {
            await bot.setEssence(data.messageId)
        }
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


    // 新人入群的事件
    bot.on('MemberJoinEvent', async function (data) {
        //await data.reply('欢迎 ' + cq.at(data.member.id, true) + ' 加入本群 [表情,144][表情,144][表情,144]');
    });


    // 成员被踢出群 (该成员不是Bot)
    bot.on('MemberLeaveEventKick', async function (data) {
        //await bot.sendGroupMessage(data.group.id, data.member.name + ' 被踢出了本群 [表情,174]');
    });


    // 成员主动离群 (该成员不是Bot)
    bot.on('MemberLeaveEventQuit', async function (data) {
        //await bot.sendGroupMessage(data.group.id, '有个人退群了，真是的，为什么？');
    });


    // 添加好友申请
    bot.on('NewFriendRequestEvent', async function (data) {
        // 同意添加好友
        //await data.agree();

        // 拒绝添加好友
        //await data.reject('拒绝内容');

        // 拒绝添加好友并添加黑名单，不再接收该用户的好友申请
        //await data.reject('拒绝内容', true);
    });


    // 成员入群申请 (Bot需要有管理员权限)
    bot.on('MemberJoinRequestEvent', async function (data) {
        // 同意入群
        //await data.agree();

        // 拒绝入群
        //await data.reject('拒绝内容');

        // 忽略请求
        //await data.ignore();

        // 拒绝入群并添加黑名单，不再接收该用户的入群申请
        //await data.reject('拒绝内容', true);

        // 忽略入群并添加黑名单，不再接收该用户的入群申请
        //await data.ignore(true);
    });


    // Bot被邀请入群申请
    bot.on('BotInvitedJoinGroupRequestEvent', async function (data) {
        // 同意邀请
        //await data.agree();

        // 拒绝邀请
        //await data.reject();
    });


    // 好友输入状态改变
    bot.on('FriendInputStatusChangedEvent', async function (data) {
        //if (data.inputting) await bot.sendFriendMessage(data.friend.id, '你在输入什么呢？');
        //else await bot.sendFriendMessage(data.friend.id, '你准备发送了吗？');
    });


    // 好友昵称改变
    bot.on('FriendNickChangedEvent', async function (data) {

    });


    // Bot在群里的权限被改变 (操作人一定是群主)
    bot.on('BotGroupPermissionChangeEvent', async function (data) {

    });


    // Bot被禁言
    bot.on('BotMuteEvent', async function (data) {

    });


    // Bot被取消禁言
    bot.on('BotUnmuteEvent', async function (data) {

    });


    // Bot加入了一个新群
    bot.on('BotJoinGroupEvent', async function (data) {

    });


    // Bot主动退出一个群
    bot.on('BotLeaveEventActive', async function (data) {

    });


    // Bot被踢出一个群
    bot.on('BotLeaveEventKick', async function (data) {

    });


    // 群消息撤回
    bot.on('GroupRecallEvent', async function (data) {

    });


    // 好友消息撤回
    bot.on('FriendRecallEvent', async function (data) {

    });


    // 群名称改变
    bot.on('GroupNameChangeEvent', async function (data) {

    });


    // 群公告改变
    bot.on('GroupEntranceAnnouncementChangeEvent', async function (data) {

    });


    // 全员禁言
    bot.on('GroupMuteAllEvent', async function (data) {

    });


    // 匿名聊天
    bot.on('GroupAllowAnonymousChatEvent', async function (data) {

    });


    // 坦白说
    bot.on('GroupAllowConfessTalkEvent', async function (data) {

    });


    // 允许群员邀请好友加群
    bot.on('GroupAllowMemberInviteEvent', async function (data) {

    });


    // 群名片改动
    bot.on('MemberCardChangeEvent', async function (data) {

    });


    // 群头衔改动 (只有群主有操作限权)
    bot.on('MemberSpecialTitleChangeEvent', async function (data) {

    });


    // 成员权限改变的事件 (该成员不是Bot)
    bot.on('MemberPermissionChangeEvent', async function (data) {

    });


    // 群成员被禁言事件 (该成员不是Bot)
    bot.on('MemberMuteEvent', async function (data) {

    });


    // 群成员被取消禁言事件 (该成员不是Bot)
    bot.on('MemberUnmuteEvent', async function (data) {

    });


    // 群员称号改变
    bot.on('MemberHonorChangeEvent', async function (data) {

    });


    // 其他客户端上线
    bot.on('OtherClientOnlineEvent', async function (data) {

    });


    // 其他客户端下线
    bot.on('OtherClientOfflineEvent', async function (data) {

    });


})();