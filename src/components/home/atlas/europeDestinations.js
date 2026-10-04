// Manually audited against the approved muted artwork. These are illustration
// regions, not GIS polygons. Each country's first region anchors its ONE link.
const area = (id, kind, x, y, width, height) => ({id, kind, artworkPosition: {x,y}, hitArea: {width,height}});
export const EUROPE_DESTINATIONS = [
    {id:'united-kingdom', country:'United Kingdom', hitAreas:[
        area('westminster','landmark',.245,.255,.155,.20),
        area('edinburgh-castle','landmark',.30,.13,.125,.11),
        area('scotland','country',.25,.085,.10,.07),
        area('england','country',.29,.28,.06,.14),
    ]},
    {id:'france', country:'France', hitAreas:[
        area('eiffel-tower','landmark',.32,.455,.115,.17),
        area('mont-saint-michel','landmark',.175,.44,.13,.14),
        area('lavender-fields','motif',.35,.56,.09,.06),
        area('northern-france','country',.29,.385,.14,.06),
        area('corsica','country',.471,.685,.025,.05),
    ]},
    {id:'netherlands', country:'Netherlands', hitAreas:[
        area('windmill','landmark',.445,.25,.115,.17),
        area('windmill-blades','landmark',.46,.211,.085,.105),
        area('canal-houses','landmark',.416,.285,.075,.09),
        area('tulip-fields','motif',.445,.325,.10,.05),
        area('dutch-coast','country',.49,.225,.04,.10),
    ]},
    {id:'germany', country:'Germany', hitAreas:[
        area('neuschwanstein','landmark',.57,.335,.115,.17),
        area('german-countryside','country',.64,.36,.09,.09),
    ]},
    {id:'switzerland', country:'Switzerland', hitAreas:[
        area('alps-and-chalet','landmark',.49,.495,.13,.12),
        area('alpine-peaks','landmark',.478,.43,.06,.09),
        area('swiss-country','country',.465,.525,.06,.065),
    ]},
    {id:'italy', country:'Italy', hitAreas:[
        area('colosseum','landmark',.56,.63,.13,.12),
        area('southern-town','landmark',.626,.744,.10,.135),
        area('italian-mainland','country',.65,.825,.07,.07),
        area('sicily','country',.574,.854,.13,.065),
        area('sardinia','country',.435,.78,.035,.08),
    ]},
    {id:'greece', country:'Greece', labelAlign:'end', hitAreas:[
        area('blue-domed-churches','landmark',.813,.845,.13,.14),
        area('island-village','landmark',.80,.85,.165,.155),
        area('greek-mainland','country',.802,.735,.105,.065),
    ]},
    {id:'portugal', country:'Portugal', labelAlign:'start', hitAreas:[
        area('pena-palace','landmark',.083,.60,.11,.14),
        area('palace-buildings','landmark',.10,.606,.095,.11),
        area('portuguese-coast','country',.073,.75,.06,.16),
    ]},
    {id:'spain', country:'Spain', hitAreas:[
        area('sagrada-familia','landmark',.235,.71,.14,.16),
        area('sagrada-complex','landmark',.235,.735,.16,.15),
        area('central-spain','country',.19,.65,.07,.05),
        area('southern-spain','country',.27,.815,.20,.08),
    ]},
].map(destination => ({...destination, labelKey:`itinerarySearchBar.countries.${destination.country}`,
    // Preserve the existing country focus/callout anchor while extending hits.
    artworkPosition:destination.hitAreas[0].artworkPosition, hitArea:destination.hitAreas[0].hitArea}));
