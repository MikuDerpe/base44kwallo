import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import BusinessProfile from "./BusinessProfile";

import Generators from "./Generators";

import Chat from "./Chat";

import KnowledgeManager from "./KnowledgeManager";

import Account from "./Account";

import Library from "./Library";

import Landing from "./Landing";

import Notes from "./Notes";

import ContentCalendar from "./ContentCalendar";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    BusinessProfile: BusinessProfile,
    
    Generators: Generators,
    
    Chat: Chat,
    
    KnowledgeManager: KnowledgeManager,
    
    Account: Account,
    
    Library: Library,
    
    Landing: Landing,
    
    Notes: Notes,
    
    ContentCalendar: ContentCalendar,
    
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
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/BusinessProfile" element={<BusinessProfile />} />
                
                <Route path="/Generators" element={<Generators />} />
                
                <Route path="/Chat" element={<Chat />} />
                
                <Route path="/KnowledgeManager" element={<KnowledgeManager />} />
                
                <Route path="/Account" element={<Account />} />
                
                <Route path="/Library" element={<Library />} />
                
                <Route path="/Landing" element={<Landing />} />
                
                <Route path="/Notes" element={<Notes />} />
                
                <Route path="/ContentCalendar" element={<ContentCalendar />} />
                
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