> Historical research checkpoint, superseded by the owner-approved country-entry policy. Current results: **198 VERIFIED / 3 REVIEW_REQUIRED / 0 UNAVAILABLE**. See [country-gateway-policy.md](country-gateway-policy.md), [country-gateway-fallback.csv](country-gateway-fallback.csv) and the current [final-disposition.csv](final-disposition.csv). Prior transport and selection blockers below are retained as research history, not current runtime decisions. Earlier proposed corrections are not automatically applied.

> Current decisions supersede the historical gateway-first review below. See [final-research-report.md](final-research-report.md), [final-disposition.csv](final-disposition.csv) and [proposed-corrections.md](proposed-corrections.md). Current totals: 130 VERIFIED / 71 REVIEW_REQUIRED / 0 UNAVAILABLE. Earlier status labels below are historical.

# Changed mappings and unresolved cases

All airport replacements below remain REVIEW_REQUIRED and cannot be returned by runtime lookup. Bagan is a classification correction, not an approved operational arrival recommendation.

| Destination | Previous | Proposed | Type | Reason |
|---|---|---|---|---|
| chile--torres-del-paine-national-park | PNT / GATEWAY | PUQ | GATEWAY | PNT is the nearer park arrival candidate, PUQ is the regional gateway default, and SCL is the international hub feeding Patagonia. Chile Travel explicitly contrasts seasonal PNT flights with greater PUQ flight choice and documents road/bus onward access. Propose PUQ for reliability across seasons; PNT may be preferable in-season. PUQ is not claimed to eliminate the domestic connection from SCL. |
| malaysia--ipoh | IPH / DIRECT | KUL | GATEWAY | IPH serves Ipoh locally; PEN is a closer regional international arrival candidate; KUL is the broader international-network candidate. Propose KUL plus KLIA Ekspres to KL Sentral and ETS to Ipoh, avoiding a domestic flight. PEN plus a mainland transfer and ETS remains meaningful when the origin offers a practical PEN service. No origin-independent fare or connection advantage is claimed. |
| myanmar--bagan | RGN / DIRECT | RGN | GATEWAY | NYU serves the Bagan area, MDL is the nearer regional international gateway candidate, and RGN is the national arrival gateway candidate. RGN is GATEWAY, never DIRECT. Retain RGN only as a blocked provisional choice: no current, reliable complete NYU/MDL/RGN-to-Bagan journey has been established. MDL commercial operations have resumed, but that does not establish safe onward travel or NYU service. |
| netherlands--rotterdam | RTM / DIRECT | AMS | GATEWAY | RTM is the local European-network arrival option; AMS is the major international gateway with rail access; BRU is a cross-border alternative. Prefer AMS for a broad international-origin default without requiring another flight. Rotterdam tourism directly compares the two airports and identifies their different network roles. Retain RTM as an alternative for suitable European origins. |
| new-zealand--rotorua | ROT / DIRECT | AKL | GATEWAY | ROT offers local arrival after a domestic connection; AKL is the international gateway with a documented road alternative; HLZ is another regional candidate. Choose AKL plus ground transfer to avoid a mandatory additional flight. Rotorua tourism explicitly describes overseas arrivals via AKL and driving onward. ROT remains useful for travellers who prefer a domestic connection. |
| philippines--palawan | PPS / GATEWAY | MNL | GATEWAY | The actual itinerary focuses on El Nido/Coron, with local arrival via ENI or USU, rather than Puerto Princesa. PPS is a different Palawan arrival market and can add unnecessary surface travel. Propose MNL as the international gateway; compare CEB before approval. An onward domestic flight to ENI or USU is justified for this island itinerary; no practical road route from Manila is implied. |
| spain--granada | GRX / DIRECT | AGP | GATEWAY | GRX is the local arrival airport; AGP is the nearer broad international gateway candidate; MAD is the national-hub alternative. Choose AGP plus the airport-to-Granada coach rather than defaulting to a connecting flight into GRX. Aena documents the coach and local GRX bus. GRX is still preferable where a suitable nonstop arrival exists. |
| taiwan--taichung | RMQ / DIRECT | TPE | GATEWAY | RMQ is the local/regional arrival option; TPE is the international gateway default; KHH is another international arrival candidate. Taichung government documents airport-to-Taichung bus and rail routes from TPE and KHH. Prefer TPE plus surface transport to avoid a domestic connection for broader origins, while keeping RMQ viable for origins it serves conveniently. |
| vietnam--hue | HUI / DIRECT | DAD | GATEWAY | HUI is the local airport; DAD is the central-Vietnam international gateway candidate; HAN is a farther national gateway. Propose DAD plus ground travel rather than requiring an extra domestic flight. Hue government documents the Da Nang-Hue rail route; reaching that train from DAD adds a transfer. HUI remains meaningful where convenient international or domestic arrivals exist. |

## High-risk cases

The list below supplements the complete REVIEW_REQUIRED inventory in the CSV; unlisted unresolved records are also blocked.

- **argentina--el-calafate-el-chalten** (FTE, REVIEW_REQUIRED): FTE retains practical access to both El Calafate and El Chalten. EZE is an international connection gateway, not a reasonable substitute arrival followed by short ground travel. Compare PUQ only with border-crossing and long onward travel accounted for.
- **argentina--puerto-iguazu** (IGR, REVIEW_REQUIRED): Compare IGR with IGU international arrival on the Brazilian side, including immigration and border transfer. EZE connectivity does not justify a long overland substitute by itself.
- **australia--tasmania** (HBA, REVIEW_REQUIRED): The actual itinerary starts and ends in Hobart, so retain HBA as the destination gateway rather than forcing arrival at MEL. Compare LST as a different island start and MEL/SYD/AKL as international connection airports. Tasmania tourism confirms mainland one-stop access and seasonal Auckland-Hobart service. A domestic flight may be appropriate across Bass Strait; a ferry is not automatically a practical replacement for this five-day Hobart itinerary.
- **brazil--barreirinhas-atins** (SLZ, REVIEW_REQUIRED): SLZ is a regional arrival gateway to Barreirinhas and the onward Atins leg. Compare FOR surface travel with GRU plus a domestic flight; verify the final boat/road access and seasonal constraints.
- **brazil--manaus-amazon-rainforest** (MAO, REVIEW_REQUIRED): Retain MAO as the rainforest arrival market. GRU/BEL are connection alternatives, not interchangeable endpoints for a Manaus-based boat/lodge itinerary. Final river transfer is itinerary-specific.
- **cambodia--kampot** (KTI, REVIEW_REQUIRED): Compare KOS local/coastal access against KTI international connectivity plus road travel; SAI is a more distant alternative. Do not assume KOS has a suitable international network merely from its designation.
- **cambodia--mondulkiri** (KTI, REVIEW_REQUIRED): KTI plus overland travel is the proposal; no verified scheduled local airport arrival is established. SAI is an alternate entry, not evidence of easier park access. Verify seasonal roads and actual itinerary base.
- **cambodia--phnom-penh** (KTI, REVIEW_REQUIRED): KTI is the replacement passenger airport, not old PNH. Compare SAI only for a different Cambodia entry; it would add travel to Phnom Penh rather than improve the local transfer.
- **cambodia--siem-reap** (SAI, REVIEW_REQUIRED): SAI serves Angkor/Siem Reap, replacing REP. Compare KTI plus lengthy road travel and BKK plus a connecting flight; favour SAI when a realistic international connection exists rather than replacing it with a distant hub automatically.
- **chile--torres-del-paine-national-park** (PUQ, REVIEW_REQUIRED): PNT is the nearer park arrival candidate, PUQ is the regional gateway default, and SCL is the international hub feeding Patagonia. Chile Travel explicitly contrasts seasonal PNT flights with greater PUQ flight choice and documents road/bus onward access. Propose PUQ for reliability across seasons; PNT may be preferable in-season. PUQ is not claimed to eliminate the domestic connection from SCL.
- **china--changzhou** (CZX, REVIEW_REQUIRED): Compare local CZX with PVG and NKG plus rail/ground access. No verified full airport-to-Changzhou transfer or network comparison is established, so keep CZX provisional rather than assert a PVG winner.
- **colombia--salento-cocora-valley** (PEI, REVIEW_REQUIRED): Compare PEI and AXM for access to Salento; BOG/CLO are broader gateway candidates with additional flight or substantial road travel. Verify actual Salento/Cocora access before choosing a national hub.
- **costa-rica--tortuguero** (SJO, REVIEW_REQUIRED): SJO is the international gateway; the final park leg requires independently verified boat or small-plane access. LIR does not avoid that final access requirement.
- **fiji--fiji-islands** (NAN, REVIEW_REQUIRED): NAN is the international arrival candidate, SUV a different island arrival market. The actual outer-island route must establish domestic-flight versus ferry legs; NAN arrival alone does not establish a complete island itinerary.
- **france--strasbourg** (SXB, REVIEW_REQUIRED): Compare SXB local/regional arrivals with FRA rail/bus access and BSL/FKB alternatives. Keep SXB pending until actual cross-border airport-to-Strasbourg access and network trade-offs are established.
- **french-polynesia--tahiti-bora-bora** (PPT, REVIEW_REQUIRED): PPT is the international gateway for Tahiti; BOB is the onward Bora Bora airport, not an equivalent international default. Confirm inter-island flight and boat transfers; do not describe PPT as serving Bora Bora directly.
- **germany--dresden** (DRS, REVIEW_REQUIRED): Compare DRS local/regional arrival against BER plus rail, PRG cross-border travel and FRA connections. A national hub may reduce flight legs but requires a complete surface transfer; retain DRS provisionally.
- **ghana--accra-cape-coast-inland-communities** (ACC, REVIEW_REQUIRED): ACC is the international arrival candidate for the Accra-led coastal/inland route; TKD and KMS are different local arrival markets requiring verification of domestic connections and itinerary order. No second comparable major international gateway in Ghana is established; do not imply the local alternatives replace ACC international connectivity.
- **greece--crete-chania** (CHQ, REVIEW_REQUIRED): Compare CHQ and HER within Crete against ATH plus a domestic flight/ferry. CHQ can avoid extra connections in its international operating season; date-dependent routes and the itinerary Chania base matter.
- **greece--santorini** (JTR, REVIEW_REQUIRED): Compare JTR seasonal international arrivals against ATH plus flight/ferry. Keep JTR provisional; international airport classification does not establish year-round suitable connectivity.
- **indonesia--bandung** (CGK, REVIEW_REQUIRED): Compare BDO local airport operations, KJT and CGK international arrivals. CGK plus road/rail is a gateway proposal; verify airport-to-rail-station transfers and actual current BDO/KJT passenger services.
- **indonesia--yogyakarta** (YIA, REVIEW_REQUIRED): YIA serves the itinerary arrival market. CGK/DPS are connection alternatives; verify whether YIA international services provide realistic one-stop access before imposing a domestic connection or long ground journey.
- **italy--florence** (FLR, REVIEW_REQUIRED): Compare FLR local arrival, PSA rail/coach, BLQ rail and FCO international gateway plus train. Do not force distant Rome where a one-stop FLR arrival is comparably practical; ground access and date-specific flight burden remain pending.
- **japan--hiroshima** (HIJ, REVIEW_REQUIRED): Compare HIJ local/regional international arrivals with KIX plus rail and FUK/HND alternatives. A surface transfer may avoid a domestic sector, but do not assert KIX wins without the complete rail connection and origin-specific flight comparison.
- **japan--kanazawa** (KMQ, REVIEW_REQUIRED): Compare KMQ local arrival, TOY regional alternative, KIX international gateway plus ground/rail and HND plus rail. Rail geography alone does not establish an airport-to-Kanazawa winner.
- **laos--luang-prabang** (LPQ, REVIEW_REQUIRED): Compare LPQ regional international arrival against VTE plus rail and BKK plus flight. An LPQ connection can avoid an extra domestic sector; VTE rail requires station access, ticket availability and current operation checks.
- **laos--vang-vieng** (VTE, REVIEW_REQUIRED): VTE plus rail/road is a gateway proposal; LPQ plus rail is a meaningful alternative. Compare actual international arrival options and airport-to-station transfers, not airport name alone.
- **laos--vientiane** (VTE, REVIEW_REQUIRED): VTE is the local international arrival market; LPQ adds onward surface travel and BKK requires a cross-border or connecting-flight plan. Network suitability remains pending.
- **macau--macau** (MFM, REVIEW_REQUIRED): Compare MFM local regional arrivals with HKG international connectivity plus cross-border coach/ferry. HKG may reduce flight connections but adds immigration and transfer constraints. Keep MFM unresolved rather than assume the larger hub is universally better.
- **malaysia--ipoh** (KUL, REVIEW_REQUIRED): IPH serves Ipoh locally; PEN is a closer regional international arrival candidate; KUL is the broader international-network candidate. Propose KUL plus KLIA Ekspres to KL Sentral and ETS to Ipoh, avoiding a domestic flight. PEN plus a mainland transfer and ETS remains meaningful when the origin offers a practical PEN service. No origin-independent fare or connection advantage is claimed.
- **malaysia--johor-bahru** (JHB, REVIEW_REQUIRED): JHB local arrival competes with SIN broader international access plus border transfer and KUL plus road travel. Border delays and immigration prevent an automatic SIN promotion.
- **malaysia--langkawi** (LGK, REVIEW_REQUIRED): LGK local international arrivals can avoid an extra domestic flight. KUL/PEN connection options must include the final flight/ferry, weather and transfer constraints, not just global network size.
- **mexico--san-miguel-de-allende** (BJX, REVIEW_REQUIRED): Retain BJX as the arrival-market candidate for San Miguel de Allende; compare QRO, MEX rather than requiring arrival at a distant hub solely for its size. A realistic international connection into the destination can be preferable to extra surface travel. The existing evidence does not establish an origin/date-independent winner.
- **mexico--tulum** (TQO, REVIEW_REQUIRED): Compare local TQO with established CUN plus road transfer. Verify current TQO network and transfer operations; designation as international does not prove it beats CUN for diverse origins.
- **myanmar--bagan** (RGN, REVIEW_REQUIRED): NYU serves the Bagan area, MDL is the nearer regional international gateway candidate, and RGN is the national arrival gateway candidate. RGN is GATEWAY, never DIRECT. Retain RGN only as a blocked provisional choice: no current, reliable complete NYU/MDL/RGN-to-Bagan journey has been established. MDL commercial operations have resumed, but that does not establish safe onward travel or NYU service.
- **myanmar--mandalay** (MDL, REVIEW_REQUIRED): MDL operator confirms commercial service, but current regional security and onward travel constraints remain a blocker. RGN is a connection alternative, not proof of a reliable route.
- **myanmar--yangon** (RGN, REVIEW_REQUIRED): RGN is the local international arrival candidate; MDL adds onward travel. Current service and restrictions require review; no safe onward travel assurance is inferred.
- **netherlands--rotterdam** (AMS, REVIEW_REQUIRED): RTM is the local European-network arrival option; AMS is the major international gateway with rail access; BRU is a cross-border alternative. Prefer AMS for a broad international-origin default without requiring another flight. Rotterdam tourism directly compares the two airports and identifies their different network roles. Retain RTM as an alternative for suitable European origins.
- **new-caledonia--noumea-outer-lagoons** (NOU, REVIEW_REQUIRED): NOU is the international gateway; GEA is a different domestic airport. Verify current operations and the actual outer-lagoon boat/domestic connection before declaring the complete journey practical.
- **new-zealand--fiordland** (ZQN, REVIEW_REQUIRED): ZQN is the closer practical international arrival candidate for Te Anau/Fiordland. CHC offers broader connectivity but adds substantial driving; AKL plus domestic travel may still be necessary from some origins. IVC domestic access is not automatically better.
- **new-zealand--rotorua** (AKL, REVIEW_REQUIRED): ROT offers local arrival after a domestic connection; AKL is the international gateway with a documented road alternative; HLZ is another regional candidate. Choose AKL plus ground transfer to avoid a mandatory additional flight. Rotorua tourism explicitly describes overseas arrivals via AKL and driving onward. ROT remains useful for travellers who prefer a domestic connection.
- **new-zealand--south-island** (CHC, REVIEW_REQUIRED): The actual road itinerary begins in Christchurch, then travels via Tekapo, Mount Cook, Wanaka, Queenstown and Fiordland. Retain CHC rather than AKL plus an extra domestic flight or ZQN plus backtracking. CHC operator documents international airline connectivity with seasonal capacity variation. ZQN is meaningful for a reversed route, not an equivalent default start.
- **papua-new-guinea--port-moresby-highlands** (POM, REVIEW_REQUIRED): POM is the international gateway; HGU is an onward Highlands airport. The itinerary needs the actual highland base and safe transport connection confirmed; do not treat the Highlands as a short generic ground transfer.
- **peru--arequipa** (AQP, REVIEW_REQUIRED): Compare AQP arrival for Arequipa with LIM as the broader gateway candidate and CUZ. Retain AQP provisionally: a larger hub is not automatically practical once onward travel is included. Current connection burden, transfer operation and seasonality remain to be established.
- **peru--cusco** (CUZ, REVIEW_REQUIRED): CUZ is the local arrival candidate, LIM the main international gateway. A domestic flight can be practical given the terrain and overland journey; check altitude/acclimatisation and current international CUZ services before choosing.
- **peru--machu-picchu** (CUZ, REVIEW_REQUIRED): CUZ serves the onward Sacred Valley/rail approach; LIM is the international connection gateway, not direct service to Machu Picchu. Verify rail and final access separately; do not replace CUZ with LIM solely for network size.
- **peru--sacred-valley-pisac-ollantaytambo-moray** (CUZ, REVIEW_REQUIRED): CUZ local arrival plus valley road transfer competes with LIM plus a necessary onward flight/long ground journey. This multi-stop itinerary must be assessed around its valley base rather than a single town label.
- **philippines--bohol** (TAG, REVIEW_REQUIRED): TAG is local arrival; CEB plus ferry and MNL plus domestic flight are alternatives. Assess international routes, seaport transfers and sailing/weather constraints before assuming CEB is superior.
- **philippines--palawan** (MNL, REVIEW_REQUIRED): The actual itinerary focuses on El Nido/Coron, with local arrival via ENI or USU, rather than Puerto Princesa. PPS is a different Palawan arrival market and can add unnecessary surface travel. Propose MNL as the international gateway; compare CEB before approval. An onward domestic flight to ENI or USU is justified for this island itinerary; no practical road route from Manila is implied.
- **samoa--upolu-savai-i** (APW, REVIEW_REQUIRED): APW is the international arrival market on Upolu. FGI is not a broad international substitute. Verify the Savai-i ferry leg and seasonality; a transit gateway such as NAN is not the destination arrival airport.
- **spain--granada** (AGP, REVIEW_REQUIRED): GRX is the local arrival airport; AGP is the nearer broad international gateway candidate; MAD is the national-hub alternative. Choose AGP plus the airport-to-Granada coach rather than defaulting to a connecting flight into GRX. Aena documents the coach and local GRX bus. GRX is still preferable where a suitable nonstop arrival exists.
- **taiwan--taichung** (TPE, REVIEW_REQUIRED): RMQ is the local/regional arrival option; TPE is the international gateway default; KHH is another international arrival candidate. Taichung government documents airport-to-Taichung bus and rail routes from TPE and KHH. Prefer TPE plus surface transport to avoid a domestic connection for broader origins, while keeping RMQ viable for origins it serves conveniently.
- **thailand--sukhothai** (BKK, REVIEW_REQUIRED): THS is the local arrival airport; BKK is the international gateway default; PHS is another domestic arrival candidate. BKK plus ground travel can avoid an extra domestic flight, but a THS connection may be less tiring. Retain BKK as GATEWAY with REVIEW_REQUIRED: neither an up-to-date complete ground itinerary nor an origin/date-based THS comparison is verified.
- **tonga--tongatapu-outer-islands** (TBU, REVIEW_REQUIRED): TBU serves the Tongatapu entry; VAV is a different outer-island airport. AKL/NAN are international connection points, not substitutes for reaching Tonga. Verify actual outer-island legs and reliable current service.
- **united-kingdom--bath** (BRS, REVIEW_REQUIRED): BRS is the nearer relevant airport, LHR the broader international gateway and BHX another candidate. Compare documented ground transfers before replacing BRS solely for long-haul network size; a European-hub connection into BRS may be reasonable.
- **united-kingdom--bristol** (BRS, REVIEW_REQUIRED): BRS serves Bristol locally; LHR plus ground transport may reduce flight connections for some origins. Retain BRS pending a complete arrival comparison rather than optimising airport size alone.
- **united-kingdom--cambridge** (STN, REVIEW_REQUIRED): Compare STN nearby international arrival with LHR broader connectivity and LTN. A ground journey from LHR may avoid an extra flight, but current transfer practicality must be established before replacement.
- **united-states--washington-d-c** (IAD, REVIEW_REQUIRED): Retain IAD as the arrival-market candidate for Washington, D.C.; compare DCA, BWI rather than requiring arrival at a distant hub solely for its size. A realistic international connection into the destination can be preferable to extra surface travel. The existing evidence does not establish an origin/date-independent winner.
- **vanuatu--efate-tanna** (VLI, REVIEW_REQUIRED): VLI is the international Efate gateway; TAH is the onward Tanna airport. NAN can be a connection hub but does not remove the Vanuatu domestic leg. Current carrier operations and disruptions must be checked.
- **vietnam--ha-long-bay** (HAN, REVIEW_REQUIRED): Compare nearby VDO/HPH with HAN international connectivity plus road access. HAN remains a gateway proposal, not a claim that the closer airports lack all international service.
- **vietnam--hue** (DAD, REVIEW_REQUIRED): HUI is the local airport; DAD is the central-Vietnam international gateway candidate; HAN is a farther national gateway. Propose DAD plus ground travel rather than requiring an extra domestic flight. Hue government documents the Da Nang-Hue rail route; reaching that train from DAD adds a transfer. HUI remains meaningful where convenient international or domestic arrivals exist.

## Remaining verification

118 records still require comparative primary-source verification. The research pass does not establish current schedules, year-round service, exhaustive nearest-gateway rankings or every airport-to-destination transfer. These are explicit outstanding research requirements, not runtime-approved recommendations.

## Final fallback policy — targeted review

This pass updates the 15 priority decisions below. **No airport codes, classifications or statuses changed in this pass.** The nine changes above are historical changes from the preceding gateway reassessment, not new replacements. All 15 priority records remain REVIEW_REQUIRED and runtime lookup returns null. Other records were not reopened.

| Destination | Current / final | Local candidates | Nearby gateway | Capital fallback | Type / status |
|---|---|---|---|---|---|
| myanmar--bagan | RGN | NYU | MDL | NYT | GATEWAY / REVIEW_REQUIRED |
| philippines--palawan | MNL | ENI, USU, PPS | CEB | MNL | GATEWAY / REVIEW_REQUIRED |
| cambodia--mondulkiri | KTI | Not established | KTI | KTI | GATEWAY / REVIEW_REQUIRED |
| chile--torres-del-paine-national-park | PUQ | PNT | PUQ | SCL | GATEWAY / REVIEW_REQUIRED |
| costa-rica--tortuguero | SJO | TTQ | SJO | SJO | GATEWAY / REVIEW_REQUIRED |
| vanuatu--efate-tanna | VLI | VLI, TAH | VLI | VLI | GATEWAY / REVIEW_REQUIRED |
| malaysia--ipoh | KUL | IPH | PEN | KUL | GATEWAY / REVIEW_REQUIRED |
| thailand--sukhothai | BKK | THS, PHS | BKK | BKK | GATEWAY / REVIEW_REQUIRED |
| macau--macau | MFM | MFM | HKG | NOT_APPLICABLE | DIRECT / REVIEW_REQUIRED |
| mexico--tulum | TQO | TQO | CUN | MEX | DIRECT / REVIEW_REQUIRED |
| malaysia--johor-bahru | JHB | JHB | SIN | KUL | DIRECT / REVIEW_REQUIRED |
| malaysia--langkawi | LGK | LGK | PEN | KUL | DIRECT / REVIEW_REQUIRED |
| new-zealand--rotorua | AKL | ROT | AKL | WLG | GATEWAY / REVIEW_REQUIRED |
| australia--tasmania | HBA | HBA, LST | MEL | CBR | GATEWAY / REVIEW_REQUIRED |
| new-zealand--south-island | CHC | CHC | CHC | WLG | GATEWAY / REVIEW_REQUIRED |

### myanmar--bagan

Retain RGN only as a blocked national-gateway candidate. Compare NYU local arrival and MDL regional access before selecting a usable default. Nay Pyi Taw is the political capital; Yangon must not be described as the capital fallback.

**Required onward travel:** An additional domestic flight or substantial overland journey is required from RGN. Current reliable access to Bagan is not established.

**Capital fallback:** NYT rejected as the default: the sources establish an international entry designation, not a practical current passenger network or onward Bagan journey. RGN is an alternative national gateway, not the political-capital airport.

**Verified source observations:** Yangon operator publishes international schedules; MDL operator publishes international services. Yangon passenger guidance recognises Naypyidaw as an entry airport, which alone does not establish current suitable flights.

**Still unresolved:** Current NYU service and permitted/reliable RGN, MDL or NYT onward access remain unverified. One static arrival code cannot safely represent the complete Bagan journey yet.

**Sources:** https://yangonairport.aero/index.php/en/flight-information/international-flight-schedule; https://www.yangonairport.aero/index.php/en/passenger-guide; https://www.mandalayintlairport.com/flight-information?qt-flight_information_system=0; https://www.gov.uk/foreign-travel-advice/myanmar/safety-and-security

### philippines--palawan

Retain MNL as a blocked capital-entry gateway, not a Palawan arrival endpoint. The actual itinerary permits El Nido or Coron; one international entry code does not choose between their different local airports.

**Required onward travel:** A domestic flight to ENI or USU and local transfer is still required. PPS is not interchangeable with the El Nido/Coron itinerary; moving between island bases can require sea travel.

**Capital fallback:** MNL retained provisionally as the capital gateway; compare CEB and verify the selected local airport before promotion.

**Verified source observations:** Existing itinerary planningCity identifies El Nido/Coron. Official destination material distinguishes El Nido access from Puerto Princesa and Coron sea access.

**Still unresolved:** Current MNL/CEB international and domestic connections, terminal transfers and actual chosen itinerary base remain unresolved.

**Sources:** https://www.miaa.gov.ph/index.php/faq; https://app.philippines.travel/interests/el-nido; https://philippines.travel/destinations/coron/index

### cambodia--mondulkiri

Retain KTI as the Phnom Penh-serving capital gateway candidate. No suitable scheduled local arrival airport has been established. Do not replace KTI with SAI merely because both are international airports.

**Required onward travel:** Substantial road travel to the Mondulkiri/Sen Monorom base, including an airport-to-coach or private-transfer connection, is required.

**Capital fallback:** KTI is the capital-serving candidate, but incomplete current onward evidence prevents VERIFIED status.

**Verified source observations:** VINCI identifies KTI as the operational replacement for the former Phnom Penh passenger airport. Cambodia Ministry of Tourism identifies Mondulkiri access from Phnom Penh; available road guide material is dated.

**Still unresolved:** Current airport-to-departure-point transfer, road conditions and reliable coach/private transport need confirmation. Older road descriptions are not current service verification.

**Sources:** https://vinci-airports.com/en/our-airports/cambodia/phnom-penh-airport/; https://tourismcambodia.org/provinces/46/mondulkiri; https://www.tourismcambodia.com/travelguides/provinces/mondulkiri/how-to-get-there.htm

### chile--torres-del-paine-national-park

Retain PUQ as the regional park gateway candidate. The national tourism authority documents greater flight choice than seasonal PNT and onward surface travel. PNT remains a meaningful in-season alternative.

**Required onward travel:** Ground travel through Puerto Natales to the park is required; international arrivals through SCL may also require a domestic flight to PUQ or PNT.

**Capital fallback:** SCL rejected as a replacement destination endpoint: it is an international connection gateway, not an interchangeable Patagonian park arrival airport.

**Verified source observations:** Chile Travel explicitly identifies seasonal PNT service, greater PUQ flight choice, and onward bus/car access.

**Still unresolved:** Current PUQ international connections and intended-date domestic/ground transfer availability remain unconfirmed; no year-round service guarantee is made.

**Sources:** https://chile.travel/en/destinations/torres-del-paine/; https://chile.travel/destinos/puerto-natales/

### costa-rica--tortuguero

Retain SJO as the San Jose-serving international gateway candidate. The park cannot be reached by a final road-only transfer; the documented La Pavona approach includes a boat.

**Required onward travel:** Road/public transport to the embarkation point plus a boat is required, or an independently confirmed domestic flight to Tortuguero.

**Capital fallback:** SJO retained as the capital-serving entry candidate; it does not represent arrival inside Tortuguero.

**Verified source observations:** National tourism park guidance describes travel via Guapiles, Cariari and La Pavona followed by boat, with public/private transport options.

**Still unresolved:** Airport-to-transfer connection, current boat operation and arrival-time fit still need operator verification. TTQ current scheduled service is not established by its airport identity.

**Sources:** https://www.visitcostarica.com/where-to-go/protected-areas/tortuguero-national-park; https://www.sjoairport.com/transportation/?lang=en

### vanuatu--efate-tanna

Retain VLI for the Efate/Port Vila international entry. TAH is the separate Tanna arrival airport. Do not replace the itinerary endpoint with NAN, which is a possible external connection point rather than a Vanuatu arrival.

**Required onward travel:** An onward inter-island flight and local ground transfer are needed for the Tanna part of the itinerary.

**Capital fallback:** VLI is both the local Efate entry and capital-serving airport, so capital fallback adds no alternative solution to the Tanna leg.

**Verified source observations:** The Vanuatu government October 2025 service notice describes Port Vila-Tanna domestic flights. It is dated evidence, not confirmation of an October 2026 schedule.

**Still unresolved:** Current international VLI operations and confirmed Tanna flights must be verified; older tourism claims of daily service are not accepted as current proof.

**Sources:** https://pmo.gov.vu/en/public-information/press-release/1127-air-vanuatu-service-updates-effective-6-october-2025.html; https://www.airvanuatu.com/media/1937/nf-domestic-operating-schedule_v2-01dec25-to-31dec25.pdf

### malaysia--ipoh

Retain KUL provisionally because airport rail to KL Sentral and ETS to Ipoh provide a documented surface chain. PEN is the nearby international alternative and must be preferred if a sufficiently practical complete arrival is established; the available evidence does not yet establish that comparison.

**Required onward travel:** Airport rail followed by intercity rail and a local transfer is required; an additional domestic flight is not required by this proposed chain.

**Capital fallback:** KUL retained as a supported capital-serving fallback candidate, not selected merely because it is Malaysia's largest hub. PEN access remains a specific unresolved Rule 2 comparison.

**Verified source observations:** KLIA Ekspres connects KUL terminals to KL Sentral; KTMB identifies KL Sentral-Ipoh ETS service. Existing operator evidence describes KLIA international network expansion.

**Still unresolved:** Current IPH network and complete PEN-airport-to-Ipoh transfer comparison remain insufficient for an origin-independent default approval.

**Sources:** https://kliaekspres.com/products-fares/klia-ekspres/; https://www.ktmb.com.my/ETS.html; https://www.ktmb.com.my/traintime.html; https://corporate.malaysiaairports.com.my/en

### thailand--sukhothai

Retain BKK as the capital-serving gateway candidate. Compare THS local arrival with BKK plus ground transport; fewer flights alone does not prove a long coach journey is the preferable experience.

**Required onward travel:** Either substantial ground travel from Bangkok, or a domestic flight to THS/PHS followed by local transfer, is required.

**Capital fallback:** BKK retained provisionally; the capital fallback must remain blocked until the complete onward option is verified.

**Verified source observations:** Bangkok Airways identifies a Sukhothai airport office; TAT describes Suvarnabhumi access to Bangkok bus terminals. Neither proves current end-to-end Sukhothai transport.

**Still unresolved:** Current THS service and airport-to-terminal-to-Sukhothai coach availability, including arrival-time fit, remain unconfirmed.

**Sources:** https://www.bangkokair.com/offices/index/sukhothai; https://www.tourismthailand.org/Articles/gettingtothecity

### macau--macau

Retain MFM as the local international arrival candidate under Rule 1. HKG plus a documented cross-boundary transfer is a meaningful alternative for origins with better HKG access, not an automatic replacement.

**Required onward travel:** MFM requires a local ground transfer; HKG requires a ferry/coach cross-boundary transfer with eligibility and immigration conditions.

**Capital fallback:** Do not substitute Beijing as a capital fallback for the Macao arrival market. This SAR record has its own local airport; distant national-capital travel does not solve local access.

**Verified source observations:** Macao Government Tourism Office describes local air arrival and direct HKIA ferry/cross-boundary bus options.

**Still unresolved:** Current MFM passenger route suitability and the selected HKG transfer's eligibility/timing remain unverified. A single static code cannot optimise both arrival strategies for every origin.

**Sources:** https://www.macaotourism.gov.mo/en/article/before-you-travel/travelling-to-macao; https://www.macau-airport.com/en/transportation/public-transport

### mexico--tulum

Retain TQO as the destination-serving international candidate under Rule 1 rather than defaulting to MEX. American Airlines currently offers TQO flights; CUN remains a meaningful international alternative with a different ground journey.

**Required onward travel:** Local ground transfer from TQO, or a longer ground transfer from CUN, is required. MEX generally adds a domestic sector or substantial overland travel.

**Capital fallback:** MEX rejected as the default replacement while a local international arrival is available; airport size/capital status does not justify extra travel.

**Verified source observations:** American Airlines' current booking page offers international arrivals at TQO; this is not a guarantee of a flight on every date or from every origin.

**Still unresolved:** Current TQO-to-accommodation transfer and comparative CUN service/transfer evidence remain insufficient for VERIFIED status.

**Sources:** https://www.aa.com/en-us//flights-to-tulum; https://news.aa.com/news/news-details/2023/Tokyo-to-Tulum-American-Airlines-unveils-new-international-routes-to-enhance-2024-travels-NET-RTS-11/default.aspx

### malaysia--johor-bahru

Retain JHB as the local international candidate. Its operator lists international passenger destinations, so a lack of international service cannot be assumed. SIN is a nearby broader gateway but introduces a border crossing.

**Required onward travel:** JHB requires local ground access; SIN requires cross-border transport and entry eligibility; KUL adds substantial ground travel or another flight.

**Capital fallback:** KUL rejected as an automatic replacement: local international service exists, and the capital fallback must not add unnecessary travel. SIN still requires a verified border-transfer comparison.

**Verified source observations:** Senai operator lists international destinations including Bangkok, Jakarta and Ho Chi Minh City. Its page has template errors, but the route list is readable.

**Still unresolved:** Current useful connections from different origins and practical local ground transport require confirmation; operator listing alone is not a complete journey verification.

**Sources:** https://www.senaiairport.com/flight-info/airlines-destinations; https://tourism.johor.gov.my/transportation-and-accessibility/

### malaysia--langkawi

Retain LGK as the local island international candidate, subject to current service verification. Tourism Malaysia describes KUL connections and mainland ferry approaches; replacing LGK with KUL would not mean the traveller has reached Langkawi.

**Required onward travel:** Local transfer follows an LGK arrival. KUL requires an onward domestic flight or substantial mainland travel plus ferry; PEN also needs a verified onward island connection.

**Capital fallback:** KUL retained only as an alternative entry/connection candidate, not the default replacement for an island airport with potentially practical international access.

**Verified source observations:** Tourism Malaysia's indexed guide describes KUL-Langkawi flights and ferry access from mainland ports; full-page access returned 403. This guide and older airline route announcements do not establish current schedules.

**Still unresolved:** Current international LGK route suitability, seasonality and local transfer need verification. Do not treat airport designation or a flight-search landing page as sufficient.

**Sources:** https://ebrochures.malaysia.travel/en/langkawi/28-getting-to-langkawi/; https://newsroom.airasia.com/news/2022/3/29/airasia-to-reinstate-five-more-routes-connecting-singapore-and-malaysia

### new-zealand--rotorua

Retain AKL as the nearby international gateway candidate. Rotorua tourism explicitly documents a driving alternative to the onward domestic flight; the political-capital airport WLG does not improve that supported access chain.

**Required onward travel:** Road travel from Auckland to Rotorua is required. ROT is the local airport alternative reached by a domestic connection.

**Capital fallback:** WLG rejected as an automatic default: the nearby AKL-to-Rotorua road route is documented and capital status is not a reason to replace it.

**Verified source observations:** Rotorua tourism describes overseas arrival through Auckland followed by driving or a flight to Rotorua, and identifies domestic ROT connections.

**Still unresolved:** Confirm the selected ground transfer and current international connection suitability before promotion; no universal origin/date winner is claimed.

**Sources:** https://www.rotoruanz.com/travel-trade/about-rotorua/getting-here; https://www.rotoruanz.com/visit/things-to-do/rotorua-airport

### australia--tasmania

Retain HBA as the Hobart-starting itinerary arrival candidate. Mainland connecting flights may be appropriate across Bass Strait. The capital airport CBR is not a replacement Tasmania endpoint.

**Required onward travel:** HBA arrival requires local transport and the itinerary self-drive. Mainland MEL/CBR arrivals still require an island flight or independently verified ferry journey.

**Capital fallback:** CBR rejected as the default replacement: it would not complete island arrival. Compare MEL/SYD international connections and seasonal AKL-HBA access around the actual Hobart start.

**Verified source observations:** Tourism Tasmania describes mainland connecting services and seasonal Auckland-Hobart access; Hobart operator lists the Auckland international service.

**Still unresolved:** Travel-date international and domestic connections remain unresolved; proposed Asian services must not be treated as operating flights.

**Sources:** https://www.tourismtasmania.com.au/about-us/what-we-do/access-to-tasmania/; https://hobartairport.com.au/travellers/destinations/

### new-zealand--south-island

Retain CHC for the actual Christchurch-starting road itinerary. Its operator documents international services. ZQN changes the itinerary start, while a capital-airport WLG arrival does not reach the South Island road starting point.

**Required onward travel:** Local transfer/car collection at CHC, then the existing road itinerary. WLG entry would add a domestic flight or a separately verified ferry and road journey.

**Capital fallback:** WLG rejected as the default replacement: practical local international arrival exists at the required Christchurch starting point.

**Verified source observations:** The existing schedule starts Christchurch to Lake Tekapo; CHC operator reports international services and summer variations.

**Still unresolved:** Confirm travel-date connections and rental/road access; the full exit-airport choice cannot be represented by this single arrival code.

**Sources:** https://www.christchurchairport.co.nz/about-us/who-we-are/media/2026/international-visitor-numbers-surge-22-in-standout-summer-for-christchurch-airport/; https://www.christchurchairport.nz/travellers/flights/airlines/contacts/
