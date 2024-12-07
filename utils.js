const { isValidTronAddress ,isValidEthereumAddress ,isValidBitcoinAddress ,isValidDogecoinAddress ,isValidTonAddress} = require('./validationWallet')
const bot = require('./app')
const User = require("./models/userModel")
const Channel = require("./models/channelsModel")

const createBackButton = () => [{ text: 'بازگشت' ,callback_data: 'back' }]

const sendMessageWithOptions = (chatId ,text ,options) => {
    const defaultOptions = { parse_mode: 'markdown' }
    bot.sendMessage(chatId ,text ,{ ...defaultOptions ,...options })
}

const createInlineButtons = (buttons) => 
    buttons.map((button) => ({
      text: button.text,
      callback_data: button.callback_data || '',
      url: typeof button.url === 'string' ? button.url : undefined
    })
);

const backbutton = {
    reply_markup: {
        inline_keyboard: [
            createInlineButtons([
                { text: "بازگشت", callback_data: "back" },
            ]),
        ],
    },
}

const editMessageWithOptions = (chatId, messageId , text, options = backbutton) => {
    const defaultOptions = { parse_mode: "markdown" };
    bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      ...defaultOptions,
      ...options,
    });
};

const createInlineKeyboard = (buttons, buttonsPerRow = 2) => {
    const keyboard = [];
    for (let i = 0; i < buttons.length; i += buttonsPerRow) {
        keyboard.push(buttons.slice(i, i + buttonsPerRow));
    }
    return keyboard;
};

const addCryptoToWallet = async (userId, amount) => {
    const user = await User.findOne({ userId });
    if (!user) return;

    user.Balance += amount;
    await user.save();
};
  
const handleReferral = async (referrerId, userId) => {
    if (userId === referrerId) return;

    const referrer = await User.findOne({ userId: referrerId });
    const user = await User.findOne({ userId });

    if (!referrer || !user) return;

    if (referrer.referrals.includes(userId)) {
        sendMessageWithOptions(user.chatId, "شما نمیتوانید معرف خود را معرفی کنید");
        return;
    }

    referrer.referrals.push(userId);
    await referrer.save();

    if (referrer.referrals.length > 0) {
        addCryptoToWallet(referrerId, 90);
        if (referrer.chatId) {
            sendMessageWithOptions(referrer.chatId, `تبریک میگم !شما 90 ${Crypto} دریافت کردید`);
        }
    }

    user.referredBy = referrerId
    await user.save();
};

const checkUserMembership = async (userId ,chatId) => {
    try {
        const channelDoc = await Channel.findOne();
        
        if (!channelDoc || !channelDoc.name || channelDoc.name.length === 0) {
            return false;
        }

        const results = await Promise.all(
            channelDoc.name.map(async (channelName) => {
                try {
                    const member = await bot.getChatMember(channelName, userId);
                    return (
                        member.status === "member" ||
                        member.status === "administrator" ||
                        member.status === "creator"
                    );
                } catch (channelError) {
                    sendMessageWithOptions(chatId, `Error checking channel ${channelName}:`, channelError);
                    return false;
                }
            })
        );

        return results.every((isMember) => isMember);
    } catch (error) {
        return false;
    }
};

async function handleYesOption(chatId, userId) {
    sendMessageWithOptions(chatId, "لطفا ادرس کیف پول خود را وارد کنید");
    bot.once("message", async (response) => {
        if (response.text) {
            const walletAddress = response.text.trim();
            try {
                if (
                    isValidTronAddress(walletAddress) ||
                    isValidBitcoinAddress(walletAddress) ||
                    isValidDogecoinAddress(walletAddress) ||
                    isValidEthereumAddress(walletAddress) ||
                    isValidTonAddress(walletAddress)
                ) {
                    let user = await User.findOneAndUpdate({ userId }, { walletAddress }, { new: true });
                    await user.save();
                    sendMessageWithOptions(response.chat.id, `ادرس کیف پول شما تغییر کرد \n ${walletAddress}`);
                } else {
                    sendMessageWithOptions(response.chat.id, "ادرس کیف پول اشتباه است");
                }
            } catch (error) {
                sendMessageWithOptions(response.chat.id, "خطایی رخ داد، لطفاً دوباره تلاش کنید.");
            }
        }
    });
}

module.exports = {
    createInlineButtons,
    createInlineKeyboard,
    handleReferral,
    handleYesOption,
    checkUserMembership,
    createBackButton,
    sendMessageWithOptions,
    editMessageWithOptions
}