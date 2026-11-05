# Greek strings to review

Drafted by Claude (an AI), **not yet reviewed by a Greek speaker**. Please check wording, tone (informal "you"), grammar and accents, and that every string fits on a phone. Edit `web/lib/i18n/el.ts`; then run `npm run greek-review` to refresh this file.

Notes for the reviewer:
- Plant names come from our data, not from this file. Greek common names exist for only some plants (from GBIF); we never invent them. Names written in Latin letters are not shown as Greek.
- `{n}`, `{cat}`, `{level}` are placeholders filled by the app.
- Terms chosen on purpose: *Φυτά* (Plants), *Φυτρώνει μόνο στην Ελλάδα* (Only grows in Greece), *Απειλούμενο* (Threatened), *Δεν έχει αξιολογηθεί ακόμη* (Not assessed yet), *Πρωτότυπος βαθμός* (Prototype score).

218 strings.

| Key | English | Greek (to review) |
| --- | --- | --- |
| `appName` | Chloris | Chloris ⚠ same as English |
| `tagline` | Where Greece's medicinal plants grow, which are at risk, and how we keep them. | Πού φυτρώνουν τα φαρμακευτικά φυτά της Ελλάδας, ποια κινδυνεύουν και πώς τα προστατεύουμε. |
| `loading` | Loading… | Φόρτωση… |
| `offlineBanner` | Offline — identification will run when you're back online. | Εκτός σύνδεσης — η αναγνώριση θα γίνει όταν επανέλθει το δίκτυο. |
| `language` | Language | Γλώσσα |
| `nav.label` | Main navigation | Κύρια πλοήγηση |
| `nav.map` | Map | Χάρτης |
| `nav.scan` | Scan | Σάρωση |
| `nav.priorities` | Plants | Φυτά |
| `nav.search` | Search | Αναζήτηση |
| `pages.map.title` | Map | Χάρτης |
| `pages.map.placeholder` | The map of Greece's medicinal plants arrives in Phase 3. | Ο χάρτης των φαρμακευτικών φυτών της Ελλάδας έρχεται στη Φάση 3. |
| `pages.scan.title` | Scan a plant | Σάρωση φυτού |
| `pages.scan.placeholder` | Photo identification arrives in Phase 4. | Η αναγνώριση από φωτογραφία έρχεται στη Φάση 4. |
| `pages.priorities.title` | Plants | Φυτά |
| `pages.priorities.placeholder` | Species ranked by risk arrive in Phase 3. | Τα είδη κατά σειρά κινδύνου έρχονται στη Φάση 3. |
| `pages.search.title` | Search | Αναζήτηση |
| `pages.search.placeholder` | Search by Greek, English or scientific name arrives in Phase 3. | Η αναζήτηση με ελληνικό, αγγλικό ή επιστημονικό όνομα έρχεται στη Φάση 3. |
| `pages.sightings.title` | My sightings | Οι παρατηρήσεις μου |
| `pages.sightings.placeholder` | Your queued and synced sightings arrive in Phase 4. | Οι παρατηρήσεις σου έρχονται στη Φάση 4. |
| `pages.about.title` | About the data | Σχετικά με τα δεδομένα |
| `pages.about.placeholder` | Sources, method, scoring and limitations arrive in Phase 3. | Πηγές, μέθοδος, βαθμολόγηση και περιορισμοί έρχονται στη Φάση 3. |
| `pages.species.title` | Species card | Καρτέλα είδους |
| `pages.species.placeholder` | The specimen card arrives in Phase 3. | Η καρτέλα δείγματος έρχεται στη Φάση 3. |
| `pages.home.title` | Chloris | Chloris ⚠ same as English |
| `pages.home.cta` | Open Chloris | Άνοιγμα Chloris |
| `iucn.CR` | Critically endangered | Κρισίμως κινδυνεύον |
| `iucn.EN` | Endangered | Κινδυνεύον |
| `iucn.VU` | Vulnerable | Τρωτό |
| `iucn.NT` | Near threatened | Σχεδόν απειλούμενο |
| `iucn.LC` | Least concern | Ελάχιστης ανησυχίας |
| `iucn.DD` | Too little data (IUCN) | Ανεπαρκή δεδομένα (IUCN) |
| `iucn.NE` | Not assessed yet | Δεν έχει αξιολογηθεί ακόμη |
| `iucn.threatened` | Threatened | Απειλούμενο |
| `iucn.label` | IUCN Red List | Κόκκινος Κατάλογος IUCN |
| `iucn.note` | Not assessed yet means the IUCN has not looked at this plant. It does not mean the plant is safe. | Το «Δεν έχει αξιολογηθεί ακόμη» σημαίνει ότι η IUCN δεν έχει εξετάσει αυτό το φυτό. Δεν σημαίνει ότι το φυτό είναι ασφαλές. |
| `risk.low` | Low | Χαμηλός |
| `risk.moderate` | Moderate | Μέτριος |
| `risk.high` | High | Υψηλός |
| `risk.critical` | Critical | Κρίσιμος |
| `risk.label` | Risk | Κίνδυνος |
| `risk.scoreLabel` | Prototype score | Πρωτότυπος βαθμός |
| `risk.outOf` | out of 100 | στα 100 |
| `verdict.protect` | Protect it | Προστάτεψέ το |
| `verdict.care` | Handle with care | Χειρίσου το με προσοχή |
| `verdict.notThreatened` | Not known to be threatened | Δεν είναι γνωστό ως απειλούμενο |
| `verdict.nodata` | Not enough data yet | Δεν υπάρχουν ακόμη αρκετά δεδομένα |
| `verdict.label` | Our verdict | Η εκτίμησή μας |
| `verdict.reasonProtectIucn` | The IUCN lists it as threatened ({cat}). | Η IUCN το καταγράφει ως απειλούμενο ({cat}). |
| `verdict.reasonProtectScore` | Its prototype risk score is {level}: it is rare, declining or poorly protected. | Ο πρωτότυπος βαθμός κινδύνου του είναι {level}: είναι σπάνιο, φθίνει ή προστατεύεται ελλιπώς. |
| `verdict.reasonCareModerate` | Its prototype risk score is moderate. | Ο πρωτότυπος βαθμός κινδύνου του είναι μέτριος. |
| `verdict.reasonCareEndemic` | It only grows in Greece, so it needs extra care. | Φυτρώνει μόνο στην Ελλάδα, γι' αυτό χρειάζεται ιδιαίτερη προσοχή. |
| `verdict.reasonNotThreatened` | Nothing in our data points to a threat. This does not mean it is safe to pick. | Τίποτα στα δεδομένα μας δεν δείχνει απειλή. Αυτό δεν σημαίνει ότι είναι ασφαλές να το κόψεις. |
| `verdict.reasonNodata` | Only {n} records so far, too few to judge. | Μόνο {n} καταγραφές μέχρι τώρα, πολύ λίγες για κρίση. |
| `verdict.reasonNodataZero` | No records yet, so we cannot judge. | Δεν υπάρχουν ακόμη καταγραφές, οπότε δεν μπορούμε να κρίνουμε. |
| `verdict.notAdvice` | A verdict is not advice to pick or use a plant. | Η εκτίμηση αυτή δεν αποτελεί συμβουλή για συλλογή ή χρήση του φυτού. |
| `harvest.safe` | Safe to harvest sustainably | Ασφαλής βιώσιμη συλλογή |
| `harvest.careful` | Harvest with care | Συλλογή με προσοχή |
| `harvest.do-not-harvest` | Do not harvest | Μη συλλέγετε |
| `harvest.unknown` | Harvest advice not reviewed yet | Οι οδηγίες συλλογής δεν έχουν ελεγχθεί ακόμη |
| `harvest.substitutes` | Use instead | Χρησιμοποιήστε αντί αυτού |
| `parts.noData` | Not enough data | Ανεπαρκή δεδομένα |
| `parts.points` | points | βαθμοί |
| `parts.iucn.name` | Threatened-species list (IUCN) | Κατάλογος απειλούμενων ειδών (IUCN) |
| `parts.iucn.desc` | Category from the IUCN Red List, via GBIF. Plants not assessed yet get a small placeholder weight. | Κατηγορία από τον Κόκκινο Κατάλογο της IUCN, μέσω GBIF. Τα φυτά που δεν έχουν αξιολογηθεί ακόμη παίρνουν μικρό προσωρινό βάρος. |
| `parts.endemic.name` | Only grows in Greece | Φυτρώνει μόνο στην Ελλάδα |
| `parts.endemic.desc` | Native only in Greece (mainland, Crete, East Aegean). | Αυτόχθονο μόνο στην Ελλάδα (ηπειρωτική, Κρήτη, Ανατολικό Αιγαίο). |
| `parts.rarity.name` | Rarity | Σπανιότητα |
| `parts.rarity.desc` | Fewer occupied 10 km cells means a higher score. | Λιγότερα κελιά 10 χλμ σημαίνει υψηλότερο βαθμό. |
| `parts.decline.name` | Decline | Μείωση |
| `parts.decline.desc` | Share of all plant records, now versus 1950–1999. | Μερίδιο όλων των καταγραφών φυτών, σήμερα σε σχέση με το 1950–1999. |
| `parts.unprotected.name` | Outside protected areas | Εκτός προστατευόμενων περιοχών |
| `parts.unprotected.desc` | Share of records outside Natura 2000. | Μερίδιο καταγραφών εκτός Natura 2000. |
| `parts.fire.name` | Burnt areas | Καμένες εκτάσεις |
| `parts.fire.desc` | Share of records inside recently burnt areas. | Μερίδιο καταγραφών σε πρόσφατα καμένες περιοχές. |
| `parts.unprotectedMissing` | Natura 2000 data not joined yet | Τα δεδομένα Natura 2000 δεν έχουν συνδεθεί ακόμη |
| `parts.fireMissing` | No burnt-area data loaded | Δεν έχουν φορτωθεί δεδομένα καμένων εκτάσεων |
| `species.notFound` | We could not find this plant. | Δεν βρήκαμε αυτό το φυτό. |
| `species.back` | Back to plants | Πίσω στα φυτά |
| `species.protoScore` | Prototype score | Πρωτότυπος βαθμός |
| `species.protoScoreOf` | {n} out of 100. A prototype: the weights are still being reviewed. | {n} στα 100. Πρωτότυπο: τα βάρη εξακολουθούν να ελέγχονται. |
| `species.catalogue` | Catalogue | Κατάλογος |
| `species.family` | Family | Οικογένεια |
| `species.records` | Records | Καταγραφές |
| `species.cells` | 10 km cells | Κελιά 10 χλμ |
| `species.years` | Years | Έτη |
| `species.endemic` | Only grows in Greece | Φυτρώνει μόνο στην Ελλάδα |
| `species.riskTitle` | How the prototype score is made | Πώς προκύπτει ο πρωτότυπος βαθμός |
| `species.mapTitle` | Where it was recorded | Πού καταγράφηκε |
| `species.openMap` | Open on the map | Άνοιγμα στον χάρτη |
| `species.then` | Then | Τότε |
| `species.now` | Now | Τώρα |
| `species.thenHelp` | 1950–1999 | 1950–1999 ⚠ same as English |
| `species.nowHelp` | 2000 onwards | 2000 και μετά |
| `species.gone` | present then, not now (dashed outline) | υπήρχε τότε, όχι τώρα (διακεκομμένο περίγραμμα) |
| `species.noRecords` | No GBIF records for this species, so range, rarity and decline are not available. | Δεν υπάρχουν καταγραφές GBIF γι' αυτό το είδος, άρα δεν διατίθενται εξάπλωση, σπανιότητα και μείωση. |
| `species.usesTitle` | Documented uses | Καταγεγραμμένες χρήσεις |
| `species.usesNotReviewed` | Recorded medicinal use (Kew WCUPS). Uses and harvest guidance not reviewed yet. | Καταγεγραμμένη φαρμακευτική χρήση (Kew WCUPS). Οι χρήσεις και οι οδηγίες συλλογής δεν έχουν ελεγχθεί ακόμη. |
| `species.ema` | EMA herbal monograph | Μονογραφία βοτάνου EMA |
| `species.emaStatus.well-established` | Well-established use | Τεκμηριωμένη χρήση |
| `species.emaStatus.traditional` | Traditional use | Παραδοσιακή χρήση |
| `species.emaStatus.none` | No monograph | Χωρίς μονογραφία |
| `species.emaStatus.unknown` | Not reviewed yet | Δεν έχει ελεγχθεί ακόμη |
| `species.powo` | Plants of the World Online | Plants of the World Online ⚠ same as English |
| `species.sources` | Sources: Kew WCVP and WCUPS, GBIF (records and IUCN category). | Πηγές: Kew WCVP και WCUPS, GBIF (καταγραφές και κατηγορία IUCN). |
| `species.enTag` | EN | EN ⚠ same as English |
| `species.dataNote` | Data note | Σημείωση δεδομένων |
| `species.review` | Under review | Υπό έλεγχο |
| `species.flags.gbif_synonym_match` | GBIF treats this name as a synonym of another species, so its records follow GBIF's species and may not match Kew's. | Το GBIF θεωρεί αυτό το όνομα συνώνυμο άλλου είδους, οπότε οι καταγραφές ακολουθούν το είδος του GBIF και μπορεί να διαφέρουν από του Kew. |
| `species.flags.gbif_shared_key` | Shares its GBIF species key with another species; the records are assigned to the one GBIF accepts. | Μοιράζεται το κλειδί GBIF με άλλο είδος· οι καταγραφές δίνονται σε αυτό που αποδέχεται το GBIF. |
| `species.flags.gbif_no_match` | No usable GBIF match, so there are no records. | Δεν βρέθηκε αντιστοίχιση στο GBIF, άρα δεν υπάρχουν καταγραφές. |
| `species.flags.name_only_match` | The medicinal flag was linked to this species by name, not by identifier. Waiting for review. | Η φαρμακευτική σήμανση συνδέθηκε με αυτό το είδος μέσω ονόματος και όχι κωδικού. Αναμένει έλεγχο. |
| `species.flags.native_status_check` | Native status or inclusion needs a decision by our science lead. | Το αυτόχθονο καθεστώς ή η συμπερίληψη χρειάζεται απόφαση της επιστημονικής μας υπεύθυνης. |
| `priorities.sub` | Plants ranked by our prototype risk score. Open one to see why. | Φυτά κατά τον πρωτότυπο βαθμό κινδύνου μας. Άνοιξε ένα για να δεις γιατί. |
| `priorities.filters` | Filters | Φίλτρα |
| `priorities.atRisk` | Protect it | Προστάτεψέ το |
| `priorities.endemic` | Only grows in Greece | Φυτρώνουν μόνο στην Ελλάδα |
| `priorities.featured` | Reviewed | Ελεγμένα |
| `priorities.family` | Family | Οικογένεια |
| `priorities.allFamilies` | All families | Όλες οι οικογένειες |
| `priorities.count` | plants | φυτά |
| `priorities.empty` | No plants match these filters. | Κανένα φυτό δεν ταιριάζει με αυτά τα φίλτρα. |
| `priorities.score` | Score | Βαθμός |
| `map.layers` | Layers | Επίπεδα |
| `map.diversity` | Medicinal diversity | Φαρμακευτική ποικιλότητα |
| `map.hotspots` | Risk hotspots | Εστίες κινδύνου |
| `map.hotspotsOff` | Hotspots need the Natura 2000 data (not joined yet) | Οι εστίες χρειάζονται τα δεδομένα Natura 2000 (δεν έχουν συνδεθεί ακόμη) |
| `map.atRiskCells` | Cells with at-risk species | Κελιά με είδη σε κίνδυνο |
| `map.natura` | Natura 2000 | Natura 2000 ⚠ same as English |
| `map.sightings` | Sightings | Παρατηρήσεις |
| `map.modes.risk` | Risk | Κίνδυνος |
| `map.modes.richness` | Plants recorded here | Φυτά που έχουν καταγραφεί εδώ |
| `map.modes.hotspots` | Medicinal plant hotspots | Εστίες φαρμακευτικών φυτών |
| `map.modeLabel` | Map layer | Επίπεδο χάρτη |
| `map.riskLegend` | Average risk score of the species recorded in each square | Μέσος βαθμός κινδύνου των ειδών που καταγράφηκαν σε κάθε τετράγωνο |
| `map.richnessLegend` | Medicinal plants recorded per square | Καταγεγραμμένα φαρμακευτικά φυτά ανά τετράγωνο |
| `map.hotspotLegend` | Hotspot: a plant that needs protecting, under 50% of the land protected | Εστία: φυτό που χρειάζεται προστασία, κάτω από 50% προστατευόμενη γη |
| `map.lowRisk` | Lower | Χαμηλότερος |
| `map.highRisk` | Higher | Υψηλότερος |
| `map.noData` | Fewer than 5 species: not enough to average | Λιγότερα από 5 είδη: ανεπαρκή για μέσο όρο |
| `map.notHotspot` | Not a hotspot | Όχι εστία |
| `map.legend` | Legend | Υπόμνημα |
| `map.legendRisk` | Each flower is a 10 km area. Redder means higher average risk. Grey means not enough data yet. | Κάθε λουλούδι είναι μια περιοχή 10 χλμ. Πιο κόκκινο σημαίνει υψηλότερο μέσο κίνδυνο. Γκρι σημαίνει ότι δεν υπάρχουν ακόμη αρκετά δεδομένα. |
| `map.legendRichness` | Each flower is a 10 km area. Darker blue means more plants recorded there. | Κάθε λουλούδι είναι μια περιοχή 10 χλμ. Πιο σκούρο μπλε σημαίνει περισσότερα καταγεγραμμένα φυτά. |
| `map.legendHotspots` | Each star is a 10 km area with an at-risk plant and under half of its land protected. Grey buds are other areas. | Κάθε αστέρι είναι μια περιοχή 10 χλμ με φυτό σε κίνδυνο και λιγότερο από το μισό της γης προστατευόμενο. Οι γκρι μπουμπούκες είναι οι υπόλοιπες περιοχές. |
| `map.generalised` | Locations are generalised to about 10 km to protect plants. | Οι τοποθεσίες γενικεύονται στα 10 χλμ περίπου για την προστασία των φυτών. |
| `map.legendNote` | Each flower marks one 10 km square (about 10 km across). Badges group nearby squares; zoom in to split them. | Κάθε λουλούδι σημαδεύει ένα τετράγωνο 10 χλμ (περίπου 10 χλμ πλάτος). Τα εικονίδια με αριθμό ομαδοποιούν κοντινά τετράγωνα· μεγεθύνετε για να χωριστούν. |
| `map.pinsHotspot` | Hotspot | Εστία |
| `map.speciesGone` | Present then, not now | Υπήρχε τότε, όχι τώρα |
| `map.pinsFewSpecies` | Fewer than 5 species | Λιγότερα από 5 είδη |
| `map.hotspotShort` | Hotspot | Εστία |
| `map.threeD` | 3D | 3D ⚠ same as English |
| `map.flat` | Flat | Επίπεδο |
| `map.heightRichness` | Height: number of species | Ύψος: αριθμός ειδών |
| `map.heightAtRisk` | Height: at-risk species | Ύψος: είδη σε κίνδυνο |
| `map.naturaLine` | Natura 2000 area | Περιοχή Natura 2000 |
| `map.cellList` | Cell list | Λίστα τετραγώνων |
| `map.cellListTitle` | Squares, highest first | Τετράγωνα, από το υψηλότερο |
| `map.cellListHelp` | A keyboard-friendly alternative to the map. Choose a square to see its plants. | Εναλλακτική του χάρτη για πληκτρολόγιο. Διάλεξε ένα τετράγωνο για να δεις τα φυτά του. |
| `map.meanRisk` | avg risk | μέσος κίνδυνος |
| `map.show` | Show | Εμφάνιση |
| `map.hide` | Hide | Απόκρυψη |
| `map.fewer` | Fewer | Λιγότερα |
| `map.more` | More | Περισσότερα |
| `map.perSquare` | Medicinal plants per square | Φαρμακευτικά φυτά ανά τετράγωνο |
| `map.cellTitle` | Cell | Κελί |
| `map.species` | plants | φυτά |
| `map.atRiskIn` | at risk | σε κίνδυνο |
| `map.close` | Close | Κλείσιμο |
| `map.locate` | Show my location | Εμφάνιση της θέσης μου |
| `map.locateFail` | Could not get your location. | Δεν ήταν δυνατή η εύρεση της θέσης σου. |
| `map.tapHint` | Tap a square to see its plants. | Πάτησε ένα τετράγωνο για να δεις τα φυτά του. |
| `map.list` | Plants in this area | Φυτά σε αυτή την περιοχή |
| `map.speciesLayer` | Showing | Εμφανίζεται |
| `map.clearSpecies` | Clear | Καθαρισμός |
| `map.mapLabel` | Map of medicinal plant diversity in Greece | Χάρτης φαρμακευτικής ποικιλότητας φυτών στην Ελλάδα |
| `landing.loader` | Cataloguing the flora of Greece | Καταγράφοντας τη χλωρίδα της Ελλάδας |
| `landing.menu.flora` | Flora | Χλωρίδα |
| `landing.menu.where` | Where | Πού |
| `landing.menu.risk` | Risk | Κίνδυνος |
| `landing.menu.keep` | Keep | Προστασία |
| `landing.menu.install` | Install | Εγκατάσταση |
| `landing.scroll` | Scroll | Κύλιση |
| `landing.whereTitle` | Every column is 10 km of Greece. | Κάθε στήλη είναι 10 χλμ της Ελλάδας. |
| `landing.whereBody` | Height shows how many medicinal species were recorded there. Colour shows how much risk they carry on average. | Το ύψος δείχνει πόσα φαρμακευτικά είδη καταγράφηκαν εκεί. Το χρώμα δείχνει τον μέσο κίνδυνό τους. |
| `landing.speciesCount` | medicinal plants native to Greece | φαρμακευτικά φυτά αυτόχθονα στην Ελλάδα |
| `landing.riskTitle` | Some are running out of room. | Κάποια τελειώνει ο χώρος τους. |
| `landing.riskBody` | Warmer, darker columns hold species at greater risk: rare, declining or left outside protected areas. | Οι θερμότερες, πιο σκούρες στήλες έχουν είδη με μεγαλύτερο κίνδυνο: σπάνια, φθίνοντα ή εκτός προστατευόμενων περιοχών. |
| `landing.atRiskCount` | species flagged at risk | είδη σε κίνδυνο |
| `landing.keepTitle` | How we keep them | Πώς τα προστατεύουμε |
| `landing.keep[0].n` | 01 | 01 ⚠ same as English |
| `landing.keep[0].t` | Scan a plant | Σάρωσε ένα φυτό |
| `landing.keep[0].d` | Point your camera. We identify it and open its card. | Στόχευσε με την κάμερα. Το αναγνωρίζουμε και ανοίγουμε την καρτέλα του. |
| `landing.keep[1].n` | 02 | 02 ⚠ same as English |
| `landing.keep[1].t` | See if it is safe | Δες αν είναι ασφαλές |
| `landing.keep[1].d` | A clear harvest decision before you pick anything. | Σαφής απόφαση συλλογής πριν κόψεις οτιδήποτε. |
| `landing.keep[2].n` | 03 | 03 ⚠ same as English |
| `landing.keep[2].t` | Use a substitute | Χρησιμοποίησε υποκατάστατο |
| `landing.keep[2].d` | At-risk plants come with common alternatives. | Τα φυτά σε κίνδυνο έχουν κοινές εναλλακτικές. |
| `landing.keep[3].n` | 04 | 04 ⚠ same as English |
| `landing.keep[3].t` | Record a sighting | Κατάγραψε μια παρατήρηση |
| `landing.keep[3].d` | Offline too. Threatened plants are saved at 10 km only. | Και χωρίς σύνδεση. Τα απειλούμενα φυτά αποθηκεύονται μόνο στα 10 χλμ. |
| `landing.installTitle` | Install on your phone | Εγκατάσταση στο κινητό |
| `landing.installBody` | Scan the code, then add Chloris to your home screen. It works offline in the field. | Σάρωσε τον κωδικό και πρόσθεσε το Chloris στην αρχική οθόνη. Δουλεύει και χωρίς σύνδεση στο πεδίο. |
| `landing.ios` | iPhone: tap Share, then Add to Home Screen. | iPhone: πάτησε Κοινοποίηση και μετά Προσθήκη στην αρχική οθόνη. |
| `landing.android` | Android: tap Install when Chrome offers it. | Android: πάτησε Εγκατάσταση όταν το προτείνει ο Chrome. |
| `landing.credits` | Data: Kew WCVP & WCUPS · GBIF · IUCN · Natura 2000 (EEA) · OpenStreetMap contributors | Δεδομένα: Kew WCVP & WCUPS · GBIF · IUCN · Natura 2000 (EEA) · OpenStreetMap contributors |
| `landing.openApp` | Open Chloris | Άνοιγμα Chloris |
| `landing.poster` | Static map of medicinal plant risk in Greece | Στατικός χάρτης κινδύνου φαρμακευτικών φυτών στην Ελλάδα |
| `landing.keyHeight` | Height: species recorded | Ύψος: καταγεγραμμένα είδη |
| `landing.keyColour` | Colour: average risk | Χρώμα: μέσος κίνδυνος |
| `landing.keyLow` | Lower | Χαμηλότερος |
| `landing.keyHigh` | Higher | Υψηλότερος |
| `credits.title` | Map and data credits | Πιστώσεις χάρτη και δεδομένων |
| `credits.terrain` | Terrain: Mapzen / AWS Terrain Tiles (open data on AWS). Elevation from Copernicus EU-DEM (produced using Copernicus data and information funded by the European Union), SRTM and GMTED2010 (courtesy of the U.S. Geological Survey) and ETOPO1 (U.S. National Oceanic and Atmospheric Administration). | Ανάγλυφο: Mapzen / AWS Terrain Tiles (ανοικτά δεδομένα στο AWS). Υψομετρικά δεδομένα από Copernicus EU-DEM (παράγονται με δεδομένα και πληροφορίες Copernicus που χρηματοδοτούνται από την Ευρωπαϊκή Ένωση), SRTM και GMTED2010 (ευγενική παραχώρηση της U.S. Geological Survey) και ETOPO1 (U.S. National Oceanic and Atmospheric Administration). |
| `credits.vectors` | Basemap vectors: OpenFreeMap, OpenMapTiles, © OpenStreetMap contributors (ODbL). | Διανυσματικός χάρτης: OpenFreeMap, OpenMapTiles, © συνεισφέροντες του OpenStreetMap (ODbL). |
| `credits.library` | Map rendering: MapLibre GL JS (BSD-3-Clause). | Απεικόνιση χάρτη: MapLibre GL JS (BSD-3-Clause). |
| `notMedicalAdvice` | Chloris is not medical advice. Documented uses are shown for information only. | Το Chloris δεν αποτελεί ιατρική συμβουλή. Οι καταγεγραμμένες χρήσεις παρουσιάζονται μόνο ως πληροφορία. |
