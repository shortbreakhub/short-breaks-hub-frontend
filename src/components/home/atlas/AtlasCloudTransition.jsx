import React from 'react';
import cloudUrl from '../../../assets/atlas/transitions/watercolor-cloud.webp';
export {cloudUrl};
const banks=[
    ['-155%','-90%','-66%','-66%','65%','50%'],
    ['60%','-145%','-34%','-66%','-155%','70%'],
    ['-110%','55%','-66%','-34%','70%','-155%'],
    ['60%','70%','-34%','-34%','-155%','-110%'],
];
export default function AtlasCloudTransition({phase,reducedMotion}) {
    if(reducedMotion || phase==='idle' || phase==='preparing')return null;
    return <div className="atlas-cloud-transition" data-cloud-phase={phase} aria-hidden="true">
        {banks.map(([fromX,fromY,endX,endY,toX,toY],index)=><img key={index} src={cloudUrl} alt="" draggable={false} width={960} height={640} className="atlas-cloud-bank"
            style={{'--from-x':fromX,'--from-y':fromY,'--end-x':endX,'--end-y':endY,'--to-x':toX,'--to-y':toY}} />)}
    </div>;
}
