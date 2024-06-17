from aiogram import Bot, Dispatcher, executor, types

API_TOKEN = ''
bot = Bot(token=API_TOKEN)
dp = Dispatcher(bot)


@dp.message_handler(commands=['start'])
async def start(message: types.Message):
    chat_id = message.chat.id

    await message.answer('Добро пожаловать!')
    await message.answer(
        f'Введите этот код при регистрации в поле "Chat ID": {chat_id}\nЕсли Вы этого не сделаете, то не сможете '
        f'получать уведомления!')


async def send_notification(user_id, task_text):
    message = f'Проверьте Ваши задачи: {task_text}'
    await bot.send_message(user_id, message)


if __name__ == '__main__':
    executor.start_polling(dp)
