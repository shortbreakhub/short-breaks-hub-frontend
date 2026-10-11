// Artistic interaction zones on the locked 1536×1024 image, not geographic boundaries.
const W=1536,H=1024;
export const AFRICA_REGIONAL_ZONES={
    morocco:[480,160,180,115],egypt:[860,235,180,130],
    senegal:[340,320,120,100],ghana:[470,395,150,90],
    kenya:[1120,475,170,110],tanzania:[1080,610,170,105],
    rwanda:[892,515,110,95],namibia:[675,750,150,120],
    'south-africa':[830,900,170,95],
};
// Same optional clipping contract already used by Oceania: partition only enlarged
// touch targets, without moving image anchors or clipping hover/focus callouts.
function clipTarget(id,{center,width,height,point}){
    let polygon=[[0,0],[width,0],[width,height],[0,height]];
    for(const [other,[x,y]]of Object.entries(AFRICA_REGIONAL_ZONES)){
        if(other===id)continue;
        const neighbour=point(x/W,y/H),dx=neighbour.x-center.x,dy=neighbour.y-center.y;
        const distance=([x,y])=>dx*(x-width/2)+dy*(y-height/2)-(dx*dx+dy*dy)/2;
        const clipped=[];
        for(let i=0;i<polygon.length;i++){
            const a=polygon[i],b=polygon[(i+1)%polygon.length],da=distance(a),db=distance(b);
            if(da<=0)clipped.push(a);
            if((da<=0)!==(db<=0)){const t=da/(da-db);clipped.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}
        }
        polygon=clipped;
    }
    return `polygon(${polygon.map(([x,y])=>`${x/width*100}% ${y/height*100}%`).join(',')})`;
}
export function africaDestination(id,country){
    const [x,y,width,height]=AFRICA_REGIONAL_ZONES[id];
    const anchor={id,kind:'country',artworkPosition:{x:x/W,y:y/H},hitArea:{width:width/W,height:height/H}};
    return {id,country,labelKey:`homeMagazine.atlas.africaCountries.${id}`,hitAreas:[anchor],artworkPosition:anchor.artworkPosition,hitArea:anchor.hitArea,
        clipHitArea:geometry=>clipTarget(id,geometry),labelAlign:id==='senegal'?'start':['kenya','tanzania'].includes(id)?'end':undefined,
        labelPlacement:['morocco','egypt','ghana','senegal','kenya'].includes(id)?'below':undefined};
}
