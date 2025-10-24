import Layout from "./Layout.jsx";

import HomeForRegister from "./HomeForRegister";
import HomeForNonRegister from "./HomeForNonRegister";
import PhotographerDetail from "./PhotographerDetail";
import Profile from "./Profile";
import FirstTimeProfileSetup from "./FirstTimeProfileSetup";
import MessageList from "./MessageList";
import UserMessage from "./UserMessage";
import ConversationDetail from "./ConversationDetail";
import Terms from "./Terms";
import Reviews from "./Reviews";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    HomeForRegister: HomeForRegister,
    HomeForNonRegister: HomeForNonRegister,
    PhotographerDetail: PhotographerDetail,
    Profile: Profile,
    FirstTimeProfileSetup: FirstTimeProfileSetup,
    MessageList: MessageList,
    UserMessage: UserMessage,
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
                <Route path="/home-for-register" element={<HomeForRegister />} />
                <Route path="/home-for-non-register" element={<HomeForNonRegister />} />
                <Route path="/photographer-detail" element={<PhotographerDetail />} />
                <Route path="/profile/:userId" element={<Profile />} />
                <Route path="/first-time-profile-setup" element={<FirstTimeProfileSetup />} />
                <Route path="/messages/:myUserId" element={<MessageList />} />
                <Route path="/messages/:myUserId/:otherUserId" element={<UserMessage />} />
                <Route path="/conversation-detail" element={<ConversationDetail />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/reviews" element={<Reviews />} />
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