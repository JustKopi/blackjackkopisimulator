# Sorsjegy szimulátor

A saját fülön a felső nyerési esély és minden nyeremény százaléka szerkeszthető, tört értékekkel is. A felső százalék megszorozza a sorok esélyét; a maradék nem nyer. Minden jegy független húzás.

A Bronz 218 külön fülén a megadott IRL nyereményeloszlás pontos esélyei szerepelnek: nyeremény darabszáma / 6 000 000 × 100%. Nincs egész jegyekre kerekítés és elfogyó készlet. A nyeremények változatlan számértékkel, játékbeli dollárban szerepelnek. A jegyár szerkeszthető, mert az eredeti ár nincs megadva. A szimuláció ismételhető; egy futtatás legfeljebb egymillió jegy.

Az eredeti saját beállításokat a lottery-settings böngészőtárból visszatölti. A játékba másolható fül a saját aktuális százalékokat exportálja.

Az index.html közvetlenül megnyitható. Ellenőrzés: npm test. Formázás: npm run format.

A játékbeli tervező az eredeti nyereményskálát logaritmikusan a jegyár és a legfeljebb 50 000 $ főnyeremény közé alakítja. A forrás darabszámai adják a kezdő súlyokat. A főnyeremény esélye külön beállítható; a többi súlyt numerikusan igazítja úgy, hogy a megadott találati arány és kifizetési keret teljesüljön. A ház hosszú távú célzott maradéka legfeljebb 60%. Az alapértékek: 1 100 $ jegyár, 50 000 $ maximum, 60% házmaradék, 35% találat, 1 / 10 000 főnyeremény.

A jegyár visszanyerését és a jegyár feletti nyereményt külön mutatja. A profitcél a nyereményeken kívüli költségeket nem tartalmazza. A szórás az eredmény ingadozását mutatja, nem garantált tartomány. A matematikai terv nem becsüli a játékosok vásárlási hajlandóságát. A saját szerkesztőbe betöltött terv tovább módosítható; a 60%-os korlát a tervezőre vonatkozik.
