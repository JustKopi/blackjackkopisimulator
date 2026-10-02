# Sorsjegy szimulátor

A saját fülön a felső nyerési esély és minden nyeremény százaléka szerkeszthető, tört értékekkel is. A felső százalék megszorozza a sorok esélyét; a maradék nem nyer. Minden jegy független húzás.

A Bronz 218 külön fülén a megadott IRL nyereményeloszlás pontos esélyei szerepelnek: nyeremény darabszáma / 6 000 000 × 100%. Nincs egész jegyekre kerekítés és elfogyó készlet. A nyeremények változatlan számértékkel, játékbeli dollárban szerepelnek. A jegyár szerkeszthető, mert az eredeti ár nincs megadva. A szimuláció ismételhető; egy futtatás legfeljebb egymillió jegy.

Az eredeti saját beállításokat a lottery-settings böngészőtárból visszatölti. A játékba másolható fül a saját aktuális százalékokat exportálja.

Az index.html közvetlenül megnyitható. Ellenőrzés: npm test. Formázás: npm run format.
