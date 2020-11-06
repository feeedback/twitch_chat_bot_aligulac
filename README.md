# Twitch чат-бот для использования сервиса Aligulac

_\*статистика и предсказание исхода противостояний киберспортсменов по Starcraft 2_

## Use

Type in Twitch chat on stream by Starcraft 2: _(пока только определенные каналы, from channels list)_

`!alig[ulac] name1 name2 (или !алиг[улак] name1 name2)`

Получите ответ:

`@username [p1Name] [%ChanceWin1] vs [%ChanceWin2] [p2Name] | [p1FOR] form vs opp. race [p2FOR] | [p1HEO] history vs each other [p2HEO]`

## Roadmap

-   [ ] Добавить команду с одним ником игрока и ответом в виде его статистики
        `(Cascade) SKillous |P| 19 y.o. | #29 World, #12 Non-Korean, #1 Russia | matches 1399 | earned $19010 | form vP 57% vT 55% vZ 72%`
-   [ ] Поиск твич-каналов, фильтрация активных стримов (подключение к новым?)
-   [x] Пофиксить, сделать разделение интервалов ответов в чат по каналам
-   [x] Ограничение на интервал запросов к Aligulac и интервал ответов в чат
-   [x] Разделить кэш, на кэш запросов id игрока и запросов к результату противостояния
-   [x] Периодически записывать его в базу данных в облаке
-   [x] Не отвечать если ники игроков совпадают. Если ники поменянные местами есть в кэше - отдать их
-   [x] Добавление твич-каналов во время работы бота, спец. командой из чата только админа (меня)
-   [x] Писать инфу о боте при джойне на канал
-   [x] Интервал который ограничивает отправку сообщений о боте при джойне, по времени последнего сообщения по каналам отдельно
-   [x] Кэш со временем жизни запроса и пропуском ошибок запросов
-   [x] Понимает команду в любом месте в сообщении
-   [ ] Периодически отправлять инфу о боте на каналы? Только очень редко (~раз в неделю). Т.к. уже 3 бана есть

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
