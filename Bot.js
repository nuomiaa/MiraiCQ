const getInvalidParamsString = require('./util/getInvalidParamsString');
const getSyncIdReturn = require('./core/getSyncIdReturn');
require('events').EventEmitter.defaultMaxListeners = 0;
const WebSocket = require('./util/ws');
const tools = require('./util/tools');
const cq = require('./core/cq');

class Bot {
    constructor(url, verifyKey, qq) {
        if (!url || !verifyKey || !qq) {
            throw new Error(`open: 缺少必要的 ${getInvalidParamsString({url, qq, verifyKey})} 参数`);
        }

        this.ws = null;
        this.config = {
            url: url,
            verifyKey: verifyKey,
            qq: qq
        };
        this.session = null;

        console.clear();
    }


    open() {
        const self = this;
        return new Promise((callback) => {
            this.ws = new WebSocket(this.config.url+ '/all?verifyKey=' + this.config.verifyKey + '&qq=' + this.config.qq);

            this.ws.on('open', function () {
                // WebSocket连接成功
                //this.wsState = true;
                console.log('[日志] WebSocket: 连接成功')
            });

            this.ws.on('message', function message(data) {
                const json = JSON.parse(data.toString());

                if (json.data.session) {
                    self.session = json.data.session;
                    console.log('[日志] 框架: Session 已获取')
                    callback(self.session)
                }
            });

            this.ws.on('close', function () {
                // BUG: 重启后 on 无法接收消息
                console.log('[日志] WebSocket: 连接断开...')
                process.exit()

                /*
                self.wsState = false;
                self.session = null;
                self.ws = null;

                console.log('WebSocket: 连接断开，准备重连...')
                setTimeout(function () {
                    self.open()
                },1000 * 15);
                */
            })

            this.ws.on('error', function (e) {
                if (e.errno === -111) {
                    //console.log('[日志] WebSocket: 连接被拒绝，准备重连...');
                } else {
                    console.log('WebSocket: ', e);
                }
            })
        })
    }

    on(event, callback) {
        if (!this.config) {
            throw new Error('on: 请先使用 open，创建会话');
        }

        if (!event || !callback) {
            throw new Error(`on: 缺少必要的 ${getInvalidParamsString({event, callback})} 参数`);
        }

        const self = this;
        this.ws.on('message', function message(data_) {
            const json = JSON.parse(data_.toString());
            if (!json.data) return {code: -1, msg:'on: JSON解析不到数据'};
            const data = json.data || {};
            const source = data.messageChain ? data.messageChain[0] : {};
            const operator = data.operator || {};
            const sender = data.sender || {};
            const friend = data.friend || {};
            const member = data.member || {};
            const group = data.group || {};

            // 调试
            //console.log(data);

            if (json.data.type === event) {
                switch (json.data.type && event) {
                    // 好友输入状态改变
                    case 'FriendInputStatusChangedEvent':
                        callback({
                            inputting: data.inputting,
                            friend: {
                                id: friend.id,
                                name: friend.nickname,
                                remark: friend.remark
                            }
                        });
                        break;


                    // 好友昵称改变
                    case 'FriendNickChangedEvent':
                        callback({
                            origin: data.from,
                            current: data.to,
                            friend: {
                                id: friend.id,
                                name: friend.nickname,
                                remark: friend.remark
                            }
                        });
                        break;


                    // Bot在群里的权限被改变 (操作人一定是群主)
                    case 'BotGroupPermissionChangeEvent':
                        callback({
                            admin: group.permission === 'ADMINISTRATOR',
                            group: {
                                id: group.id,
                                name: group.name
                            }
                        });
                        break;


                    // Bot被禁言
                    case 'BotMuteEvent':
                        callback({
                            time: data.durationSeconds,
                            group: {
                                id: operator.group.id,
                                name: operator.group.name,
                                permission: tools.permission(operator.group.permission)
                            },
                            operator: {
                                id: operator.id,
                                name: operator.memberName,
                                permission: tools.permission(operator.permission),
                                specialTitle: operator.specialTitle,
                                joinTimestamp: operator.joinTimestamp,
                                muteTimeRemaining: operator.muteTimeRemaining,
                                lastSpeakTimestamp: operator.lastSpeakTimestamp
                            }
                        });
                        break;


                    // Bot被取消禁言
                    case 'BotUnmuteEvent':
                        callback({
                            group: {
                                id: operator.group.id,
                                name: operator.group.name,
                                permission: tools.permission(operator.group.permission)
                            },
                            operator: {
                                id: operator.id,
                                name: operator.memberName,
                                permission: tools.permission(operator.permission),
                                specialTitle: operator.specialTitle,
                                joinTimestamp: operator.joinTimestamp,
                                muteTimeRemaining: operator.muteTimeRemaining,
                                lastSpeakTimestamp: operator.lastSpeakTimestamp
                            }
                        });
                        break;


                    // Bot加入了一个新群
                    case 'BotJoinGroupEvent':
                        callback({
                            group: {
                                id: group.id,
                                name: group.name,
                                permission: tools.permission(group.permission)
                            },
                            invitor: data.invitor
                        });
                        break;


                    // Bot主动退出一个群
                    case 'BotLeaveEventActive':
                        callback({
                            group: {
                                id: group.id,
                                name: group.name,
                                permission: tools.permission(group.permission)
                            }
                        });
                        break;


                    // Bot被踢出一个群
                    case 'BotLeaveEventKick':
                        callback({
                            group: {
                                id: operator.group.id,
                                name: operator.group.name,
                                permission: tools.permission(operator.group.permission)
                            },
                            operator: {
                                id: operator.id,
                                name: operator.memberName,
                                permission: tools.permission(operator.permission),
                                specialTitle: operator.specialTitle,
                                joinTimestamp: operator.joinTimestamp,
                                muteTimeRemaining: operator.muteTimeRemaining,
                                lastSpeakTimestamp: operator.lastSpeakTimestamp
                            }
                        });
                        break;


                    // 群消息撤回
                    case 'GroupRecallEvent':
                        callback({
                            time: data.time,
                            authorId: data.authorId,
                            messageId: data.messageId,
                            operator: {
                                id: operator.id,
                                name: operator.memberName,
                                permission: tools.permission(operator.permission),
                                specialTitle: operator.specialTitle,
                                joinTimestamp: operator.joinTimestamp,
                                muteTimeRemaining: operator.muteTimeRemaining,
                                lastSpeakTimestamp: operator.lastSpeakTimestamp
                            }
                        })
                        break;


                    // 好友消息撤回
                    case 'FriendRecallEvent':
                        callback({
                            time: data.time,
                            authorId: data.authorId,
                            messageId: data.messageId,
                        });
                        break;


                    // 群名称改变
                    case 'GroupNameChangeEvent':
                        callback({
                            origin: data.origin,
                            current: data.current,
                            group: {
                                id: operator.group.id,
                                name: operator.group.name,
                                permission: tools.permission(operator.group.permission)
                            },
                            operator: {
                                id: operator.id,
                                name: operator.memberName,
                                permission: tools.permission(operator.permission),
                                specialTitle: operator.specialTitle,
                                joinTimestamp: operator.joinTimestamp,
                                muteTimeRemaining: operator.muteTimeRemaining,
                                lastSpeakTimestamp: operator.lastSpeakTimestamp
                            }
                        });
                        break;


                    // 群公告改变
                    case 'GroupEntranceAnnouncementChangeEvent':
                        callback({
                            origin: data.origin,
                            current: data.current,
                            group: {
                                id: operator.group.id,
                                name: operator.group.name,
                                permission: tools.permission(operator.group.permission)
                            },
                            operator: {
                                id: operator.id,
                                name: operator.memberName,
                                permission: tools.permission(operator.permission),
                                specialTitle: operator.specialTitle,
                                joinTimestamp: operator.joinTimestamp,
                                muteTimeRemaining: operator.muteTimeRemaining,
                                lastSpeakTimestamp: operator.lastSpeakTimestamp
                            }
                        });
                        break;


                    // 全员禁言
                    case 'GroupMuteAllEvent':
                        console.log(data)
                        callback({
                            state: data.current,
                            group: {
                                id: group.id,
                                name: group.name,
                                permission: tools.permission(group.permission)
                            },
                            operator: {
                                id: operator.id,
                                name: operator.memberName,
                                permission: tools.permission(operator.permission),
                                specialTitle: operator.specialTitle,
                                joinTimestamp: operator.joinTimestamp,
                                muteTimeRemaining: operator.muteTimeRemaining,
                                lastSpeakTimestamp: operator.lastSpeakTimestamp
                            }
                        });
                        break;


                    // 匿名聊天
                    case 'GroupAllowAnonymousChatEvent':
                        callback({
                            state: data.current,
                            group: {
                                id: operator.group.id,
                                name: operator.group.name,
                                permission: tools.permission(operator.group.permission)
                            },
                            operator: {
                                id: operator.id,
                                name: operator.memberName,
                                permission: tools.permission(operator.permission),
                                specialTitle: operator.specialTitle,
                                joinTimestamp: operator.joinTimestamp,
                                muteTimeRemaining: operator.muteTimeRemaining,
                                lastSpeakTimestamp: operator.lastSpeakTimestamp
                            }
                        });
                        break;



                    // 坦白说
                    case 'GroupAllowConfessTalkEvent':
                        callback({
                            state: data.current,
                            isByBot: data.isByBot,
                            group: {
                                id: operator.group.id,
                                name: operator.group.name,
                                permission: tools.permission(operator.group.permission)
                            }
                        });
                        break;



                    // 允许群员邀请好友加群
                    case 'GroupAllowMemberInviteEvent':
                        callback({
                            state: data.current,
                            group: {
                                id: operator.group.id,
                                name: operator.group.name,
                                permission: tools.permission(operator.group.permission)
                            },
                            operator: {
                                id: operator.id,
                                name: operator.memberName,
                                permission: tools.permission(operator.permission),
                                specialTitle: operator.specialTitle,
                                joinTimestamp: operator.joinTimestamp,
                                muteTimeRemaining: operator.muteTimeRemaining,
                                lastSpeakTimestamp: operator.lastSpeakTimestamp
                            }
                        });
                        break;



                    // 新人入群的事件
                    case 'MemberJoinEvent':
                        callback({
                            group: {
                                id: member.group.id,
                                name: member.group.name,
                                permission: tools.permission(member.group.permission)
                            },
                            member: {
                                id: member.id,
                                name: member.memberName,
                                permission: tools.permission(member.permission),
                                specialTitle: member.specialTitle,
                                joinTimestamp: member.joinTimestamp,
                                muteTimeRemaining: member.muteTimeRemaining,
                                lastSpeakTimestamp: member.lastSpeakTimestamp
                            },
                            invitor: data.invitor,
                            reply: async function (msg) {
                                return await self.sendGroupMessage(member.group.id, msg);
                            }
                        });
                        break;



                    // 成员被踢出群 (该成员不是Bot)
                    case 'MemberLeaveEventKick':
                        callback({
                            group: {
                                id: member.group.id,
                                name: member.group.name,
                                permission: tools.permission(member.group.permission)
                            },
                            member: {
                                id: member.id,
                                name: member.memberName,
                                permission: tools.permission(member.permission),
                                specialTitle: member.specialTitle,
                                joinTimestamp: member.joinTimestamp,
                                muteTimeRemaining: member.muteTimeRemaining,
                                lastSpeakTimestamp: member.lastSpeakTimestamp
                            },
                            operator: {
                                id: operator.id,
                                name: operator.memberName,
                                permission: tools.permission(operator.permission),
                                specialTitle: operator.specialTitle,
                                joinTimestamp: operator.joinTimestamp,
                                muteTimeRemaining: operator.muteTimeRemaining,
                                lastSpeakTimestamp: operator.lastSpeakTimestamp
                            }
                        });
                        break;



                    // 成员主动离群 (该成员不是Bot)
                    case 'MemberLeaveEventQuit':
                        callback({
                            group: {
                                id: member.group.id,
                                name: member.group.name,
                                permission: tools.permission(member.group.permission)
                            },
                            member: {
                                id: member.id,
                                name: member.memberName,
                                permission: tools.permission(member.permission),
                                specialTitle: member.specialTitle,
                                joinTimestamp: member.joinTimestamp,
                                muteTimeRemaining: member.muteTimeRemaining,
                                lastSpeakTimestamp: member.lastSpeakTimestamp
                            }
                        });
                        break;



                    // 群名片改动
                    case 'MemberCardChangeEvent':
                        callback({
                            origin: data.origin,
                            current: data.current,
                            group: {
                                id: member.group.id,
                                name: member.group.name,
                                permission: tools.permission(member.group.permission)
                            },
                            member: {
                                id: member.id,
                                name: member.memberName,
                                permission: tools.permission(member.permission),
                                specialTitle: member.specialTitle,
                                joinTimestamp: member.joinTimestamp,
                                muteTimeRemaining: member.muteTimeRemaining,
                                lastSpeakTimestamp: member.lastSpeakTimestamp
                            }
                        });
                        break;



                    // 群头衔改动 (只有群主有操作限权)
                    case 'MemberSpecialTitleChangeEvent':
                        callback({
                            origin: data.origin,
                            current: data.current,
                            group: {
                                id: member.group.id,
                                name: member.group.name,
                                permission: tools.permission(member.group.permission)
                            },
                            member: {
                                id: member.id,
                                name: member.memberName,
                                permission: tools.permission(member.permission),
                                specialTitle: member.specialTitle,
                                joinTimestamp: member.joinTimestamp,
                                muteTimeRemaining: member.muteTimeRemaining,
                                lastSpeakTimestamp: member.lastSpeakTimestamp
                            }
                        });
                        break;



                    // 成员权限改变的事件 (该成员不是Bot)
                    case 'MemberPermissionChangeEvent':
                        callback({
                            admin: group.permission === 'ADMINISTRATOR',
                            group: {
                                id: member.group.id,
                                name: member.group.name,
                                permission: tools.permission(member.group.permission)
                            },
                            member: {
                                id: member.id,
                                name: member.memberName,
                                permission: tools.permission(member.permission),
                                specialTitle: member.specialTitle,
                                joinTimestamp: member.joinTimestamp,
                                muteTimeRemaining: member.muteTimeRemaining,
                                lastSpeakTimestamp: member.lastSpeakTimestamp
                            }
                        });
                        break;



                    // 群成员被禁言事件 (该成员不是Bot)
                    case 'MemberMuteEvent':
                        callback({
                            time: data.durationSeconds,
                            group: {
                                id: member.group.id,
                                name: member.group.name,
                                permission: tools.permission(member.group.permission)
                            },
                            member: {
                                id: member.id,
                                name: member.memberName,
                                permission: tools.permission(member.permission),
                                specialTitle: member.specialTitle,
                                joinTimestamp: member.joinTimestamp,
                                muteTimeRemaining: member.muteTimeRemaining,
                                lastSpeakTimestamp: member.lastSpeakTimestamp
                            },
                            operator: {
                                id: operator.id,
                                name: operator.memberName,
                                permission: tools.permission(operator.permission),
                                specialTitle: operator.specialTitle,
                                joinTimestamp: operator.joinTimestamp,
                                muteTimeRemaining: operator.muteTimeRemaining,
                                lastSpeakTimestamp: operator.lastSpeakTimestamp
                            }
                        });
                        break;



                    // 群成员被取消禁言事件 (该成员不是Bot)
                    case 'MemberUnmuteEvent':
                        callback({
                            group: {
                                id: member.group.id,
                                name: member.group.name,
                                permission: tools.permission(member.group.permission)
                            },
                            member: {
                                id: member.id,
                                name: member.memberName,
                                permission: tools.permission(member.permission),
                                specialTitle: member.specialTitle,
                                joinTimestamp: member.joinTimestamp,
                                muteTimeRemaining: member.muteTimeRemaining,
                                lastSpeakTimestamp: member.lastSpeakTimestamp
                            },
                            operator: {
                                id: operator.id,
                                name: operator.memberName,
                                permission: tools.permission(operator.permission),
                                specialTitle: operator.specialTitle,
                                joinTimestamp: operator.joinTimestamp,
                                muteTimeRemaining: operator.muteTimeRemaining,
                                lastSpeakTimestamp: operator.lastSpeakTimestamp
                            }
                        });
                        break;



                    // 群员称号改变
                    case 'MemberHonorChangeEvent':
                        callback({
                            action: data.action,
                            honor: data.honor,
                            group: {
                                id: member.group.id,
                                name: member.group.name,
                                permission: tools.permission(member.group.permission)
                            },
                            member: {
                                id: member.id,
                                name: member.memberName,
                                permission: tools.permission(member.permission),
                                specialTitle: member.specialTitle,
                                joinTimestamp: member.joinTimestamp,
                                muteTimeRemaining: member.muteTimeRemaining,
                                lastSpeakTimestamp: member.lastSpeakTimestamp
                            }
                        });
                        break;



                    // 添加好友申请
                    case 'NewFriendRequestEvent':
                        callback({
                            id: data.fromId,
                            name: data.nick,
                            message: data.message,
                            eventId: data.eventId,
                            group: {
                                id: data.groupId
                            },
                            // 同意
                            agree: async function () {
                                return await self.operateNewFriendRequestEvent(data.fromId, data.eventId, 0, '');
                            },
                            // 拒绝
                            reject: async function (message, addBlackList=false) {
                                return await self.operateNewFriendRequestEvent(data.fromId, data.eventId, addBlackList?2:1, message);
                            }
                        });
                        break;



                    // 成员入群申请 (Bot需要有管理员权限)
                    case 'MemberJoinRequestEvent':
                        callback({
                            id: data.fromId,
                            name: data.nick,
                            message: data.message,
                            eventId: data.eventId,
                            group: {
                                id: data.groupId,
                                name: data.groupName
                            },
                            // 同意
                            agree: async function () {
                                return await self.operateMemberJoinRequestEvent(data.fromId, data.groupId, data.eventId, 0, '');
                            },
                            // 拒绝
                            reject: async function (message, addBlackList=false) {
                                return await self.operateMemberJoinRequestEvent(data.fromId, data.groupId, data.eventId, addBlackList?3:1, message);
                            },
                            // 忽略
                            ignore: async function (addBlackList=false) {
                                return await self.operateMemberJoinRequestEvent(data.fromId, data.groupId, data.eventId, addBlackList?4:2, '');
                            }
                        });
                        break;



                    // Bot被邀请入群申请
                    case 'BotInvitedJoinGroupRequestEvent':
                        callback({
                            id: data.fromId,
                            name: data.nick,
                            message: data.message,
                            eventId: data.eventId,
                            group: {
                                id: data.groupId,
                                name: data.groupName
                            },
                            // 同意
                            agree: async function () {
                                return await self.operateBotInvitedJoinGroupRequestEvent(data.fromId, data.groupId, data.eventId, 0, '');
                            },
                            // 拒绝
                            reject: async function (message) {
                                return await self.operateBotInvitedJoinGroupRequestEvent(data.fromId, data.groupId, data.eventId, 1, message);
                            }
                        });
                        break;



                    // 其他客户端上线
                    case 'OtherClientOnlineEvent':
                        callback({
                            id: data.client.id,
                            kind: data.kind,
                            platform: data.client.platform
                        });
                        break;



                    // 其他客户端下线
                    case 'OtherClientOfflineEvent':
                        callback({
                            id: data.client.id,
                            platform: data.client.platform
                        });
                        break;


                    // 群消息
                    case 'GroupMessage':
                        if (json.data.sender.group.id!==929911672) break;
                        console.log(json.data.messageChain)
                        callback({
                            time: source.time,
                            messageId: source.id,
                            from: {
                                id: sender.id,
                                name: sender.memberName,
                                permission: tools.permission(sender.permission),
                                specialTitle: sender.specialTitle,
                                joinTimestamp: sender.joinTimestamp,
                                muteTimeRemaining: sender.muteTimeRemaining,
                                lastSpeakTimestamp: sender.lastSpeakTimestamp,
                                group: {
                                    id: sender.group.id,
                                    name: sender.group.name,
                                    permission: tools.permission(sender.group.permission)
                                }
                            },
                            msg: cq.stringify(json.data.messageChain),
                            reply: async function (msg) {
                                return await self.sendGroupMessage(sender.group.id, msg, source.id);
                            }
                        });
                        break;


                    // 好友消息
                    case 'FriendMessage':
                        callback({
                            messageId: source.id,
                            time: source.time,
                            from: {
                                id: sender.id,
                                name: sender.nickname,
                                remark: sender.remark
                            },
                            msg: cq.stringify(json.data.messageChain),
                            reply: async function (msg) {
                                return await self.sendFriendMessage(sender.id, msg, source.id);
                            }
                        });
                        break;
                    default:
                        throw new Error('未知事件类型: ' + event)
                }
            }
        });
    };


    // 发送
    async send(command, data, sub) {
        const syncId = (new Date() * 1).toString();
        this.ws.send(JSON.stringify({
            syncId: syncId,
            command: command,
            subCommand: sub,
            content: {
                sessionKey: this.session,
                ...data
            }
        }));
        return await getSyncIdReturn(this.ws, syncId);
    };


    // 撤回消息
    async recallMessage(messageId) {
        return await this.send('recall', {
            target: messageId
        });
    };


    // 发送-好友消息
    async sendFriendMessage(friendId, msg, quote) {
        const chain = typeof msg === 'object' ? msg : cq.parse(msg)
        return await this.send('sendFriendMessage', {
            target: friendId,
            quote: quote,
            messageChain: chain
        });
    };


    // 发送-群消息
    async sendGroupMessage(groupId, msg, quote) {
        const chain = typeof msg === 'object' ? msg : cq.parse(msg)
        return await this.send('sendGroupMessage', {
            target: groupId,
            quote: quote,
            messageChain: chain
        });
    };


    // 发送-临时会话消息
    async sendTempMessage(friendId, groupId, msg, quote) {
        const chain = typeof msg === 'object' ? msg : cq.parse(msg)
        return await this.send('sendTempMessage', {
            qq: friendId,
            group: groupId,
            quote: quote,
            messageChain: chain
        });
    };


    // 发送-头像戳一戳消息
    async sendNudgeMessage(friendId, groupId) {
        return await this.send('sendNudge', {
            target: friendId,
            subject: groupId || friendId,
            kind: groupId ? 'Group' : 'Friend'
        });
    };


    // 操作-添加好友申请
    async operateNewFriendRequestEvent(fromId, eventId, operate, message) {
        return await this.send('resp_newFriendRequestEvent', {
            eventId: eventId,
            fromId: fromId,
            groupId: 0,
            operate: operate,
            message: message
        })
    };


    // 操作-用户入群申请
    async operateMemberJoinRequestEvent(fromId, groupId, eventId, operate, message) {
        return await this.send('resp_memberJoinRequestEvent', {
            eventId: eventId,
            fromId: fromId,
            groupId: groupId,
            operate: operate,
            message: message
        })
    };


    // 操作-Bot被邀请入群申请
    async operateBotInvitedJoinGroupRequestEvent(fromId, groupId, eventId, operate, message) {
        return await this.send('resp_botInvitedJoinGroupRequestEvent', {
            eventId: eventId,
            fromId: fromId,
            groupId: groupId,
            operate: operate,
            message: message
        })
    };


    // 获取-插件信息(关于)
    async getPluginVersion() {
        return (await this.send('about', {})).data.version;
    };


    // 获取-Bot资料
    async getBotInfo() {
        let ret = await this.send('botProfile', {});
        let data = {};
        if (!ret.code) data = {
            name: ret.nickname,
            email: ret.email,
            level: ret.level,
            sign: ret.sign,
            sex: ret.sex,
            age: ret.age
        }
        return {
            code: ret.code || 0,
            msg: ret.msg || '' ,
            data: data
        };
    };


    // 获取-好友资料
    async getFriendInfo(friendId) {
        let ret = await this.send('friendProfile', {
            target: friendId
        });
        let data = {};
        if (!ret.code) data = {
            name: ret.nickname,
            email: ret.email,
            level: ret.level,
            sign: ret.sign,
            sex: ret.sex,
            age: ret.age
        }
        return {
            code: ret.code || 0,
            msg: ret.msg || '' ,
            data: data
        };
    };


    // 获取-群成员资料
    async getMemberProfile(GroupId, memberId) {
        let ret = await this.send('memberProfile', {
            target: GroupId,
            memberId: memberId
        });
        let data = {};
        if (!ret.code) data = {
            name: ret.nickname,
            email: ret.email,
            level: ret.level,
            sign: ret.sign,
            sex: ret.sex,
            age: ret.age
        }
        return {
            code: ret.code || 0,
            msg: ret.msg || '' ,
            data: data
        };
    };


    // 获取-消息(使用messageId)
    async getMessage(messageId) {
        let ret = await this.send('messageFromId', {
            id: messageId
        });
        if (ret.code === 0) {
            const sender = ret.data.sender;
            return {
                code: 0,
                msg: cq.stringify(ret.data.messageChain),
                from: {
                    id: sender.id,
                    name: sender.memberName,
                    permission: tools.permission(sender.permission),
                    specialTitle: sender.specialTitle,
                    joinTimestamp: sender.joinTimestamp,
                    lastSpeakTimestamp: sender.lastSpeakTimestamp,
                    muteTimeRemaining: sender.muteTimeRemaining,
                    group: {
                        id: sender.group.id,
                        name: sender.group.name,
                        permission: tools.permission(sender.group.permission)
                    }
                }
            }
        }
        return ret;
    };


    // 获取-好友列表
    async getFriendList() {
        const ret = await this.send('friendList');
        const list = [];
        if (ret.code===0) {
            for (const friend of ret.data) {
                list.push({
                    id: friend.id,
                    name: friend.nickname,
                    remark: friend.remark
                });
            }
        }
        return {
            code: ret.code || 0,
            msg: ret.msg || '' ,
            data: list
        };
    };


    // 获取-群列表
    async getGroupList() {
        const ret = await this.send('groupList');
        const list = [];
        if (ret.code===0) {
            for (const group of ret.data) {
                list.push({
                    id: group.id,
                    name: group.name,
                    permission: tools.permission(group.remark)
                });
            }
        }
        return {
            code: ret.code || 0,
            msg: ret.msg || '' ,
            data: list
        };
    };


    // 获取-群成员列表
    async getMemberList(groupId) {
        const ret = await this.send('memberList', {
            target: groupId
        });
        const list = [];
        if (ret.code===0) {
            for (const member of ret.data) {
                list.push({
                    id: member.id,
                    name: member.memberName,
                    permission: tools.permission(member.permission),
                    specialTitle: member.specialTitle,
                    joinTimestamp: member.joinTimestamp,
                    muteTimeRemaining: member.muteTimeRemaining,
                    lastSpeakTimestamp: member.lastSpeakTimestamp
                });
            }
            return {
                group: {
                    id: ret.data[0].group.id,
                    name: ret.data[0].group.name,
                    permission: tools.permission(ret.data[0].group.permission)
                },
                members: list
            };
        }
        return {
            code: ret.code,
            msg: ret.msg,
            group: {},
            members: []
        };
    };


    // 群文件-获取列表
    async getFileList(groupId, id='', path, size, offset, withDownloadInfo=false) {
        return await this.send('file_list', {
            id: id,
            path: path,
            size: size,
            group: groupId,
            offset: offset,
            withDownloadInfo: withDownloadInfo,
        });
    };


    // 群文件-获取信息
    async fileInfo(groupId, id='', path, withDownloadInfo=false) {
        return await this.send('file_info', {
            id: id,
            path: path,
            group: groupId,
            withDownloadInfo: withDownloadInfo
        });
    };


    // 群文件-创建文件夹
    async fileMkdir(groupId, name, id='', path) {
        return await this.send('file_mkdir', {
            id: id,
            path: path,
            group: groupId,
            directoryName: name
        });
    };


    // 群文件-删除
    async fileDelete(groupId, id='', path) {
        return await this.send('file_delete', {
            id: id,
            path: path,
            group: groupId
        });
    };


    // 群文件-移动
    async fileMove(groupId, id='', moveToId, path, moveToPath) {
        return await this.send('file_move', {
            id: id,
            path: path,
            group: groupId,
            moveTo: moveToId,
            moveToPath: moveToPath
        });
    };


    // 群文件-重命名
    async fileRename(groupId, id='', name, path) {
        return await this.send('file_rename', {
            id: id,
            path: path,
            group: groupId,
            renameTo: name
        });
    };


    // 删除好友
    async deleteFriend(friendId) {
        return await this.send('deleteFriend', {
            target: friendId
        });
    }


    // 禁言群成员
    async muteMember(groupId, memberId, time) {
        console.log({
            time: time,
            target: groupId,
            memberId: memberId
        })
        return await this.send('mute', {
            time: time,
            target: groupId,
            memberId: memberId
        });
    }


    // 解除群成员禁言
    async unmuteMember(groupId, memberId) {
        return await this.send('unmute', {
            target: groupId,
            memberId: memberId
        });
    }


    // 移除群成员
    async kickMember(groupId, memberId, msg) {
        return await this.send('kick', {
            msg: msg,
            target: groupId,
            memberId: memberId
        });
    }


    // 退出群聊
    async quitGroup(groupId) {
        return await this.send('quit', {
            target: groupId
        });
    }


    // 全体禁言
    async muteAll(groupId) {
        return await this.send('muteAll', {
            target: groupId
        });
    }


    // 解除全体禁言
    async unmuteAll(groupId) {
        return await this.send('unmuteAll', {
            target: groupId
        });
    }


    // 设置群精华消息
    async setEssence(messageId) {
        return await this.send('setEssence', {
            target: messageId
        });
    }


    // 获取群设置
    async getGroupConfig(groupId) {
        return await this.send('groupConfig', {
            target: groupId
        }, 'get');
    }


    // 修改群设置
    async modifyGroupConfig(groupId, config) {
        return await this.send('groupConfig', {
            target: groupId,
            config: config
        }, 'update');
    }


    // 获取群员信息 (名片/街头)
    async getMemberInfo(groupId, memberId) {
        return await this.send('memberInfo', {
            target: groupId
        }, 'get');
    }


    // 修改群员信息 (名片/街头)
    async modifyMemberConfig(groupId, memberId, info) {
        return await this.send('memberInfo', {
            target: groupId,
            info: info
        }, 'update');
    }
}

module.exports = {
    Bot,
    cq
};