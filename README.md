# Sorsjegy szimulátor

Magyar nyelvű sorsjegybeállító és profit/veszteség szimulátor.

Az `index.html` közvetlenül megnyitható böngészőben, telepítés nélkül.
A mentés az adott böngészőben tárolódik.

## Számítás

A nyeremény esélye = felső nyerési esély / 100 × nyereménysor esélye / 100.
A fennmaradó esély nulla kifizetést jelent. A százalékokat nem normalizáljuk.

Várható kifizetés = darabszám × az összeg × esély szorzatok összege.
Nettó eredmény = darabszám × darabár − kifizetés.
Profit = max(0, nettó eredmény); veszteség = max(0, −nettó eredmény).

A szimuláció minden jegyhez külön véletlenszerű eredményt generál.

## GitHub Pages

A repóban: Settings → Pages → Deploy from a branch → main → / (root) → Save.
A Pages felület által megadott webcímet elküldve bárki megnyithatja az alkalmazást.
