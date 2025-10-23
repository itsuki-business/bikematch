import Layout from "./Layout.jsx";

import HomeForRegister from "./HomeForRegister";
import HomeForNonRegister from "./HomeForNonRegister";
import PhotographerDetail from "./PhotographerDetail";
import Profile from "./Profile";
import Messages from "./Messages";
import ConversationDetail from "./ConversationDetail";
import Terms from "./Terms";
import Reviews from "./Reviews";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    HomeForRegister: HomeForRegister,
    HomeForNonRegister: HomeForNonRegister,
    PhotographerDetail: PhotographerDetail,
    Profile: Profile,
    Messages: Messages,
    ConversationDetail: ConversationDetail,
    Terms: Terms,
    Reviews: Reviews
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                <Route path="/" element={<HomeForNonRegister />} />
                <Route path="/HomeForRegister" element={<HomeForRegister />} />
                <Route path="/HomeForNonRegister" element={<HomeForNonRegister />} />
                <Route path="/PhotographerDetail" element={<PhotographerDetail />} />
                <Route path="/Profile" element={<Profile />} />
                <Route path="/Messages" element={<Messages />} />
                <Route path="/ConversationDetail" element={<ConversationDetail />} />
                <Route path="/Terms" element={<Terms />} />
                <Route path="/Reviews" element={<Reviews />} />
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}