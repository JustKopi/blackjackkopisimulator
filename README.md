# Sorsjegy tervező

Élő oldal: https://justkopi.github.io/blackjackkopisimulator/

100 jegyes csomagok tervezése, egész darabszámokkal és összegekkel.
Az index.html közvetlenül megnyitható; nincs szükség telepítésre.

- Saját beállítások: nyereményösszeg és darabszám 100 jegyből, jegyár, eladás.
- Minta: a beküldött Bronz 218 kép 6 000 000 jegyes terve és egészre osztott 100 jegyes közelítése.
- Játékba másolható értékek: százalékok, nem nyerő esély, JSON másolás és letöltés.

## Matematika

A 100 jegyes csomagban 1 darab = 1% esély. A maradék jegy nem nyer.
A mintát a legnagyobb maradékok módszere arányosítja, a nem nyerő jegyeket is beleértve.
A ritka nyeremények így kieshetnek; az eredeti kifizetési arány nem marad meg pontosan.
A mintában a forintos összegek változatlan számértékkel, játékbeli dollárként tölthetők be;
ez nem devizaváltás. Az eredeti jegyár nem szerepel a beküldött képen.

A kerekített minta: 33 nyerő és 67 nem nyerő jegy, 65 000 teljes kifizetés.
1100 játékbeli dolláros jegyárnál a teljes csomag profitja 45 000 dollár.

Fix csomag módban Fisher–Yates keverés után visszatevés nélkül húzunk.
Új csomag csak 100 húzás után készül. Egy teljes csomag kifizetése mindig a terv szerinti.
Külön húzás módban a darabszámok közvetlen százalékos esélyek; 100 húzás eredménye változhat.

Bevétel = eladott darab × jegyár.
Tervezett kifizetés = eladott darab / 100 × csomagkifizetés.
Profit = max(0, bevétel − kifizetés); veszteség = max(0, kifizetés − bevétel).
A részcsomagok várható pénzértékeit csak a megjelenítés kerekíti egész dollárra.

A játékbeli százalékok a felső nyerési esély 100%-os beállítását feltételezik.
Ha a játék súlyokat normalizál, külön nulla kifizetésű sort igényel.
A JSON szemléltető terv, nem egy ismeretlen játékhoz ellenőrzött konfiguráció.

## Ellenőrzés

`npm install` után `npm test` ellenőrzi a matematikát és a felület működését.
A függőségek kizárólag fejlesztéshez és teszteléshez kellenek; az oldal továbbra is statikus.
