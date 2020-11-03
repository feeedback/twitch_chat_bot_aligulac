# Twitch чат-бот для использования сервиса Aligulac
_*статистика и предсказание исхода противостояний киберспортсменов по Starcraft 2_

## Use
Type in Twitch chat on stream by Starcraft 2:
_(пока только определенные каналы, from channels list)_
```
!alig[ulac] name1 name2 (или !алиг[улак] name1 name2)
```

Получите ответ:
```
@username [p1Name] [%ChanceWin1] vs [%ChanceWin2] [p2Name] | [p1FOR] form vs opp. race [p2FOR] | [p1HEO] history vs each other [p2HEO]
```
## Roadmap

 - [ ] Поиск твич-каналов, фильтрация активных стримов (подключение к новым?)
- [x] ~~Добавление твич-каналов во время работы бота, спец. командой из чата только админа (меня)~~
- [x] ~~Писать инфу о боте при джойне на канал~~
- [ ] Периодически (раз в 24 часа) отправлять инфу о боте во все стримы?
- [x] ~~Кэш со временем жизни запроса и пропуском ошибок запросов~~ 
- [ ] Кэш с постоянным хранением в на облаке или диске



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
