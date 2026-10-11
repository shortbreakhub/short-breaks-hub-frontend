import oceaniaUrl from '../../../assets/oceania/oceania-atlas.png';
import {getItinerariesByCountry} from '../../../api.js';
import {validateOfficialSlug} from '../../../utils/officialItineraries.js';

const marker=(id,x,y)=>({id,kind:'landmark',artworkPosition:{x:x/1536,y:y/1024},hitArea:{width:120/1536,height:90/1024}});
// Interaction anchors on the unlabeled regional artwork; all open country scenes.
const positions={'australia':[460,646],'new-zealand':[895,675],'fiji':[774,280],
    'french-polynesia':[1390,470],'new-caledonia':[675,513],'papua-new-guinea':[330,230],
    'samoa':[1100,277],'tonga':[1030,430],'vanuatu':[740,434]};
const countries = {'australia':'Australia','new-zealand':'New Zealand','fiji':'Fiji','french-polynesia':'French Polynesia','new-caledonia':'New Caledonia','papua-new-guinea':'Papua New Guinea','samoa':'Samoa','tonga':'Tonga','vanuatu':'Vanuatu'};
// Partition enlarged touch targets at the midpoint between neighbouring anchors.
// Keeps each country centre reachable without moving anchors or the approved artwork.
export function clipOceaniaTarget(id, {center,width,height,point}) {
    let polygon=[[0,0],[width,0],[width,height],[0,height]];
    for(const [other,[x,y]] of Object.entries(positions)) {
        if(other===id)continue;
        const neighbour=point(x/1536,y/1024),dx=neighbour.x-center.x,dy=neighbour.y-center.y;
        const distance=([x,y])=>dx*(x-width/2)+dy*(y-height/2)-(dx*dx+dy*dy)/2;
        const clipped=[];
        for(let i=0;i<polygon.length;i++) {
            const a=polygon[i],b=polygon[(i+1)%polygon.length],da=distance(a),db=distance(b);
            if(da<=0)clipped.push(a);
            if((da<=0)!==(db<=0)){const t=da/(da-db);clipped.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}
        }
        polygon=clipped;
    }
    return `polygon(${polygon.map(([x,y])=>`${x/width*100}% ${y/height*100}%`).join(',')})`;
}
export async function loadOceaniaRegion() {
    const inventory = Object.fromEntries(await Promise.all(Object.entries(countries).map(async ([id,country])=>{
        const data=await getItinerariesByCountry(country);
        if (!Array.isArray(data)) throw Error('Oceania inventory unavailable');
        const items=data.filter(item=>item.country===country);
        if (!items.length) throw Error('Oceania destination has no official itineraries');
        items.forEach(item=>validateOfficialSlug(item.slug));
        return [id,items];
    })));
    const destinations=Object.entries(countries).map(([id,country])=>{
        const hitAreas=[marker(id,...positions[id])];
        return {id,country,clipHitArea:geometry=>clipOceaniaTarget(id,geometry),hitAreas,artworkPosition:hitAreas[0].artworkPosition,hitArea:hitAreas[0].hitArea,
            labelKey:`homeMagazine.atlas.oceaniaCountries.${id}`,labelAlign:id==='papua-new-guinea'?'start':hitAreas[0].artworkPosition.x>0.65?'end':undefined,
            labelPlacement:['papua-new-guinea','fiji','samoa'].includes(id)?'below':undefined,
            itineraryCount:inventory[id].length};
    });
    return {inventory,destinations,artworkUrl:oceaniaUrl};
}
