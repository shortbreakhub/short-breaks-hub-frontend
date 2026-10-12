# Issue #98 — International arrival gateway review

This is the approved frontend-only airport mapping and its research history for Issue #98. VERIFIED records are now used by the Flights Trip Prep handoff; Hotel mapping is unchanged. Affiliate attribution remains deferred for post-release verification.

## Inventory

All **201 canonical destination keys** are preserved. The catalogue contains 201 assigned itinerary slugs; the current prerender snapshot contains 198 destination itineraries within the unchanged 258-route inventory. San Miguel de Allende, Arequipa and Washington, D.C. are catalogue-only. The three remaining REVIEW_REQUIRED records are the Myanmar safety exceptions.

Catalogue: https://github.com/shortbreakhub/short-breaks-hub-backend/blob/master/src/main/resources/seed/destinations.json

Catalogue blob: `0dba201136e505a5e6ac5d69cd00906d62bac63d`, version `issue-14-v1`. No backend files were changed.

## Owner-approved final selection policy

1. Preserve the 130 existing VERIFIED mappings unless a clear error is established.
2. Retain defensible operational local passenger airports for remaining records.
3. Otherwise use the country’s main international entry gateway, preferably capital-serving; if that is not the primary suitable airport, use the established primary international passenger airport.
4. Country-level fallbacks are always GATEWAY. They do not imply proximity or destination arrival. No proof of onward ground transport is required, and itinerary arrival instructions remain unchanged.
5. REVIEW_REQUIRED is retained only for genuine airport identity, country assignment, operations or safety exceptions. All records keep six runtime fields and physical AIRPORT identifiers.

Current results: **198 VERIFIED / 3 REVIEW_REQUIRED / 0 UNAVAILABLE**. All 201 keys are accounted for. The previous 130 runtime and evidence records are unchanged. Eight existing local passenger mappings are approved; 60 country-entry fallbacks are approved; three Myanmar safety cases remain blocked. See [country-gateway-policy.md](country-gateway-policy.md) and [country-gateway-fallback.csv](country-gateway-fallback.csv) for all 71 dispositions. Old gateway-first and door-to-door sections below are historical and superseded.

## Files and review workflow

- `src/config/flight-airports.json`: unchanged six-field runtime schema, one record per canonical key.
- `evidence.json`: airport identity registry, original mapping snapshot, actual itinerary arrival/schedule context, candidate sets, decision trade-offs, sources, confirmed facts and unresolved checks.
- [gateway-review.csv](gateway-review.csv): complete 201-row report with previous/new code, alternatives, reason, mapping type, status, sources and change flag. CSV quoting preserves commas and multiline values.
- [changed-and-high-risk.md](changed-and-high-risk.md): all nine record changes and the remote/island/multi-stop/seasonal cases needing particular attention.

Research date: 2026-10-11. Destination-specific web searches revisited all 201 entries. Primary operator, transport, government and tourism sources were preferred. Indexed content was used where available; source discovery is not automatically a completed comparative verification. Each candidate's airport identity was cross-checked against a physical-airport reference; 276 distinct airport codes occur across the comparison sets. The reference records country, municipality and physical airport name. No metropolitan codes were silently substituted.

Identity reference: https://github.com/datasets/airport-codes/blob/main/data/airport-codes.csv

This secondary reference establishes an airport identity match, **not current operation or suitability**. `gatewayAssessment.nearestRelevantAirportCandidate` and `majorGatewayCandidate` are research shortlists, not an exhaustive measured distance ranking. Some candidates are connection hubs rather than practical surface-arrival alternatives; that distinction must be resolved before approval. Runtime data does not include the expanded research fields.

## Results and confidence

- **201 records: 198 VERIFIED, 3 REVIEW_REQUIRED, 0 UNAVAILABLE.**
- **120 DIRECT / 81 GATEWAY.** Classifications of unresolved choices remain provisional.
- Eight proposed airport replacements: Ipoh IPH→KUL; Rotorua ROT→AKL; Palawan PPS→MNL; Torres del Paine PNT→PUQ; Rotterdam RTM→AMS; Taichung RMQ→TPE; Granada GRX→AGP; Hue HUI→DAD.
- Bagan retains RGN provisionally but corrects DIRECT→GATEWAY. NYU/MDL/RGN current service and reliable onward travel are unresolved.
- The nine earlier code/classification corrections remain REVIEW_REQUIRED. Batch 1 promotes 20 unchanged airport choices using primary operational and city-transport evidence; none is promoted on IATA validity alone.
- Existing 13 VERIFIED choices retain their previously examined primary evidence; alternatives and international-arrival trade-offs are now explicit. They are not promises of availability from every origin/date.

**Country-entry coverage is complete apart from three Myanmar safety exceptions.** Those three remain blocked from runtime lookup. The remaining 198 approvals support flight-search entry points under the owner policy, not complete arrival plans or guarantees of proximity, onward transport or travel-date service. Historical transport gaps below no longer block country-entry approval.

## Mandatory cases

- **Ipoh:** IPH/PEN/KUL compared. KUL is the provisional broad-network gateway using airport rail and ETS; PEN is meaningful for origins with convenient service. Airport-to-mainland PEN transfer and route-date comparison remain pending.
- **Bagan:** NYU is local, MDL the nearer regional gateway candidate, RGN a farther national gateway. RGN is never DIRECT. MDL's resumed commercial service does not verify onward travel or NYU operations. Government transport restrictions remain a specific research blocker.
- **Sukhothai:** THS/PHS local/domestic options versus BKK plus ground travel. BKK remains provisional; airport-to-terminal and current onward coach operation must be verified before claiming fewer connections is more practical.
- **Torres del Paine:** official tourism describes seasonal PNT flights versus broader PUQ flight choice and road/bus onward access. PUQ is provisional and is not claimed to avoid a domestic connection from SCL.
- **Palawan:** actual itinerary is El Nido/Coron focused. Compare ENI/USU local access and MNL/CEB gateways; PPS is not an interchangeable arrival. The existing itinerary arrival copy uses LIO; the physical reference identifies El Nido as ENI. This research does not edit itinerary content.
- **Tasmania:** actual route starts/ends Hobart. HBA remains a gateway; mainland or seasonal Auckland connections can be justified. Do not infer proposed Asian service is already operating.
- **South Island:** actual route begins Christchurch. CHC retains the proper entry; ZQN would change the start and AKL may add an unnecessary domestic sector. International routes are not all assumed year-round.

## Runtime and acceptance boundary

`getFlightAirport(destinationKey)` returns an immutable record only for VERIFIED entries. REVIEW_REQUIRED, UNAVAILABLE and unknown inputs return null. Exact canonical keys are required; no code inference, fuzzy name lookup, network calls or fallback to another destination occurs.

Before promoting an unresolved record, an independent reviewer must confirm physical identity, current passenger network, realistic international access, the complete onward journey, relevant seasonal restrictions, and the reason it beats the meaningful alternatives for this itinerary. Valid alternatives can remain origin-dependent. No distances, journey durations, route frequencies or fares were invented to make a choice appear verified.

## Phase 3 — Batch 1

Twenty ordinary international city destinations were verified against primary airport, government, tourism and transport evidence on 2026-10-11. All selected codes and DIRECT classifications are retained. Existing 13 VERIFIED records are unchanged; totals are now 33 VERIFIED / 168 REVIEW_REQUIRED. Each affected evidence record records supported observations, meaningful alternatives and limits. Suitable alternatives do not require an origin-independent winner. No live Trip.com search or tracking verification was performed.

## Phase 3 — Batch 2

Batch 1 consistency passed at 33 VERIFIED / 168 REVIEW_REQUIRED across all 201 JSON/evidence/CSV identities. Bangkok’s operational evidence now uses Suvarnabhumi/AOT sources instead of the Malaysia Airports article. Batch 2 verifies 20 additional European/Asian city-serving airports, retaining every selected code and DIRECT classification. Totals are 53 VERIFIED / 148 REVIEW_REQUIRED. Destination-specific observations and alternative assessments are recorded in evidence.json; sources with extraction limitations are explicitly identified and supplemented. The previous 33 runtime VERIFIED records are unchanged.

## Phase 4 — Remaining triage and Batch 3

Initial unresolved inventory: 148 (A: 26 straightforward, B: 92 targeted transport/operations verification, C: 30 complex or high-risk). Classification uses the existing itinerary arrival, schedule and transport context; A is a research priority, not approval. Batch 3 reviewed 20 A candidates and promoted 16 with primary passenger-service and city-transfer evidence. No codes or classifications changed. Chengdu, Xi’an, Bogota and Boston remain REVIEW_REQUIRED and move from A to B because specific evidence gaps remain. Final totals: 69 VERIFIED / 132 REVIEW_REQUIRED / 0 UNAVAILABLE; remaining triage: A: 6, B: 96, C: 30.

[remaining-triage.csv](remaining-triage.csv) contains exactly the current unresolved inventory, with itinerary-specific reasons and next actions. Destination-specific Batch 3 evidence and access limitations are recorded in evidence.json. No live Trip.com availability or affiliate tracking was tested. Research does not guarantee future airline schedules.

## Phase 5 — Remaining A and low-risk B

Baseline integrity passed at 201 keys, 69 VERIFIED / 132 REVIEW_REQUIRED and A: 6 / B: 96 / C: 30. All six remaining A records were verified: Ottawa YOW, Cologne CGN, Thessaloniki SKG, Mexico City MEX, Marrakech RAK and Manila MNL. Five low-risk DIRECT B candidates were printed before changes; Bristol BRS, Quebec City YQB, Wellington WLG and Kaohsiung KHH passed. Florence FLR remains B/REVIEW_REQUIRED: current GEST T2 transfer evidence is established, but the airport timetable retrieval failed and the retrieved 2026 traffic excerpt combines Florence/Pisa, so Florence-specific current passenger evidence needs completion. No record was promoted on its triage category alone.

TFU, XIY, BOG and BOS were assessed against their existing Phase 4 gaps and deferred in favour of the selected local city-transfer cases; their research records and selections are unchanged. No code or DIRECT/GATEWAY change was proposed. Final totals: 79 VERIFIED / 122 REVIEW_REQUIRED / 0 UNAVAILABLE, with unresolved A: 0 / B: 92 / C: 30. Existing 69 VERIFIED records are unchanged. Source-specific observations, alternatives and access limitations are recorded in each promoted evidence record.

## Phase 6 — Category B evidence gaps

All 92 baseline B records were classified using existing itinerary context, review notes and source observations. Source leads are explicitly distinguished from completed verification; airport-level evidence from another verified destination is reused without claiming that it establishes a different onward journey. Initial primary gaps: B1 operations 27, B2 ground transport 2, B3 gateway onward journey 51, B4 selection/context ambiguity 12. Secondary gaps are recorded separately. Priorities: HIGH 5, MEDIUM 75, LOW 12. The full current inventory is in [b-evidence-gaps.csv](b-evidence-gaps.csv).

Five HIGH-priority records were printed before promotions: FLR, BOG, BOS, XIY and KTI. Florence, Bogota, Boston and Phnom Penh passed using new primary operator/airline evidence and confirmed local transfers. Florence’s directly retrieved 2026 PDF separates Florence from Pisa; Boston uses JAL and MBTA’s public route data; KTI uses its new airport transport guide and city-bus authority rather than old PNH train/bus pages. XIY remains blocked: new opening-announcement/procurement excerpts did not establish sufficient authoritative current T5-to-city passenger guidance. TFU remains B4/LOW with its previously documented TFU/CTU and transport gaps; failed source retrievals were not repeated. No airport-code or mapping-type correction was proposed.

Final counts: 83 VERIFIED / 118 REVIEW_REQUIRED / 0 UNAVAILABLE, triage A: 0 / B: 88 / C: 30; remaining B primary gaps B1: 24 / B2: 1 / B3: 51 / B4: 12. Existing 79 VERIFIED records are unchanged. KTI operations evidence also closes that secondary gap for the still-blocked Kampot gateway record; its onward journey remains unverified and its runtime/research record is unchanged.

## Consolidated final research pass — 2026-10-12

The latest local-passenger-first policy supersedes earlier gateway-first selection rationale. International connections into an operational domestic airport are valid. All 118 baseline unresolved records received individual dispositions; existing 83 VERIFIED runtime and evidence records are unchanged. Results: **130 VERIFIED / 71 REVIEW_REQUIRED / 0 UNAVAILABLE**, including 47 new promotions. No code or mapping-type changes were applied. Physical airport identities retain the existing reference checks; operating service and practical access need separate evidence.

See [final-disposition.csv](final-disposition.csv) for all 201 decisions, evidence observations, transport chains and precise blockers. [final-research-report.md](final-research-report.md) lists every promotion, all blocked destinations and all 30 Category C decisions. [proposed-corrections.md](proposed-corrections.md) separates supported/conditional local-airport corrections from runtime data. Earlier phase sections and original previous-mapping comparisons are historical, not current approval claims. Remaining triage and B-gap CSVs contain only currently blocked records. A source observation records what was retrieved; older source leads and application itinerary copy do not prove current service. Full government XIY T5 retrieval failed, but indexed government opening text, municipal interchange guidance and operating-airline terminal evidence together support the transfer; no failure was treated as airport unsuitability.

No airport was made UNAVAILABLE solely because evidence was inaccessible, incomplete, or security-sensitive. No live Trip.com inventory was tested; VERIFIED supports a static arrival mapping, not guaranteed flights, fares, transfers, permits or safe travel on every date.
