const dotenv = require('dotenv')
dotenv.config({path: '.env'})
const TelegramBot = require("node-telegram-bot-api")
const mongoose = require('mongoose')

const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
  );
  
mongoose
    .connect(DB)

const User = require("./models/userModel")
const Channel = require("./models/channelsModel")
const Bot_Token = process.env.BOT_CODE
process.env.NTBA_FIX_350 = 1;

const bot = new TelegramBot(Bot_Token, {polling: true});
module.exports = bot
const { createInlineButtons ,changephonenum ,createInlineKeyboard , handleReferral ,handleYesOption ,checkUserMembership ,createBackButton, sendMessageWithOptions, editMessageWithOptions } = require('./utils')

const Crypto = "Dogs"

const buttons = [
    { text: "کانال ها", callback_data: "channels" },
    { text: "دعوت از دوستان", callback_data: "add_friend" },
    { text: "کیف پول", callback_data: "wallet" },
    { text: "ادرس کیف پول", callback_data: "walletAddress" },
    { text: "وبسایت RYOKU", callback_data: "website" },
    { text: "اضافه کردن شماره تلفن", callback_data: "phone" }
]

const buttonsAdmin = [
    ...buttons,
    { text: "اضافه کردن چنل", callback_data: "add_channel" },
    { text: "حذف کردن چنل", callback_data: "delete_channel" },
    { text: "مدیریت ادمین ها", callback_data: "change_admin" },
    { text: "مدیریت پرداخت ها", callback_data: "transactions" },
]

bot.onText(/\/start(.*)/, async (msg, match) => {
    const userId = msg.from.id;
    const userName = msg.from.first_name;
    const userLastName = msg.from.last_name || "";
    const chatId = msg.chat.id;
    const userNameFull = `${userName} ${userLastName}`;

    const referrerId = match[1] ? parseInt(match[1].trim(), 10) : null;

    const welcomeMessage = `${userNameFull}\nخوش امدید به RYOKU BOT`;

    let user = await User.findOne({ userId });
    if (!user) {
        const referredBy = referrerId && !isNaN(referrerId) ? referrerId : null;
        user = new User({
            userId,
            chatId,
            Balance: 0,
            referrals: [],
            referredBy,
        });
        await user.save();

        if (referrerId && referrerId !== userId) {
            const referrer = await User.findOne({ userId: referrerId });
            if (referrer) {
                await handleReferral(referrerId, userId);
                sendMessageWithOptions(chatId, "خوش امدید به RYOKU BOT");
            }
        }
    } else if (referrerId) {
        sendMessageWithOptions(chatId, "شما از قبل معرفی شدید و امکان گرفتن معرف جدید ندارید");
    }

    if (!user.hasSeenImage) {
        const referralLink = `https://t.me/Ry0ku_bot?start=${userId}`;
        const websiteLink = `http://5.75.204.122:8080`
        await bot.sendPhoto(chatId, "./intro.jpg", {
            caption: `با دعوت هر نفر ۵۰ داگز هدیه بگیرید\n در بعضی روز های هفته هر نفر ۸۰ داگز 💸🔥💯\nلینک دعوت شما👇\n${referralLink}\n❗️ توجه کنید که زیر مجموعه های شما برای دریافت موجودی رایگان حتما باید شماره خود را تایید و در کانال ما عضو شوند \n✅ از امکانات دکمه وب ۳ (پایین سمت چپ چت) استفاده کنید تا صاحب امتیاز بیشتر و شانس بالاتری در لاتاری شوید. \n${websiteLink}`,
        });
        user.hasSeenImage = true;
        await user.save();
    }

    const isMember = await checkUserMembership(userId ,chatId);
    if (!isMember && !user.isAdmin) {
        const channelDoc = await Channel.findOne()
        if (!channelDoc || !channelDoc.name || channelDoc.name.length === 0) {
            sendMessageWithOptions(chatId, "هیچ کانالی برای عضویت یافت نشد");
            return;
        }
        sendMessageWithOptions(
            chatId,
            "لطفا برای استفاده از بات عضو تمام کانال های زیر شوید:",
            {
                reply_markup: {
                    inline_keyboard: [
                        createInlineButtons(
                            channelDoc.name.map((channelName) => ({
                                text: `Join ${channelName}`,
                                url: `https://t.me/${channelName.replace("@", "")}`,
                            }))
                        ),
                    ],
                },
            }
        );
        return;
    }

    const isAdmin = user.isAdmin ? buttonsAdmin : buttons

    const startOptions = {
        reply_markup: {
            inline_keyboard: createInlineKeyboard(isAdmin)
        },
    };

    sendMessageWithOptions(chatId, welcomeMessage, startOptions);
});


bot.on("callback_query", async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;
    let user = await User.findOne({ userId });
    const channelDoc = await Channel.findOne();
    const isAdmin = user.isAdmin ? buttonsAdmin : buttons
    const startOptions = {
        reply_markup: {
            inline_keyboard: createInlineKeyboard(isAdmin),
        },
    }

    switch (data) {
        case "phone":
            if(user.phoneNumber) {
                editMessageWithOptions(chatId ,messageId ,`شماره همراه شما ${user.phoneNumber} میباشد  آیا میخواهید آن را تغییر دهید؟` , {
                    reply_markup: {
                        inline_keyboard: [
                            createInlineButtons(
                                [
                                    { text:"بله" ,callback_data: "false" }
                                ]
                            ),
                            createBackButton()
                        ],
                    },
                })
                break
            }
            else{
                changephonenum(chatId ,messageId ,userId)
                break;
            }
        
        case "false":
            changephonenum(chatId ,messageId ,userId)
            break
            
        case 'back':
            editMessageWithOptions(chatId, messageId, 'Ryoku BOT', startOptions)
            break;

        case "channels":
            editMessageWithOptions(
                chatId,
                messageId,
                "شما باید عضو کانال های زیر باشید",
                {
                    reply_markup: {
                        inline_keyboard: [
                            createInlineButtons(
                                channelDoc.name.map((channelName) => ({
                                    text: channelName,
                                    url: `https://t.me/${channelName.replace("@", "")}`,
                                }))
                            ),
                            createBackButton()
                        ],
                    },
                }
            );
            break;

        case "add_friend":
            const referralLink = `https://t.me/Ry0ku_bot?start=${userId}`;
            editMessageWithOptions(
                chatId ,
                messageId ,
                `برای دعوت از دوستان خود لینک زیر را بفرستید: \n ${referralLink}`,
                {
                    parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard: [
                            createInlineButtons([
                                { text:"بازگشت" ,callback_data: "back" }
                            ])
                        ],
                    },
                }
            );
            break;

        case "wallet":
            if (user) {
                const walletInfo = user.Balance > 0
                    ? `موجودی شما : ${user.Balance} ${Crypto}`
                    : `موجودی شما : 0 ${Crypto}`;
                if (user.walletAddress.length && user.Balance >= 1800 && user.phoneNumber && !user.wantToRecive) {
                    const message = ` با کلیک روی دکمه زیر به شما ${user.Balance}${Crypto} ارسال خواهد شد`;
                    if(user.ticket){
                        editMessageWithOptions(chatId ,messageId ,message ,{
                            reply_markup: [
                                createInlineButtons([
                                    { text: "گرفتن تیکت", callback_data: "withdraw_ticket" },
                                    { text: "برداشت رمزارز", callback_data: "withdraw_crypto" },
                                    { text: "بازگشت" ,callback_data: "back"}
                                ])
                            ]
                        })
                    }
                    editMessageWithOptions(chatId, messageId ,message, {
                        reply_markup: {
                            inline_keyboard: [
                                createInlineButtons([
                                    { text: "برداشت رمزارز", callback_data: "withdraw_crypto" },
                                    { text: "بازگشت" ,callback_data: "back"}
                                ])
                            ],
                        },
                    });
                }else{
                    editMessageWithOptions(chatId ,messageId ,walletInfo);
                }
            } else {
                sendMessageWithOptions(chatId, "User not found.");
            }
            break;

        case "website":
            editMessageWithOptions(
                chatId,
                messageId,
                "برای گرفتن اطلاعات بیشتر وارد لینک زیر شوید",
                {
                    reply_markup: {
                        inline_keyboard: [
                            createInlineButtons([{ text: "Ryoku Website", url: "http://5.75.204.122:8080" }]),
                            createBackButton()
                        ],
                    },
                }
            );
            break;
        
        case "walletAddress":
            if(user.walletAddress.length){
                editMessageWithOptions(
                    chatId,
                    messageId,
                    `آدرس کیف پول شما ${user.walletAddress} است \n آیا مایل به تعویض آن هستید`,
                    {
                        reply_markup: {
                            inline_keyboard: [
                                createInlineButtons([
                                    {text: "بله" , callback_data: "yes"} ,
                                    {text: "خیر" , callback_data: "no"}
                                ])
                            ],
                        },
                    }
                );
            }else{
                handleYesOption(chatId ,userId)
            }
            break;

        case "yes":
            handleYesOption(chatId ,userId)
            break;

        case "no":
            editMessageWithOptions(chatId, messageId, 'Ryoku BOT', startOptions)
            break;

        case "withdraw_crypto":
            await User.findOneAndUpdate({userId} ,{wantToRecive: true} ,{new: true})
            editMessageWithOptions(chatId ,messageId ,"درخواست ارسال شد" );
            break;

        case "withdraw_ticket":
            await User.findOneAndUpdate({userId} ,{wantToRecive: true ,ticket: true} ,{new: true})
            editMessageWithOptions(chatId ,messageId ,"درخواست ارسال شد" );
            break;

        case "add_channel":
            sendMessageWithOptions(
                chatId,
                "لطفا نام کانال را با @ اولش ارسال کنید"
            );
            bot.once("message", async (response) => {
                if (response.text.startsWith("@")) {
                    const channelName = response.text.trim();
                    try {
                        let channelDoc = await Channel.findOne({});
            
                        if (!channelDoc) {
                            channelDoc = new Channel({ name: [channelName] });
                            await channelDoc.save();
                            sendMessageWithOptions(chatId, `کانال جدید به نام ${channelName} اضافه شد`);
                        } else {
                            if (!channelDoc.name.includes(channelName)) {
                                channelDoc.name.push(channelName);
                                await channelDoc.save();
                                sendMessageWithOptions(chatId, `کانال جدید به نام ${channelName} اضافه شد`);
                            } else {
                                sendMessageWithOptions(chatId, `این کانال از قبل وجود دارد`);
                            }
                        }
                    } catch (error) {
                        sendMessageWithOptions(chatId, "An error occurred while adding the channel.");
                    }
                } else {
                    sendMessageWithOptions(chatId, "لطفا کانال یا چنل درست وارد کنید با @ در ابتدای اسم");
                }
            });
            break;

        case "delete_channel":
            sendMessageWithOptions(
                chatId,
                "لطفا نام کانال را با @ اولش ارسال کنید"
            );
            bot.once("message", async (response) => {
                if (response.text.startsWith("@")) {
                    const channelName = response.text.trim();
                    try {
                        let channelDoc = await Channel.findOne({});
            
                        if (!channelDoc) {
                            sendMessageWithOptions(chatId, "در سیستم کانالی وجود ندارد");
                            return;
                        }
            
                        if (channelDoc.name.includes(channelName)) {
                            channelDoc.name = channelDoc.name.filter(name => name !== channelName);
                            await channelDoc.save();
                            sendMessageWithOptions(chatId, `کانال به نام ${channelName} حذف شد`);
                        } else {
                            sendMessageWithOptions(chatId, `کانالی با نام ${channelName} وجود ندارد`);
                        }
                    } catch (error) {
                        sendMessageWithOptions(chatId, "An error occurred while deleting the channel.");
                    }
                } else {
                    sendMessageWithOptions(chatId, "لطفا کانال یا چنل درست وارد کنید با @ در ابتدای اسم");
                }
            });
            break;

        case "change_admin":
            sendMessageWithOptions(chatId, "لطفاً شناسه کاربری (userId) و وضعیت جدید ادمین (true یا false) را ارسال کنید. فرمت: userId status");

            bot.once("message", async (response) => {
                const [targetUserId, newStatus] = response.text.split(' ');

                if (!targetUserId || !newStatus) {
                    sendMessageWithOptions(chatId, "فرمت اشتباه است. لطفاً شناسه کاربری و وضعیت (true یا false) را ارسال کنید.");
                    return;
                }

                const validStatuses = ['true', 'false'];
                if (!validStatuses.includes(newStatus.toLowerCase())) {
                    sendMessageWithOptions(chatId, "وضعیت اشتباه است. لطفاً وضعیت را به صورت 'true' یا 'false' وارد کنید.");
                    return;
                }

                try {
                    const targetUser = await User.findOne({ userId: targetUserId });

                    if (!targetUser) {
                        sendMessageWithOptions(chatId, "کاربر یافت نشد.");
                        return;
                    }

                    targetUser.isAdmin = newStatus.toLowerCase() === 'true';
                    await targetUser.save();
                    sendMessageWithOptions(chatId, `وضعیت ادمین کاربر به ${newStatus.toLowerCase()} تغییر کرد.`);

                } catch (error) {
                    sendMessageWithOptions(chatId, "An error occurred while updating the user status.");
                }
            });
            break;

        case "transactions":
            const allUser = await User.find({wantToRecive: true})
            if (allUser.length === 0) {
                sendMessageWithOptions(chatId, "هیچ کاربری درخواست دریافت رمز ارز نکرده است.");
                return;
            }
            editMessageWithOptions(
                chatId,
                messageId,
                "افرادی که مایل به دریافت رمز ارز هستند",
                {
                    reply_markup: {
                        inline_keyboard: [
                            createInlineButtons(
                                allUser.map((user) => ({
                                    text: `🔸userId: ${user.userId}🔸`,
                                    callback_data: `user_${user.userId}`
                                }))
                            ),
                            createBackButton()
                        ],
                    },
                }
            );
            break;

        case "walletAddress":
            const user1 = await User.findOne({ userId }) 
            if(user1.walletAddress.length){
                editMessageWithOptions(
                    chatId,
                    messageId,
                    `آدرس کیف پول شما ${user1.walletAddress} است \n آیا مایل به تعویض آن هستید`,
                    {
                        reply_markup: {
                            inline_keyboard: [
                                createInlineButtons([
                                    {text: "بله" , callback_data: "yes"} ,
                                    {text: "خیر" , callback_data: "no"}
                                ])
                            ],
                        },
                    }
                );
            }else{
                handleYesOption(chatId ,userId)
            }
            break;

            default:
                if (data.startsWith("user_")) {
                    const targetUserId = data.split("_")[1];
                    const targetUser = await User.findOne({ userId: targetUserId });
    
                    if (!targetUser) {
                        sendMessageWithOptions(chatId, "کاربر یافت نشد.");
                        return;
                    }
    
                    const userInfo = `🔹 شناسه کاربری: ${targetUser.userId} \n🔸 موجودی: ${targetUser.Balance} ${Crypto} \n🔹 آدرس کیف پول: ${targetUser.walletAddress} \n🔸تلفن همراه: ${targetUser.phoneNumber} \n🔹 وضعیت بلیت لاتاری: ${targetUser.ticket}`;
    
                    editMessageWithOptions(chatId ,messageId ,userInfo ,{
                        reply_markup: {
                            inline_keyboard: [
                                createInlineButtons([
                                    {text: 'پرداخت انجام شد' ,callback_data: `paid_${userId}`},
                                    { text: "بازگشت" ,callback_data: "back"}
                                ])
                            ]
                        }
                    });
                } else if (data.startsWith("paid_")) {
                    const paidUserId = data.split("_")[1];
                    await User.findOneAndUpdate({ userId: paidUserId }, { wantToRecive: false ,Balance: 0 ,ticket: false}, { new: true });
    
                    editMessageWithOptions(chatId ,messageId ,`وضعیت پرداخت برای کاربر با شناسه ${paidUserId} ثبت شد.`);
                } else {
                    sendMessageWithOptions(chatId, "Unknown option.");
                }
    }

    bot.answerCallbackQuery(callbackQuery.id);
});