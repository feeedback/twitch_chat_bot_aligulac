# twitch_chat_bot_aligulac

**Twitch чат-бот для использования сервиса Aligulac**
_(статистика и предсказание исхода противостояний киберспортсменов по Starcraft 2)_

## Use

type in Twitch chat on stream by Starcraft 2:
_(пока только определенные каналы, from channels list)_

```
!alig[ulac] name1 name2 (или !алиг[улак] name1 name2)
```

Получите ответ:

```
@username [p1Name] [%ChanceWin1] vs [%ChanceWin2] [p2Name] | [p1FOR] form vs opp. race [p2FOR] | [p1HEO] history vs each other [p2HEO]
```

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
