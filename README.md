[![Maintainability](https://api.codeclimate.com/v1/badges/f263ed131289f97d2a63/maintainability)](https://codeclimate.com/github/feeedback/twitch_chat_bot_aligulac/maintainability)
[![wakatime](https://wakatime.com/badge/github/feeedback/twitch_chat_bot_aligulac.svg)](https://wakatime.com/badge/github/feeedback/twitch_chat_bot_aligulac)

# Twitch чат-бот для использования сервиса Aligulac

_\*статистика и предсказание исхода противостояний киберспортсменов по Starcraft 2_

## Use

**Type in Twitch chat on stream by Starcraft 2:** _(пока только определенные каналы, from channels list)_  
Player info: `!alig[ulac] name`  
Prediction: `!alig[ulac] name1 name2 (или !алиг[улак] name1 name2)`

**Получите ответ:**  
Player info: `@user (Cascade) SKillous [P] 19 y.o. | #29 World, #12 Non-KR, #1 RU | matches 1399 | earned $19k | form vP·57% vT·55% vZ·72%`  
Prediction: `@user SKillous 49% vs 51% Hellraiser | 58% form vs opp. race 71% | 36% history vs each other 64%`

## Roadmap

- [ ] Поиск твич-каналов, фильтрация активных стримов (подключение к новым?)
- [x] Новая команда, если передать !alig один ник, то возвращать статистику игрока
- [x] Разделение интервалов ответов в чат по каналам
- [x] Ограничение на интервал запросов к Aligulac и интервал ответов в чат
- [x] Разделение кэша, на кэш запросов id игрока, запросов к результату противостояния, и кэш статистики игрока
- [x] Периодически записывать кэш в базу данных в облаке
- [x] Не отвечать если ники игроков совпадают. Если ники поменянные местами есть в кэше - отдавать их
- [x] Удаление твич-канала из списка бота во время работы бота, спец. командой из чата только админа (меня)
- [x] Добавление твич-каналов в список бота, спец. командой из чата только админа (меня)
- [x] Писать инфу о боте (о том как его использовать) при джойне на канал
- [x] Ограничение на частоту отправки информ. сообщений о боте при джойне, по времени посл. сообщения по каналам отдельно
- [x] Кэш со временем жизни запроса и пропуском ошибок запросов
- [x] Понимает команду в любом месте в сообщении

## Setup settings

Modify

```
bot/settings.js

channels list: bot/settings.js clientTmiSettings.channels
```

## Run

```
npm start
or
node index.js
```
