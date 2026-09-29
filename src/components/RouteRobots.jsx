import {Helmet} from "react-helmet-async";
import {useLocation} from "react-router-dom";
import {getRobotsPolicy} from "../utils/robotsPolicy.js";

export default function RouteRobots() {
    const {pathname} = useLocation();
    const policy = getRobotsPolicy(pathname);

    return (
        <Helmet>
            {policy && <meta name="robots" content={policy} />}
        </Helmet>
    );
}
